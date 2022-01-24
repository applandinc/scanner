import { Argv } from 'yargs';

export default function (args: Argv): void {
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
    alias: 'd',
  });
  args.option('config', {
    describe: 'path to YAML file with additional checks',
    alias: 'c',
  });
  args.option('report-file', {
    describe: 'file name for findings report',
    default: 'appland-findings.json',
  });
  args.option('api-key', {
    describe:
      'AppMap server API key. Use of this option is discouraged; set APPLAND_API_KEY instead',
  });
  args.option('app', {
    describe:
      'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
  });
}
