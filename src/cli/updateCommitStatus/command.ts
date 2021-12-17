import yargs, { Arguments, Argv } from 'yargs';
import { readFile } from 'fs/promises';

import { ScanResults } from '../../report/scanResults';
import { verbose } from '../../rules/util';
import postCommitStatus from '../../integration/github/commitStatus';
import fetchStatus from '../../integration/appland/fetchStatus';
import { newFindings } from '../../findings';

import CommandOptions from './options';
import resolveAppId from '../resolveAppId';
import validateFile from '../validateFile';

export default {
  command: 'update-commit-status',
  describe: 'Update commit status based on the scan results',
  builder(args: Argv): Argv {
    args.option('fail', {
      describe: 'exit with non-zero status if there are any new findings',
      default: false,
      type: 'boolean',
    });
    args.option('report-file', {
      describe: 'file containing the findings report',
      default: 'appland-findings.json',
    });
    args.option('appmap-dir', {
      describe: 'base directory of AppMaps',
      alias: 'd',
    });
    args.option('app', {
      describe:
        'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
    });

    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    const {
      verbose: isVerbose,
      fail,
      reportFile,
      appmapDir,
      app: appIdArg,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    if (appmapDir) await validateFile('directory', appmapDir!);
    const appId = await resolveAppId(appIdArg, appmapDir);

    const scanResults = JSON.parse((await readFile(reportFile)).toString()) as ScanResults;
    // const summaryText = summaryReport(scanResults, false);

    const findingStatus = await fetchStatus(appId);
    const findings = newFindings(scanResults.findings, findingStatus);
    if (findings.length > 0) {
      // await postPullRequestComment(summaryText);
      await postCommitStatus(
        'failure',
        `${scanResults.summary.numChecks} checks, ${findings.length} findings`
      );
      console.log(`Commit status updated to: failure (${findings.length} findings).`);

      if (fail) {
        yargs.exit(1, new Error(`${findings.length} findings`));
      }
    } else {
      await postCommitStatus('success', `${scanResults.summary.numChecks} checks passed`);
      console.log(`Commit status updated to: success.`);
    }
  },
};
