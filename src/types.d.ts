import { AppMap, Event } from '@appland/models';

export type Scope =
  | 'event'
  | 'http_client_request'
  | 'http_server_request'
  | 'sql_query'
  | 'function';

type EventFilter = (e: Event, appMap: AppMap) => boolean;

export interface AssertionMatch {
  appMapName: string;
  appMapFile?: string;
  scannerId: string;
  scannerTitle: string;
  event: Event;
  condition: string;
}
