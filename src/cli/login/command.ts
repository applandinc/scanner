import yargs, { Arguments, Argv } from 'yargs';

import { verbose } from '../../rules/util';
import { serverURL, setAPIKey } from './loginContext';

import CommandOptions from './options';
import passwordPrompt from './passwordPrompt';

export default {
  command: 'login',
  describe: 'Login to AppMap Server using an API key',
  builder(args: Argv): Argv {
    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    const { verbose: isVerbose } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    const encodedKey = await passwordPrompt(await serverURL());
    const rawKey = Buffer.from(encodedKey, 'base64').toString();
    const keyTokens = rawKey.split(':');
    if (keyTokens.length !== 2) {
      console.warn('This does not look like a valid API key. Please try again.');
      yargs.exit(1, new Error('Invalid API key'));
    }

    // TODO: Test the API key by making an authentication request

    setAPIKey(encodedKey);

    console.log('\n\nLogged in.\n');
  },
};
