import { Arguments, Argv } from 'yargs';
import { readFile } from 'fs/promises';

import { ScanResults } from '../../report/scanResults';
import { verbose } from '../../rules/util';
import postCommitStatus from '../../integration/github/commitStatus';

import CommandOptions from './options';

export default {
  command: 'update-commit-status',
  describe: 'Update commit status based on the scan results',
  builder(args: Argv): Argv {
    args.option('report-file', {
      describe: 'file containing the findings report',
      default: 'appland-findings.json',
    });

    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    const { verbose: isVerbose, reportFile } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    const scanResults = JSON.parse((await readFile(reportFile)).toString()) as ScanResults;
    // const summaryText = summaryReport(scanResults, false);

    if (scanResults.findings.length > 0) {
      // await postPullRequestComment(summaryText);
      await postCommitStatus(
        'failure',
        `${scanResults.summary.numChecks} checks, ${scanResults.findings.length} findings`
      );
      console.log(`Commit status updated to: failure (${scanResults.findings.length} findings).`);
    } else {
      await postCommitStatus('success', `${scanResults.summary.numChecks} checks passed`);
      console.log(`Commit status updated to: success.`);
    }
  },
};
