import { AppMap, Event, EventNavigator } from '@appland/models';
import Assertion from 'src/assertion';
import { verbose } from '../scanner/util';
import { Finding } from 'src/types';
import BaseScope from './baseScope';

export default class EventScopeImpl extends BaseScope<Event> {
  scope: Event;
  descendants: EventNavigator;

  constructor(event: Event) {
    super();
    this.scope = event;
    this.descendants = new EventNavigator(event);
  }

  *scopedObjects(): Generator<Event> {
    yield this.scope;

    for (const event of this.descendants.descendants()) {
      yield event.event;
    }
  }

  doesMatch(event: Event, appMap: AppMap, assertion: Assertion<Event>): boolean {
    if (!event.isCall()) {
      return false;
    }

    if (verbose()) {
      console.warn(`Asserting ${assertion.id} on event ${event.toString()}`);
    }

    if (!event.returnEvent) {
      if (verbose()) {
        console.warn(`\tEvent has no returnEvent. Skipping.`);
      }
      return false;
    }

    if (assertion.where && !assertion.where(event, appMap)) {
      if (verbose()) {
        console.warn(`\t'where' clause is not satisifed. Skipping.`);
      }
      return false;
    }

    if (assertion.include.length > 0 && !assertion.include.every((fn) => fn(event, appMap))) {
      if (verbose()) {
        console.warn(`\t'include' clause is not satisifed. Skipping.`);
      }
      return false;
    }

    if (assertion.exclude.length > 0 && assertion.exclude.some((fn) => fn(event, appMap))) {
      if (verbose()) {
        console.warn(`\t'exclude' clause is not satisifed. Skipping.`);
      }
      return false;
    }

    return true;
  }

  checkScopeObject(event: Event, appMap: AppMap, assertion: Assertion<Event>): Finding[] {
    const findings: Finding[] = [];

    if (this.doesMatch(event, appMap, assertion)) {
      const buildFinding = (): Finding => {
        return {
          appMapName: appMap.metadata.name,
          scannerId: assertion.id,
          scannerTitle: assertion.summaryTitle,
          event,
          scope: this.scope,
          message: null,
          condition: assertion.description || assertion.matcher.toString(),
        };
      };

      const matchResult = assertion.matcher(event);
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
    }

    return findings;
  }
}
