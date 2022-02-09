import { Event } from '@appland/models';

let isVerbose = false;
function verbose(v: boolean | null = null): boolean {
  if (v === true || v === false) {
    isVerbose = v;
  }
  return isVerbose;
}

function capitalize(str: string): string {
  if (!str || str === '') {
    return str;
  }
  return [str.charAt(0).toUpperCase(), str.slice(1)].join('');
}

function emptyValue(value: string): boolean {
  return [null, undefined, ''].includes(value);
}

function responseContentType(event: Event): string | undefined {
  if (event.httpServerResponse?.headers) {
    return event.httpServerResponse!.headers!['Content-Type'];
  } else if (event.httpClientResponse?.headers) {
    return event.httpClientResponse!.headers!['Content-Type'];
  }
}

function appMapDir(appMapFileName: string): string {
  return appMapFileName.substring(0, appMapFileName.length - '.appmap.json'.length);
}

// eslint-disable-next-line
function isFalsey(valueObj: any): boolean {
  if (!valueObj) {
    return true;
  }
  if (valueObj.class === 'FalseClass') {
    return true;
  }
  if (valueObj.class === 'Array' && valueObj.value === '[]') {
    return true;
  }
  if (valueObj.value === '') {
    return true;
  }

  return false;
}

const isTruthy = (valueObj: unknown): boolean => !isFalsey(valueObj);

function providesAuthentication(event: Event, label: string): boolean {
  return event.returnValue && event.labels.has(label) && isTruthy(event.returnValue.value);
}

const toRegExp = (value: string | RegExp): RegExp => {
  return typeof value === 'string' ? new RegExp(value as string) : (value as RegExp);
};

const toRegExpArray = (value: string[] | RegExp[]): RegExp[] => {
  return value.map(toRegExp);
};

const RootLabels = ['command', 'job'];

const isRoot = (event: Event | undefined): boolean => {
  if (!event) {
    return true;
  }
  return (
    !!event.httpServerRequest || RootLabels.some((label) => event.codeObject.labels.has(label))
  );
};

export {
  appMapDir,
  capitalize,
  emptyValue,
  isFalsey,
  isTruthy,
  isRoot,
  providesAuthentication,
  toRegExp,
  responseContentType,
  toRegExpArray,
  verbose,
};
