export default interface ScanOptions {
  verbose?: boolean;
  appmapDir?: string;
  appmapFile?: string;
  config: string;
  ide?: string;
  commitStatus?: string;
  pullRequestComment?: string;
  reportFile: string;
}
