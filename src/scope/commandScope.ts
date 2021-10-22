import { Event, EventNavigator } from '@appland/models';
import { Scope } from 'src/types';
import AppMapContext from './appMapContext';
import BaseScope from './baseScope';
import EventScopeImpl from './eventScopeImpl';
import EventScopeIterator from './eventScopeIterator';

class ScopeImpl extends EventScopeImpl {
  scope: Event;
  descendants: EventNavigator;

  constructor(event: Event) {
    super(event);
    this.scope = event;
    this.descendants = new EventNavigator(event);
  }

  *scopedObjects(): Generator<Event> {
    yield this.scope;

    for (const event of this.descendants.descendants()) {
      yield event.event;
    }
  }
}

export default class CommandScope extends EventScopeIterator {
  *scopes(context: AppMapContext): Generator<Scope<Event>> {
    const events = context.callEvents();
    for (const event of events) {
      if (event.isCall()) {
        if (
          event.codeObject.labels.has('command') ||
          event.codeObject.labels.has('job') ||
          event.httpServerRequest
        ) {
          yield new ScopeImpl(event);

          this.advanceToReturnEvent(event, events);
        }
      }
    }
  }
}
