export default interface CommandOptions {
  verbose?: boolean;
  appmapDir?: string;
  appmapFile?: string;
  config: string;
  ide?: string;
  commitStatus?: string;
  pullRequestComment?: string;
  reportFile: string;
  publish?: boolean;
  app?: string;
}
