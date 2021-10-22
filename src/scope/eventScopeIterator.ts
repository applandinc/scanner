import { Event } from '@appland/models';
import { Scope } from 'src/types';
import AppMapContext from './appMapContext';
import ScopeIterator from './scopeIterator';

export default abstract class EventScopeIterator implements ScopeIterator<Event> {
  abstract scopes(context: AppMapContext): Generator<Scope<Event>>;

  // Scan ahead past the return event.
  protected advanceToReturnEvent(event: Event, events: Generator<Event>): void {
    let eventResult = events.next();
    while (!eventResult.done) {
      if (eventResult.value.isReturn() && eventResult.value.parent?.id === event.id) {
        break;
      }
      eventResult = events.next();
    }
  }
}
