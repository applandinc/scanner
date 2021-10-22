import { Scope } from 'src/types';
import AppMapContext from './appMapContext';

export default interface ScopeIterator<T> {
  scopes(context: AppMapContext): Generator<Scope<T>>;
}
