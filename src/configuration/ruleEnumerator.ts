import { lstatSync, readdirSync } from 'fs';
import { join } from 'path';

export function allRules(): string[] {
  return readdirSync(join(__dirname, '..', 'rules')).sort().filter(isRuleFile);
}

export function isRuleFile(ruleFile: string): boolean {
  return !lstatSync(ruleFilePath(ruleFile)).isDirectory() && ruleFile !== 'types.d.ts';
}

export function ruleFilePath(ruleFile: string): string {
  return join(__dirname, '..', 'rules', ruleFile);
}
