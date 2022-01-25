import { load } from 'js-yaml';
import Check from '../src/check';
import { loadConfig } from '../src/configuration/configurationProvider';
import Configuration from '../src/configuration/types/configuration';

describe('YAML config test', () => {
  it('propagates property settings', async () => {
    const yamlConfig = `
    checks:
    - rule: slowHttpServerRequest
      properties:
        timeAllowed: 0.251
    `;
    const configObj = load(yamlConfig) as Configuration;
    const checks: readonly Check[] = await loadConfig(configObj, false);
    expect(checks).toHaveLength(1);
    expect(checks[0].rule.title).toEqual(`Slow HTTP server request`);
  });

  it('loads event filter', async () => {
    const yamlConfig = `
    checks:
    - rule: missingAuthentication
      include:
        - scope:
            property: route
            test:
              include: GET
    `;
    const configObj = load(yamlConfig) as Configuration;
    const checks: readonly Check[] = await loadConfig(configObj, false);
    expect(checks).toHaveLength(1);
    expect(checks[0].includeScope!).toHaveLength(1);
  });

  it('propagates Record properties', async () => {
    const yamlConfig = `
    checks:
    - rule: incompatibleHttpClientRequest
      properties:
        schemata:
          api.railsSampleApp.com: file:///railsSampleApp.openapiv3.yaml
    `;
    const configObj = load(yamlConfig) as Configuration;
    const checks: readonly Check[] = await loadConfig(configObj, false);
    expect(checks).toHaveLength(1);
    expect(checks[0].options.schemata).toEqual({
      'api.railsSampleApp.com': 'file:///railsSampleApp.openapiv3.yaml',
    });
  });

  it('loads builtin rules', async () => {
    const checks: readonly Check[] = await loadConfig({ checks: [], disableDefault: [] }, true);
    expect(checks.find((check) => check.rule.id === 'http-500')).toBeTruthy();
  });

  it('can disable a builtin rule', async () => {
    const yamlConfig = `
    disableDefault:
    - http-500
    `;
    const configObj = load(yamlConfig) as Configuration;
    const checks: readonly Check[] = await loadConfig(configObj, true);
    expect(checks.find((check) => check.rule.id === 'http-500')).toBeFalsy();
  });
});
