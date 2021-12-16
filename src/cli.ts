#!/usr/bin/env node

import { glob as globCallback } from 'glob';
import { promisify } from 'util';
import { ValidationError, AbortError } from './errors';
import yargs, { Argv, Arguments } from 'yargs';
import { verbose } from './rules/util';
import { join } from 'path';
import postCommitStatus from './integration/github/commitStatus';
import postPullRequestComment from './integration/github/postPullRequestComment';
import Generator from './report/generator';
import { ScanResults } from './report/scanResults';
import { parseConfigFile, loadConfig } from './configuration/configurationProvider';
import { generatePublishArtifact } from './report/publisher';
import validateFile from './cli/validateFile';
import ScanOptions from './cli/scanOptions';
import { ExitCode } from './cli/exitCode';
import scan from './cli/scan';
import { readFile, writeFile } from 'fs/promises';
import UploadOptions from './cli/uploadOptions';
import UpdatePRStatusOptions from './cli/updatePRStatusOptions';
import summaryReport from './report/summaryReport';
import { FindingStatusListItem } from '@appland/client';

yargs(process.argv.slice(2))
  .command(
    'scan',
    'Scan AppMaps for code behavior findings',
    (args: Argv): Argv => {
      args.options('verbose', {
        describe: 'Show verbose output',
        alias: 'v',
      });
      args.option('appmap-dir', {
        describe: 'directory to recursively inspect for AppMaps',
        alias: 'd',
      });
      args.option('appmap-file', {
        describe: 'single file to scan',
        alias: 'f',
      });
      args.option('config', {
        describe:
          'path to assertions config file (TypeScript or YAML, check docs for configuration format)',
        default: join(__dirname, './sampleConfig/default.yml'),
        alias: 'c',
      });
      args.option('ide', {
        describe: 'choose your IDE protocol to open AppMaps directly in your IDE.',
        options: ['vscode', 'x-mine', 'idea', 'pycharm'],
      });
      args.option('commit-status', {
        describe: 'set your repository hosting system to post commit status',
        options: ['github'],
      });
      args.option('pull-request-comment', {
        describe:
          'set your repository hosting system to post pull request comment with findings summary',
        options: ['github'],
      });
      args.option('report-file', {
        describe: 'file name for findings report',
        default: 'appland-findings.json',
      });

      return args.strict();
    },
    async function (options: Arguments) {
      const {
        appmapDir,
        appmapFile,
        config,
        verbose: isVerbose,
        ide,
        reportFile,
      } = options as unknown as ScanOptions;

      if (isVerbose) {
        verbose(true);
      }

      try {
        if (appmapFile && appmapDir) {
          throw new ValidationError('Use --appmap-dir or --appmap-file, but not both');
        }
        if (!appmapFile && !appmapDir) {
          throw new ValidationError('Either --appmap-dir or --appmap-file is required');
        }

        let files: string[] = [];
        if (appmapDir) {
          await validateFile('directory', appmapDir!);
          const glob = promisify(globCallback);
          files = await glob(`${appmapDir}/**/*.appmap.json`);
        }
        if (appmapFile) {
          await validateFile('file', appmapFile);
          files = [appmapFile];
        }

        const configData = await parseConfigFile(config);
        const checks = await loadConfig(configData);

        const { appMapMetadata, findings } = await scan(files, checks);

        const reportGenerator = new Generator(ide);

        const scanResults = new ScanResults(configData, appMapMetadata, findings, checks);

        reportGenerator.generate(scanResults, appMapMetadata);

        await writeFile(reportFile, JSON.stringify(scanResults, null, 2));

        return process.exit(findings.length === 0 ? 0 : ExitCode.Finding);
      } catch (err) {
        if (err instanceof ValidationError) {
          console.warn(err.message);
          return process.exit(ExitCode.ValidationError);
        }
        if (err instanceof AbortError) {
          return process.exit(ExitCode.AbortError);
        }
        if (!verbose && err instanceof Error) {
          console.error(err.message);
          return process.exit(ExitCode.RuntimeError);
        }

        throw err;
      }
    }
  )
  .command(
    'upload',
    'Upload Findings to the AppMap Server',
    (args: Argv): Argv => {
      args.option('appmap-dir', {
        describe: 'directory to recursively inspect for AppMaps',
        alias: 'd',
      });
      args.option('report-file', {
        describe: 'file name for findings report',
        default: 'appland-findings.json',
      });
      args.option('app', {
        describe:
          'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
      });
      return args.strict();
    },
    async function (options: Arguments) {
      const {
        verbose: isVerbose,
        reportFile,
        appMapDir,
        app: appId,
      } = options as unknown as UploadOptions;

      if (isVerbose) {
        verbose(true);
      }

      const scanResults = JSON.parse((await readFile(reportFile)).toString()) as ScanResults;
      await generatePublishArtifact(scanResults, appMapDir as string, appId);
    }
  )
  .command(
    'update-pr-status',
    'Update pull request status',
    (args: Argv): Argv => {
      args.option('report-file', {
        describe: 'file name for findings report',
        default: 'appland-findings.json',
      });
      return args.strict();
    },
    async function (options: Arguments) {
      const { verbose: isVerbose, reportFile } = options as unknown as UpdatePRStatusOptions;

      if (isVerbose) {
        verbose(true);
      }

      const scanResults = JSON.parse((await readFile(reportFile)).toString()) as ScanResults;
      const summaryText = summaryReport(scanResults, false);

      if (scanResults.findings.length > 0) {
        await postPullRequestComment(summaryText);
        await postCommitStatus('failure', `${scanResults.findings.length} findings`);
      } else {
        await postCommitStatus('success', `${scanResults.summary.numChecks} checks passed`);
      }
    }
  )
  .fail((msg, err, yargs) => {
    if (msg) {
      console.log(yargs.help());
      console.log(msg);
    } else if (err) {
      console.error(err);
    }
    process.exit(1);
  })
  .strict()
  .demandCommand()
  .help().argv;
