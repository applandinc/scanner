import { Event } from '@appland/models';
import types from './types';
import { MatcherResult, Rule, RuleLogic, ScopeName } from '../types';
import MatchPatternConfig from 'src/configuration/types/matchPatternConfig';
import { buildFilter, buildFilters } from './lib/matchPattern';

class Options implements types.IllegalPackageDependency.Options {
  public callerPackages: MatchPatternConfig[] = [];
  public calleePackage: MatchPatternConfig = {} as MatchPatternConfig;
}

function build(options: Options): RuleLogic {
  const callerPatterns = buildFilters(options.callerPackages || []);
  const calleePattern = buildFilter(options.calleePackage);

  function where(e: Event): boolean {
    return !!e.parent && !!e.parent!.codeObject.packageOf && calleePattern(e.codeObject.packageOf);
  }

  function matcher(e: Event): MatcherResult {
    const packageNamesStr = options.callerPackages
      .map((config) => config.equal || config.include || config.match)
      .map(String)
      .join(' or ');

    const parentPackage = e.parent!.codeObject.packageOf;
    if (
      !(
        e.codeObject.packageOf === parentPackage ||
        callerPatterns.some((pattern) => pattern(parentPackage))
      )
    ) {
      return `Code object ${e.codeObject.id} was invoked from ${parentPackage}, not from ${packageNamesStr}`;
    }
  }

  return { where, matcher };
}

export default {
  id: 'illegal-package-dependency',
  title: 'Illegal use of code by a non-whitelisted package',
  scope: 'command' as ScopeName,
  enumerateScope: true,
  build,
} as Rule;
