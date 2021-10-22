import { AppMap } from '@appland/models';
import Assertion from 'src/assertion';
import { Finding, Scope } from 'src/types';

export default abstract class BaseScope<T> implements Scope<T> {
  abstract get scope(): T;
  abstract scopedObjects(): Generator<T>;
  abstract checkScopeObject(scopeObject: T, appMap: AppMap, assertion: Assertion<T>): Finding[];

  retrieveFindings(appMap: AppMap, assertion: Assertion<T>): Finding[] {
    const findings: Finding[] = [];

    for (const scopeObject of this.scopedObjects()) {
      this.checkScopeObject(scopeObject, appMap, assertion).forEach((finding) => {
        findings.push(finding);
      });
    }

    return findings;
  }
}
