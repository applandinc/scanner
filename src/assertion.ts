import { ObjectFilter, Matcher } from './types';

export default class Assertion<T> {
  public where?: ObjectFilter<T>;
  public include: ObjectFilter<T>[];
  public exclude: ObjectFilter<T>[];
  public description?: string;
  public options?: any;

  static assert<T>(
    id: string,
    summaryTitle: string,
    matcher: Matcher<T>,
    cb?: (assertion: Assertion<T>) => void
  ): Assertion<T> {
    const assertion = new Assertion(id, summaryTitle, matcher);
    if (cb) {
      cb(assertion);
    }
    return assertion;
  }

  constructor(public id: string, public summaryTitle: string, public matcher: Matcher<T>) {
    this.include = [];
    this.exclude = [];
  }

  toString(): string {
    const tokens = [`[${this.id}]`];
    if (this.description) {
      tokens.push(this.description);
    } else {
      tokens.push(this.matcher.toString());
    }
    if (this.where) {
      tokens.push(`(where ${this.where})`);
    }
    if (this.include.length > 0) {
      tokens.push(`(include ${this.include.join(' && ')})`);
    }
    if (this.exclude.length > 0) {
      tokens.push(`(exclude ${this.exclude.join(' || ')})`);
    }
    return tokens.join(' ');
  }
}
