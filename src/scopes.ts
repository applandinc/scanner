import AllScope from './scope/allScope';
import CommandScope from './scope/commandScope';
import DataScope from './scope/dataScope';
import HTTPServerRequestScope from './scope/httpServerRequestScope';
import RootScope from './scope/rootScope';
import ScopeIterator from './scope/scopeIterator';

const allScopes = {
  all: AllScope,
  root: RootScope,
  command: CommandScope,
  http_server_request: HTTPServerRequestScope,
  data: DataScope,
};

type Constructor<T> = new (...args: unknown[]) => T;

export const Scopes: Readonly<{
  [key: string]: Constructor<ScopeIterator<unknown>>;
}> = allScopes;

export type ScopeName = keyof typeof allScopes;
