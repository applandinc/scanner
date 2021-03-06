import * as test from './setup';

import { create } from '../../src/integration/appland/scannerJob/create';
import { chdir, cwd } from 'process';
import nock from 'nock';
import { readFileSync } from 'fs';
import { join } from 'path';

const dir = cwd();

const FixtureDir = 'test/fixtures/scanResults';
const ScanResults = JSON.parse(readFileSync(join(FixtureDir, 'scanResults.json')).toString());
const AppMapData1 = { uuid: '5123211e-66e1-4184-b5a9-32976a6ebc85' };
const AppMapData2 = { uuid: '1d10c86f-02ec-4f60-ac46-94282c87f0f1' };
const AppMapUUIDByFileName = {
  'Misago/tmp/appmap/pytest/test_activating_multiple_users_sends_email_notifications_to_them.appmap.json':
    AppMapData1.uuid,
  'Misago/tmp/appmap/pytest/test_active_theme_styles_are_included_in_page_html.appmap.json':
    AppMapData2.uuid,
};

const MapsetId = test.MapsetId;

const ScannerJobData = {
  id: 112,
  mapset_id: 135,
  created_at: '2022-02-08T14:15:47.580Z',
  updated_at: '2022-02-08T14:15:47.580Z',
  summary: ScanResults.summary,
  configuration: ScanResults.configuration,
};

describe('scannerJob', () => {
  beforeEach(() => chdir(FixtureDir));

  afterEach(() => chdir(dir));

  describe('create', () => {
    it('succeeds', async () => {
      nock('http://localhost:3000', { encodedQueryParams: true })
        .post('/api/scanner_jobs')
        .matchHeader(
          'Authorization',
          'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
        )
        .reply(201, ScannerJobData, {
          location: `http://localhost:3000/scanner_jobs/${ScannerJobData.id}`,
        });

      const uploadResponse = await create(
        ScanResults,
        MapsetId,
        AppMapUUIDByFileName,
        {},
        {
          maxRetries: 1,
        }
      );
      expect(Object.keys(uploadResponse)).toEqual([
        'id',
        'mapset_id',
        'created_at',
        'updated_at',
        'summary',
        'configuration',
        'url',
      ]);
      expect(uploadResponse.url.toString()).toEqual(
        `http://localhost:3000/scanner_jobs/${uploadResponse.id}`
      );
      expect(uploadResponse.summary).toEqual({
        numChecks: 1000,
        appMapMetadata: {
          git: [
            {
              branch: 'main',
              commit: 'd7fb6ffb8e296915c85b24339b33645b5c8f927c',
            },
          ],
        },
      });
      expect(uploadResponse.configuration).toEqual({
        arbitraryKey: 'arbitraryValue',
      });
    });

    describe('with a 503 error', () => {
      it('succeeds after retry', async () => {
        nock('http://localhost:3000', { encodedQueryParams: true })
          .post('/api/scanner_jobs')
          .matchHeader(
            'Authorization',
            'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
          )
          .reply(503, {});

        nock('http://localhost:3000', { encodedQueryParams: true })
          .post('/api/scanner_jobs')
          .matchHeader(
            'Authorization',
            'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
          )
          .reply(201, ScannerJobData, {
            location: `http://localhost:3000/scanner_jobs/${ScannerJobData.id}`,
          });

        const uploadResponse = await create(
          ScanResults,
          MapsetId,
          AppMapUUIDByFileName,
          {},
          {
            maxRetries: 1,
          }
        );
        expect(uploadResponse).toBeTruthy();
      });
    });
  });
});
