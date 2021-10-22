import { DataObject } from 'src/labels/dataObject';
import Assertion from '../assertion';

function scanner(): Assertion<DataObject> {
  return Assertion.assert(
    'plaintext-passwords',
    'Plaintext passwords',
    (obj: DataObject) =>
      obj.labels?.has('content.password') && obj?.labels?.has('storage.database'),
    (assertion: Assertion<DataObject>): void => {
      assertion.where = (obj: DataObject) => Boolean(obj.labels?.has('crypto.bcrypt'));
      assertion.description = 'Password is written to database in plain text';
    }
  );
}

export default { scope: 'data', scanner };
