import { AppMap } from '@appland/models';
import Assertion from 'src/assertion';
import DataObjectSummary from 'src/labels/dataObjectSummary';
import { verbose } from '../scanner/util';
import { Finding, Scope } from 'src/types';
import AppMapContext from './appMapContext';
import BaseScope from './baseScope';
import ScopeIterator from './scopeIterator';

class DataScopeImpl extends BaseScope<DataObjectSummary> {
  readonly scope: DataObjectSummary;

  constructor(dataObject: DataObjectSummary) {
    super();
    this.scope = dataObject;
  }

  *scopedObjects(): Generator<DataObjectSummary> {
    yield this.scope;
  }

  checkScopeObject(
    dataObject: DataObjectSummary,
    appMap: AppMap,
    assertion: Assertion<DataObjectSummary>
  ): Finding[] {
    const findings: Finding[] = [];

    const buildFinding = (): Finding => {
      return {
        appMapName: appMap.metadata.name,
        scannerId: assertion.id,
        scannerTitle: assertion.summaryTitle,
        event: this.scope.events[0],
        scope: this.scope.events[0],
        message: null,
        condition: assertion.description || assertion.matcher.toString(),
      };
    };

    const matchResult = assertion.matcher(dataObject);
    const numFindings = findings.length;

    if (matchResult === true) {
      findings.push(buildFinding());
    } else if (typeof matchResult === 'string') {
      const finding = buildFinding();
      finding.message = matchResult as string;
      findings.push(finding);
    } else if (matchResult) {
      matchResult.forEach((mr) => {
        const finding = buildFinding();
        if (mr.message) {
          finding.message = mr.message;
        }
        findings.push(finding);
      });
    }

    if (verbose()) {
      if (findings.length > numFindings) {
        findings.forEach((finding) =>
          console.log(`\tFinding: ${finding.scannerId} : ${finding.message || finding.condition}`)
        );
      }
    }

    return findings;
  }
}

export default class DataScope implements ScopeIterator<DataObjectSummary> {
  *scopes(context: AppMapContext): Generator<Scope<DataObjectSummary>> {
    for (let i = 0; i < context.dataObjects.length; i++) {
      yield new DataScopeImpl(context.dataObjects[i]);
    }
  }
}
