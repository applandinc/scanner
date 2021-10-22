import { Event, Label } from '@appland/models';
import Assertion from '../assertion';

class Options {
  constructor(public forbiddenLabel: Label = 'mvc.template') {}
}

function scanner(options: Options = new Options()): Assertion<Event> {
  return Assertion.assert(
    'query-from-view',
    'Queries from view',
    (e: Event) => e.ancestors().some((e: Event) => e.codeObject.labels.has(options.forbiddenLabel)),
    (assertion: Assertion<Event>): void => {
      assertion.where = (e: Event) => !!e.sqlQuery;
      assertion.description = `SQL query from ${options.forbiddenLabel}`;
    }
  );
}

export default { Options, scanner };
