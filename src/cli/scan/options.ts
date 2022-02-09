import { IDE } from '../detectIde';
import ScanOptions from '../scanOptions';

export default interface CommandOptions extends ScanOptions {
  all: boolean;
  appmapFile?: string;
  ide?: IDE;
}
