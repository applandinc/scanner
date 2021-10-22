import { AbortError } from './errors';
import { AssertionPrototype, Finding } from './types';
import { verbose } from './scanner/util';
import AppMapContext from './scope/appMapContext';
import { Scopes } from './scopes';

export default class AssertionChecker {
  check(context: AppMapContext, assertionPrototype: AssertionPrototype, matches: Finding[]): void {
    const { appMap } = context;

    if (verbose()) {
      console.warn(`Checking AppMap ${appMap.name}`);
    }

    if (!((assertionPrototype.scope as string) in Scopes)) {
      throw new AbortError(`Invalid scope name "${assertionPrototype.scope}"`);
    }
    const scopeIterator = new Scopes[assertionPrototype.scope]();
    for (const scope of scopeIterator.scopes(context)) {
      const assertion = assertionPrototype.build();
      scope.retrieveFindings(appMap, assertion).forEach((finding) => {
        matches.push(finding);
      });
    }
  }
}
