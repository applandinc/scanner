import { glob as globCallback } from 'glob';
import { promisify } from 'util';
import { ValidationError, AbortError } from './errors';
import { Argv, Arguments } from 'yargs';
import { verbose } from './rules/util';
import { join } from 'path';
import postCommitStatus from './integration/github/commitStatus';
import postPullRequestComment from './integration/github/postPullRequestComment';
import Generator from './report/generator';
import { ScanResults } from './report/scanResults';
import { parseConfigFile, loadConfig } from './configuration/configurationProvider';
import { generatePublishArtifact } from './report/publisher';
import validateFile from './cli/validateFile';
import CommandOptions from './cli/commandOptions';
import { ExitCode } from './cli/exitCode';
import scan from './cli/scan';
import { writeFile } from 'fs/promises';

export default {
  command: '$0',
  describe: 'Run assertions for AppMaps in the directory',

  builder(args: Argv): Argv {
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
    args.option('publish', {
      describe: 'publish findings to AppMap Server',
      type: 'boolean',
    });
    args.option('app', {
      describe:
        'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
    });

    return args.strict();
  },

  async handler(options: Arguments): Promise<void> {
    const {
      appmapDir,
      appmapFile,
      config,
      verbose: isVerbose,
      ide,
      commitStatus,
      pullRequestComment,
      reportFile,
      publish,
      app: appId,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    try {
      if (commitStatus) {
        postCommitStatus('pending', 'Validation is in progress...');
      }

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

      const summaryText = reportGenerator.generate(scanResults, appMapMetadata);

      await writeFile(reportFile, JSON.stringify(scanResults, null, 2));

      if (publish) {
        await generatePublishArtifact(scanResults, appmapDir as string, appId);
      }

      if (pullRequestComment && findings.length > 0) {
        try {
          await postPullRequestComment(summaryText);
        } catch (err) {
          console.warn('Unable to post pull request comment');
        }
      }

      if (commitStatus) {
        return findings.length === 0
          ? await postCommitStatus('success', `${files.length * checks.length} checks passed`)
          : await postCommitStatus('failure', `${findings.length} findings`);
      }

      return process.exit(findings.length === 0 ? 0 : ExitCode.Finding);
    } catch (err) {
      if (commitStatus) {
        try {
          await postCommitStatus('error', 'There was an error while running AppMap scanner');
        } catch (err) {
          console.warn('Unable to post commit status');
        }
      }

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
  },
};
