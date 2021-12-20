import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { URL } from 'node:url';
import { pack } from 'tar-stream';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import FormData from 'form-data';
import { createGzip } from 'zlib';
import { buildAppMap } from '@appland/models';
import { Settings } from '@appland/client';
import { ScanResults } from '../../report/scanResults';

export default async function (scanResults: ScanResults, appId: string): Promise<void> {
  const normalizedFilePaths: { [key: string]: string } = {};
  const { findings } = scanResults;
  for (const finding of findings) {
    if (!finding.appMapFile) {
      continue;
    }

    const hash = createHash('sha256').update(finding.appMapFile).digest('hex');
    normalizedFilePaths[finding.appMapFile] = `${hash}.appmap.json`;
  }

  const clonedFindings = findings.map((finding) => {
    const clone = { ...finding };
    if (clone.appMapFile) {
      clone.appMapFile = normalizedFilePaths[clone.appMapFile];
    }
    return clone;
  });

  const relevantFilePaths = [
    ...new Set(findings.filter((f) => f.appMapFile).map((f) => f.appMapFile)),
  ] as string[];
  const tarStream = pack();

  for (const filePath of relevantFilePaths) {
    const buffer = await fs.readFile(filePath);

    tarStream.entry(
      { name: normalizedFilePaths[filePath] },
      JSON.stringify(buildAppMap(buffer.toString()).normalize().build().toJSON())
    );
  }

  tarStream.entry({ name: 'app.scanner.json' }, JSON.stringify({ findings: clonedFindings }));
  tarStream.finalize();

  const gzip = createGzip();
  tarStream.pipe(gzip);

  const form = new FormData();
  form.append('findings_data', gzip, 'findings.tgz');
  form.append('app_id', appId);

  process.stderr.write(`Uploading findings to application '${appId}'\n`);
  const publishFindingsURL = new URL([Settings.baseURL, 'api/scanner_jobs'].join('/'));

  const requestFunction = publishFindingsURL.protocol === 'https:' ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const req = requestFunction(publishFindingsURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Settings.apiKey}`,
        ...form.getHeaders(),
      },
    }).on('response', async (res) => {
      let responseData;
      if (res.headers['content-type']?.startsWith('application/json')) {
        const chunks = [];
        for await (const chunk of res) {
          chunks.push(chunk);
        }
        const responseBody = Buffer.concat(chunks).toString();
        try {
          responseData = JSON.parse(responseBody);
        } catch {
          // Pass
        }
      }

      if (res.statusCode && res.statusCode < 300) {
        console.log(
          `Uploaded ${scanResults.findings.length} findings to ${Settings.baseURL}${res.headers.location}`
        );
        resolve();
      } else {
        let message;
        if (responseData) {
          try {
            message = responseData.error.message;
          } catch {
            // Pass
          }
        }
        const errorMsg = [`HTTP ${res.statusCode}`, message].filter(Boolean).join(': ');
        reject(new Error(errorMsg));
      }
    });
    form.pipe(req);
  });
}
