import { AppMap, Event } from '@appland/models';
import { EventFilter, MatchResult, Rule, RuleLogic } from '../types';
import * as types from './types';
import { countJoins, SQLCount, sqlStrings } from '../database';
import { URL } from 'url';

export interface JoinCount extends SQLCount {
  joins: number;
}

class Options implements types.TooManyJoins.Options {
  public warningLimit = 5;
}

// TODO: clean up (https://github.com/applandinc/scanner/issues/43)
function build(options: Options = new Options()): RuleLogic {
  const joinCount: Record<string, JoinCount> = {};
  function matcher(
    command: Event,
    _appMap: AppMap,
    eventFilter: EventFilter
  ): MatchResult[] | undefined {
    for (const sqlEvent of sqlStrings(command, eventFilter)) {
      let occurrence = joinCount[sqlEvent.sql];

      if (!occurrence) {
        occurrence = {
          count: 1,
          joins: countJoins(sqlEvent.sql),
          events: [sqlEvent.event],
        };
        joinCount[sqlEvent.sql] = occurrence;
      } else {
        occurrence.count += 1;
        occurrence.events.push(sqlEvent.event);
      }
    }

    return Object.keys(joinCount).reduce((matchResults, sql) => {
      const occurrence = joinCount[sql];

      if (occurrence.joins >= options.warningLimit) {
        matchResults.push({
          level: 'warning',
          event: occurrence.events[0],
          message: `${occurrence.joins} join${occurrence.joins > 1 ? 's' : ''} in SQL "${sql}"`,
          relatedEvents: occurrence.events,
        });
      }
      return matchResults;
    }, [] as MatchResult[]);
  }

  return {
    matcher,
  };
}

export default {
  id: 'too-many-joins',
  title: 'Too many joins',
  scope: 'command',
  impactDomain: 'Performance',
  enumerateScope: false,
  enabled: true,
  references: {
    'CWE-1049': new URL('https://cwe.mitre.org/data/definitions/1049.html'),
  },
  Options,
  build,
} as Rule;
