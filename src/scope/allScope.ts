import { Event } from '@appland/models';
import { Scope } from 'src/types';
import AppMapContext from './appMapContext';
import EventScopeImpl from './eventScopeImpl';
import EventScopeIterator from './eventScopeIterator';

class ScopeImpl extends EventScopeImpl {
  scope: Event;
  private eventsIter: Generator<Event>;

  constructor(events: Generator<Event>) {
    const event = events.next().value;
    super(event);

    this.eventsIter = events;
    this.scope = event;
  }

  *scopedObjects(): Generator<Event> {
    if (this.scope) {
      yield this.scope;
    }

    for (const event of this.eventsIter) {
      yield event;
    }
  }
}

export default class AllScope extends EventScopeIterator {
  *scopes(context: AppMapContext): Generator<Scope<Event>> {
    yield new ScopeImpl(context.callEvents());
  }
}
