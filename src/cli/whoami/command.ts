import { url } from 'inspector';
import { Arguments, Argv } from 'yargs';

import { verbose } from '../../rules/util';
import { serverURL, username } from '../login/loginContext';

import CommandOptions from '../whoami/options';

export default {
  command: 'whoami',
  describe: 'Print the URL and username of your logged in account',
  builder(args: Argv): Argv {
    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    const { verbose: isVerbose } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    console.log(`Server URL: ${await serverURL()}`);
    console.log(`Username:   ${await username()}`);
  },
};
