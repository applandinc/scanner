import { AppMap, Event } from '@appland/models';
import Assertion from './assertion';
import DataObjectSummary from './labels/dataObjectSummary';
import { ScopeName } from './scopes';

interface Scope<T> {
  scope: T;
  scopedObjects: () => Generator<T>;
  retrieveFindings(appMap: AppMap, assertion: Assertion<T>): Finding[];
}

export type Level = 'warning' | 'error';

type ObjectFilter<T> = (obj: T, appMap: AppMap) => boolean;
type EventFilter = ObjectFilter<Event>;
type DataFilter = ObjectFilter<DataObjectSummary>;

export interface MatchResult {
  level: Level;
  message?: string;
}

type Matcher<T> = (obj: T) => boolean | string | MatchResult[] | undefined;
export interface Finding {
  appMapName: string;
  appMapFile?: string;
  scannerId: string;
  scannerTitle: string;
  event: Event;
  scope: Event;
  message: string | null;
  condition: string;
}

interface Configuration {
  scanners: AssertionConfig[];
}

interface AssertionConfig {
  readonly id: string;
  readonly include?: string[];
  readonly exclude?: string[];
  readonly description?: string;
  readonly properties?: Record<string, string | string[] | number>;
}

interface AssertionPrototype {
  config: AssertionConfig;
  scope: ScopeName;
  build(): Assertion<unknown>;
}
