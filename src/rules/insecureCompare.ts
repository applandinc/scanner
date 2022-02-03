import { Event } from '@appland/models';
import { URL } from 'url';
import recordSecrets from '../analyzer/recordSecrets';
import { looksSecret } from '../analyzer/secretsRegexes';
import { Rule, RuleLogic } from '../types.d';

const BCRYPT_REGEXP = /^[$]2[abxy]?[$](?:0[4-9]|[12][0-9]|3[01])[$][./0-9a-zA-Z]{53}$/;

const secrets: Set<string> = new Set();

function stringEquals(e: Event): boolean {
  if (!e.parameters || !e.receiver || e.parameters!.length !== 1) {
    return false;
  }

  const args = [e.receiver.value, e.parameters[0].value];

  function isBcrypt(str: string): boolean {
    return BCRYPT_REGEXP.test(str);
  }

  function isSecret(str: string): boolean {
    return secrets.has(str) || looksSecret(str);
  }

  // BCrypted strings are safe to compare using equals()
  return args.some(isSecret) && !args.some(isBcrypt);
}

function build(): RuleLogic {
  function matcher(e: Event) {
    if (e.codeObject.labels.has(Secret)) {
      recordSecrets(secrets, e);
    }
    if (e.codeObject.labels.has(StringEquals)) {
      return stringEquals(e);
    }
  }

  function where(e: Event): boolean {
    return (
      e.isFunction && (e.codeObject.labels.has(StringEquals) || e.codeObject.labels.has(Secret))
    );
  }

  return {
    matcher,
    where,
  };
}

const Secret = 'secret';
const StringEquals = 'string.equals';

export default {
  id: 'insecure-compare',
  title: 'Insecure comparison of secrets',
  labels: [Secret, StringEquals],
  // scope: //*[@command]
  enumerateScope: true,
  impactDomain: 'Security',
  references: {
    'CWE-208': new URL('https://cwe.mitre.org/data/definitions/208.html'),
  },
  build,
} as Rule;
