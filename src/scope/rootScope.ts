import { Event } from '@appland/models';
import { Scope } from 'src/types';
import AppMapContext from './appMapContext';
import EventScopeImpl from './eventScopeImpl';
import EventScopeIterator from './eventScopeIterator';

export default class RootScope extends EventScopeIterator {
  *scopes(context: AppMapContext): Generator<Scope<Event>> {
    const events = context.callEvents();
    for (const event of events) {
      if (event.isCall()) {
        if (!event.parent) {
          yield new EventScopeImpl(event);

          this.advanceToReturnEvent(event, events);
        }
      }
    }
  }
}
