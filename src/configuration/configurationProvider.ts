import { ValidateFunction } from 'ajv';
import Ajv from 'ajv';
import yaml from 'js-yaml';
import { promises as fs } from 'fs';
import { Rule, ScopeName } from '../types';
import options_schema from './schema/options.json';
import match_pattern_config_schema from './schema/match-pattern-config.json';
import { capitalize, verbose } from '../rules/lib/util';
import { buildFilters as buildEventFilterArray } from '../rules/lib/matchEvent';
import { allRules } from './ruleEnumerator';
import Configuration from './types/configuration';
import CheckConfig from './types/checkConfig';
import Check from '../check';

const ajv = new Ajv();
ajv.addSchema(match_pattern_config_schema);

type RuleDef = {
  ruleFile: string;
  rule: Rule;
};

async function buildCheck(config: CheckConfig): Promise<Check> {
  const rule: Rule = (await import(`../rules/${config.rule}`)).default;

  let options: any;
  if (rule.Options) {
    options = new rule.Options();
  } else {
    options = {};
  }
  if (config.properties) {
    Object.keys(config.properties).forEach((name) => {
      const value = config.properties![name];
      options[name] = value;
    });
  }

  const check = new Check(rule, options);

  if (config.scope) {
    check.scope = config.scope as ScopeName;
  }

  if (config.id) {
    check.id = config.id;
  }

  check.includeScope = buildEventFilterArray(
    (config.include || []).filter((item) => item.scope).map((item) => item.scope!)
  );
  check.excludeScope = buildEventFilterArray(
    (config.exclude || []).filter((item) => item.scope).map((item) => item.scope!)
  );
  check.includeEvent = buildEventFilterArray(
    (config.include || []).filter((item) => item.event).map((item) => item.event!)
  );
  check.excludeEvent = buildEventFilterArray(
    (config.exclude || []).filter((item) => item.event).map((item) => item.event!)
  );

  return check;
}

const validate = (validator: ValidateFunction, data: any, context: string): void => {
  const valid = validator(data);
  if (!valid) {
    throw new Error(
      validator
        .errors!.map((err) => {
          let instance = err.instancePath;
          if (!instance || instance === '') {
            instance = context;
          }
          return `${instance} ${err.message} (${err.schemaPath})`;
        })
        .join(', ')
    );
  }
};

export async function loadConfig(config: Configuration, enableDefault = true): Promise<Check[]> {
  const disabledRuleIds = new Set(config.disableDefault);

  config.checks ||= [];
  config.disableDefault ||= [];

  config.checks
    .filter((check) => check.properties)
    .forEach((check) => {
      const ruleId = check.rule;
      const schemaKey = [capitalize(ruleId), 'Options'].join('.');
      if (verbose()) {
        console.warn(schemaKey);
      }
      const propertiesSchema = (options_schema.definitions as Record<string, any>)[schemaKey];
      if (!propertiesSchema) {
        return;
      }
      if (verbose()) {
        console.warn(propertiesSchema);
        console.warn(check.properties);
      }
      validate(ajv.compile(propertiesSchema), check.properties || {}, `${ruleId} properties`);
    });

  if (enableDefault) {
    const builtinChecks = (
      await Promise.all<RuleDef>(
        allRules().map(async (ruleFile) => {
          const rule = (await import(`../rules/${ruleFile}`)).default as Rule;
          return {
            ruleFile: ruleFile,
            rule: rule,
          } as RuleDef;
        })
      )
    )
      .filter((ruleDef) => ruleDef.rule.enabled === true)
      .filter((ruleDef) => !disabledRuleIds.has(ruleDef.rule.id))
      .map((ruleDef) => ({ rule: ruleDef.ruleFile.split('.')[0] } as CheckConfig));

    config.checks.splice(0, 0, ...builtinChecks);
  }

  return Promise.all(config.checks.map(async (c: CheckConfig) => buildCheck(c)));
}

export async function parseConfigFile(configPath: string): Promise<Configuration> {
  console.log(`Using scanner configuration file ${configPath}`);
  const yamlConfig = await fs.readFile(configPath, 'utf-8');
  return yaml.load(yamlConfig, {
    filename: configPath,
  }) as Configuration;
}
