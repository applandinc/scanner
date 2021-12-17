import { glob as globCallback } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';
import { Arguments, Argv } from 'yargs';

import { buildAppMap, Metadata } from '@appland/models';

import { loadConfig, parseConfigFile } from '../../configuration/configurationProvider';
import { AbortError, ValidationError } from '../../errors';
import Generator from '../../report/generator';
import { ScanResults } from '../../report/scanResults';
import { verbose } from '../../rules/util';
import Check from '../../check';
import RuleChecker from '../../ruleChecker';
import { Finding } from '../../types';

import { ExitCode } from '../exitCode';
import validateFile from '../validateFile';
import progressReporter from '../progressReporter';

import CommandOptions from './options';

type Result = {
  appMapMetadata: Record<string, Metadata>;
  findings: Finding[];
};

async function scan(files: string[], checks: Check[]): Promise<Result> {
  const checker = new RuleChecker();
  const appMapMetadata: Record<string, Metadata> = {};
  const findings: Finding[] = [];

  await Promise.all(
    files.map(async (file: string) => {
      // TODO: Improve this by respecting .gitignore, or similar.
      // For now, this addresses the main problem of encountering appmap-js and its appmap.json files
      // in a bundled node_modules.
      if (file.split('/').includes('node_modules')) {
        return null;
      }
      const appMapData = await readFile(file, 'utf8');
      const appMap = buildAppMap(appMapData).normalize().build();
      appMapMetadata[file] = appMap.metadata;

      await Promise.all(
        checks.map(async (check) => {
          const matchCount = findings.length;
          await checker.check(file, appMap, check, findings);
          const newMatches = findings.slice(matchCount, findings.length);
          newMatches.forEach((match) => (match.appMapFile = file));
          process.stderr.write(progressReporter(newMatches));
        })
      );
    })
  );

  return { appMapMetadata, findings };
}

export default {
  command: 'scan',
  describe: 'Scan AppMaps for code behavior findings',
  builder(args: Argv): Argv {
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
  async handler(options: Arguments): Promise<void> {
    const {
      appmapDir,
      appmapFile,
      config,
      verbose: isVerbose,
      ide,
      reportFile,
    } = options as unknown as CommandOptions;

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
  },
};
