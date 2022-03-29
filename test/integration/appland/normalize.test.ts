import { readFileSync } from 'fs';
import { join } from 'path';
import normalize from '../../../src/integration/appland/normalize';

describe('normalize', () => {
  const FixtureDir = 'test/fixtures/scanResults';
  const results = JSON.parse(readFileSync(join(FixtureDir, 'scanResults.json')).toString());

  it('does not change normalized HTTPS repository URLs', () => {
    results.summary.appMapMetadata.git[0].repository =
      'https://gitlab.com/org/repo.git';
    const repository = normalize(results).summary.appMapMetadata.git[0].repository;
    expect(repository).toBe('https://gitlab.com/org/repo.git');
  });

  it('does not change normalized SSH repository URLs', () => {
    results.summary.appMapMetadata.git[0].repository =
      'git@github.com:applandinc/appmap-server.git';
    const repository = normalize(results).summary.appMapMetadata.git[0].repository;
    expect(repository).toBe('git@github.com:applandinc/appmap-server.git');
  });

  it('removes username/password from HTTPS repository URLs', () => {
    results.summary.appMapMetadata.git[0].repository =
      'https://user-ci:token-token@gitlab.com/org/repo.git';
    const repository = normalize(results).summary.appMapMetadata.git[0].repository;
    expect(repository).toBe('https://gitlab.com/org/repo.git');
  });
});
