import { Arguments, Argv } from 'yargs';
import { readFile } from 'fs/promises';

import { ValidationError } from '../../errors';
import { generatePublishArtifact } from '../../report/publisher';
import { ScanResults } from '../../report/scanResults';
import { verbose } from '../../rules/util';

import validateFile from '../validateFile';

import CommandOptions from './options';

export default {
  command: 'upload',
  describe: 'Upload Findings to the AppMap Server',
  builder(args: Argv): Argv {
    args.option('appmap-dir', {
      describe: 'base directory of AppMaps',
      alias: 'd',
    });
    args.option('report-file', {
      describe: 'file containing the findings report',
      default: 'appland-findings.json',
    });
    args.option('app', {
      describe:
        'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
    });
    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    const {
      verbose: isVerbose,
      reportFile,
      appmapDir,
      app: appId,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    if (!appmapDir) {
      throw new ValidationError('--appmap-dir is required');
    }

    await validateFile('directory', appmapDir!);

    const scanResults = JSON.parse((await readFile(reportFile)).toString()) as ScanResults;
    await generatePublishArtifact(scanResults, appmapDir as string, appId);
  },
};
