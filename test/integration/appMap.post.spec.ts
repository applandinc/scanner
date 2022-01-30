import nock from 'nock';

import * as test from './setup';
import { AppMap, CreateOptions, UploadAppMapResponse } from '../../src/integration/appland/appMap';
import { before } from 'mocha';
import { default as expect } from 'expect';

const AppMapData = {
  uuid: 'e6756c3c-4132-4296-bb7b-6ba5f2ac56ee',
};

async function uploadAppMap(data: Buffer, options: CreateOptions): Promise<UploadAppMapResponse> {
  return AppMap.upload(data, options);
}

describe('appMap', () => {
  before(test.setupEnvironment);

  describe('post', () => {
    it('is created', async () => {
      const data = Buffer.from(JSON.stringify({}));
      const options = {
        app: test.AppId,
      } as CreateOptions;

      nock('http://localhost:3000')
        .post(`/api/appmaps`, /Content-Disposition: form-data/)
        .matchHeader(
          'Authorization',
          'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
        )
        .matchHeader('Content-Type', /^multipart\/form-data; boundary/)
        .matchHeader('Accept', /^application\/json;?/)
        .reply(201, AppMapData, ['Content-Type', 'application/json']);
      expect(await uploadAppMap(data, options)).toEqual(AppMapData);
    });
  });
});
