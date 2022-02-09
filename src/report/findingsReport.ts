import chalk from 'chalk';

import { IDE } from '../cli/detectIde';
import ideLink from './ideLink';
import { ScanResults } from './scanResults';

function writeln(text = ''): void {
  process.stdout.write(text);
  process.stdout.write('\n');
}

export default function (scanResults: ScanResults, ide?: IDE): void {
  const { findings, appMapMetadata } = scanResults;
  if (findings.length === 0) {
    return;
  }
  console.log();
  findings.forEach((finding) => {
    const rule = scanResults.checks
      .map((check) => check.rule)
      .find((rule) => rule.id === finding.ruleId)!;
    const fileLink = ideLink(finding, rule, ide);
    let eventMsg = `\tEvent:\t${finding.event.id} - ${finding.event.toString()}`;
    if (finding.event.elapsedTime !== undefined) {
      eventMsg += ` (${finding.event.elapsedTime}s)`;
    }

    const message = finding.message;
    writeln(chalk.magenta(message));
    writeln(`\tLink:\t${chalk.blue(fileLink)}`);
    writeln(`\tRule:\t${finding.ruleId}`);
    writeln(`\tAppMap name:\t${appMapMetadata[finding.appMapFile].name}`);
    writeln(eventMsg);
    writeln(`\tScope:\t${finding.scope.id} - ${finding.scope.toString()}`);
    if (finding.stack.length > 0) {
      writeln(`\tStack trace:`);
      finding.stack.forEach((frame) => console.log(`\t\t${frame}`));
    }
    writeln();
  });
}
