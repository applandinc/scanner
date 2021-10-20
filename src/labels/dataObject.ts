import { ParameterObject, ReturnValueObject } from '@appland/models';
import SecretPatterns from '../scanner/secretsRegexes.json';

export type DataObject = Partial<ParameterObject> & ReturnValueObject & { labels?: Set<string> };
type LabelResolver = (obj: DataObject) => boolean;

const LABELS: { [key: string]: LabelResolver[] } = {
  hexadecimal: [(obj) => obj.value.match(/^[a-fA-F\d]+$/) !== null],
  secret: [
    (obj) =>
      Object.values(SecretPatterns)
        .flat()
        .some((pattern) => new RegExp(pattern).test(obj.value)),
    (obj) =>
      obj.name !== undefined &&
      [/password/i, /api_?key/i, /private_?key/i, /secret/i].some((regex) =>
        regex.test(obj.name as string)
      ),
  ],
};

export default function getDataObjectLabels(obj: DataObject): Set<string> {
  const labels = Object.entries(LABELS)
    .filter(([, resolvers]) => [resolvers].flat().some((resolver) => resolver(obj)))
    .map(([label]) => label);

  return new Set(labels);
}
