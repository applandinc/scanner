import { join } from 'path';
import sinon from 'sinon';
import Command from '../../src/cli/scan/command';
import { fixtureAppMapFileName } from '../util';
import { readFileSync, unlinkSync } from 'fs';

describe('smoke test', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('runs with standard options', async () => {
    sinon.stub(process.stdout, 'write');
    const processExit = sinon.stub(process, 'exit');
    const reportFile = 'appland-findings.json';
    await Command.handler({
      appmapFile: fixtureAppMapFileName(
        'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
      ),
      config: join(__dirname, '..', '..', 'src', 'sampleConfig', 'default.yml'), // need to pass it explicitly
      reportFile: reportFile,
    } as any);

    expect(processExit.calledWith(0)).toBe(true);
    const findingsReport = JSON.parse(readFileSync(reportFile).toString());
    expect(findingsReport.summary).toBeTruthy();
    const appMapMetadata = findingsReport.summary.appMapMetadata;
    delete findingsReport.summary['appMapMetadata'];
    expect(appMapMetadata).toBeTruthy();
    expect(appMapMetadata.apps).toEqual(['spring-petclinic']);
    expect(findingsReport).toEqual({
      appMaps: {},
      findings: [],
      configuration: {
        checks: [
          { rule: 'circularDependency' },
          { rule: 'http500' },
          { rule: 'missingContentType' },
          { rule: 'nPlusOneQuery' },
        ],
      },
      summary: {
        numAppMaps: 1,
        numChecks: 4,
        numFindings: 0,
        rules: ['circular-dependency', 'http-5xx', 'missing-content-type', 'n-plus-one-query'],
        ruleLabels: [],
      },
    });
    unlinkSync(reportFile);
  });
});
