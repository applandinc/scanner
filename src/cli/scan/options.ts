export default interface CommandOptions {
  verbose?: boolean;
  appmapDir?: string;
  appmapFile?: string;
  config: string;
  app?: string;
  ide?: string;
  reportNewFindings?: boolean;
  fail?: boolean;
  interactive?: boolean;
  reportFile: string;
}
