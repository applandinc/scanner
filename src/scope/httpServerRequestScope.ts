import { Event } from '@appland/models';
import { Scope } from 'src/types';
import AppMapContext from './appMapContext';
import ScopeImpl from './eventScopeImpl';
import EventScopeIterator from './eventScopeIterator';

export default class HTTPServerRequestScope extends EventScopeIterator {
  *scopes(context: AppMapContext): Generator<Scope<Event>> {
    const events = context.callEvents();
    for (const event of events) {
      if (event.isCall()) {
        if (event.httpServerRequest) {
          yield new ScopeImpl(event);

          this.advanceToReturnEvent(event, events);
        }
      }
    }
  }
}
