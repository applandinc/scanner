import { readFile, writeFile } from 'fs/promises';
import { dump, load } from 'js-yaml';
import { homedir } from 'os';
import { join } from 'path';

const ApplandFilename = '.appland';
const ApplandURL = 'https://app.land';
const DefaultContextName = 'default';
const ConfigPath = join(homedir(), ApplandFilename);

export async function serverURL(): Promise<string> {
  return (await Config.load()).url;
}

export async function username(): Promise<string> {
  const apiKey = (await Config.load()).apiKey;
  const keyTokens = Buffer.from(apiKey, 'base64').toString().split(':');
  return keyTokens[0];
}

export async function setAPIKey(apiKey: string): Promise<void> {
  const config = await Config.load();
  config.setApiKey(config.currentContext, apiKey);
  await config.save();
}

class Config {
  constructor(public applandConfig: AppLandConfig) {}

  get currentContext() {
    return this.applandConfig.current_context;
  }

  get url() {
    return this.applandConfig.contexts[this.applandConfig.current_context].url;
  }

  get apiKey() {
    return this.applandConfig.contexts[this.applandConfig.current_context].api_key;
  }

  setApiKey(context: string, apiKey: string) {
    this.applandConfig.contexts[context] ||= {} as AppLandContext;
    this.applandConfig.contexts[context].api_key = apiKey;
  }

  async save(): Promise<void> {
    writeFile(ConfigPath, dump(this.applandConfig), {
      mode: 0x0600,
    });
  }

  static async load(): Promise<Config> {
    return (await this.tryLoad(ConfigPath)) || Config.makeDefault();
  }

  private static makeDefault(): Config {
    return new Config({
      current_context: DefaultContextName,
      contexts: {
        DefaultContextName: { url: ApplandURL, api_key: '' },
      },
    });
  }

  private static async tryLoad(path: string): Promise<Config | undefined> {
    let configData: Buffer;
    try {
      configData = await readFile(path);
    } catch {
      return;
    }

    return new Config(load(configData.toString()) as AppLandConfig);
  }
}

type AppLandConfig = {
  current_context: string;
  contexts: Record<string, AppLandContext>;
};

type AppLandContext = {
  url: string;
  api_key: string;
};
