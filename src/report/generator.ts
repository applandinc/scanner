import chalk from 'chalk';
import { ideLink } from '../rules/util';
import { ScanResults } from './scanResults';
import { Metadata } from '@appland/models';
import summaryReport from './summaryReport';

export default class Generator {
  constructor(private ide: string | undefined) {}

  generate(scanSummary: ScanResults, appMapMetadata: Record<string, Metadata>): string {
    this.writeln();

    const { findings } = scanSummary;
    if (findings.length > 0) {
      this.writeln(`${findings.length} findings:`);

      findings.forEach((finding) => {
        const filePath =
          this.ide && finding.appMapFile
            ? ideLink(finding.appMapFile, this.ide, finding.event.id)
            : finding.appMapFile;
        let eventMsg = `\tEvent:\t${finding.event.id} - ${finding.event.toString()}`;
        if (finding.event.elapsedTime !== undefined) {
          eventMsg += ` (${finding.event.elapsedTime}s)`;
        }

        const message = finding.message;
        this.writeln(chalk.magenta(message));
        this.writeln(`\tLink:\t${chalk.blue(filePath)}`);
        this.writeln(`\tRule:\t${finding.ruleId}`);
        this.writeln(`\tAppMap name:\t${appMapMetadata[finding.appMapFile].name}`);
        this.writeln(eventMsg);
        this.writeln(`\tScope:\t${finding.scope.id} - ${finding.scope.toString()}`);
        if (finding.relatedEvents) {
          this.writeln(`\tRelated events:`);
          for (const event of finding.relatedEvents) {
            this.writeln(`\t\t${event.id} - ${event.codeObject.packageOf}/${event.toString()}`);
          }
        }
        this.writeln();
      });
    }

    const colouredSummary = summaryReport(scanSummary, true);
    const summary = summaryReport(scanSummary, false);

    this.write(colouredSummary);

    return summary;
  }

  private write(text: string): void {
    this.writeText(text);
  }

  private writeln(text = ''): void {
    this.writeText(text + '\n');
  }

  private writeText(text: string): void {
    process.stdout.write(text);
  }
}
