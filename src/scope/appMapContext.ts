import { AppMap, Event } from '@appland/models';
import DataObjectSummary from 'src/labels/dataObjectSummary';

export default class AppMapContext {
  constructor(readonly appMap: AppMap, readonly dataObjects: readonly DataObjectSummary[]) {}

  *callEvents(): Generator<Event> {
    for (let i = 0; i < this.appMap.events.length; i++) {
      const event = this.appMap.events[i];
      if (event.isCall()) {
        yield event;
      }
    }
  }
}
