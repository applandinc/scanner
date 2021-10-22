import { Event, ParameterObject, ReturnValueObject } from '@appland/models';
import SecretPatterns from '../analyzer/secretsRegexesData.json';

export type DataObject = Partial<ParameterObject> & ReturnValueObject & { labels?: Set<string> };
type LabelResolver = (obj: DataObject, event: Event) => boolean;

const LABELS: { [key: string]: LabelResolver[] } = {
  hexadecimal: [(obj) => obj.value.match(/^[a-fA-F\d]+$/) !== null],
  secret: [
    (obj) =>
      Object.values(SecretPatterns)
        .flat()
        .some((pattern) => new RegExp(pattern).test(obj.value)),
  ],
  'content.password': [(obj) => /password/i.test(obj.name as string)],
  'content.api_key': [(obj) => /api_?key/i.test(obj.name as string)],
  'content.private_key': [(obj) => /private_?key/i.test(obj.name as string)],
  'crypto.bcrypt': [(obj) => /^\$2[abxy]\$\d+\$[./A-Za-z0-9]{53}$/.test(obj.value)],
  'source.user': [(_, event) => Boolean(event.httpServerRequest)],
  'storage.database': [(_, event) => Boolean(event.sqlQuery?.match(/(INSERT|UPDATE)\s/i))],
};

export default function getDataObjectLabels(obj: DataObject, event: Event): Set<string> {
  const labels = Object.entries(LABELS)
    .filter(([, resolvers]) => [resolvers].flat().some((resolver) => resolver(obj, event)))
    .map(([label]) => label);

  return new Set(labels);
}
