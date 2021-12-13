import { pack } from 'tar-stream';
import { promises as fs, constants as fsConstants } from 'fs';
import { request } from 'http';
import { createHash } from 'crypto';
import yaml from 'js-yaml';
import * as path from 'path';
import FormData from 'form-data';
import { Finding } from 'src/types';
import { createGzip } from 'zlib';
import { buildAppMap } from '@appland/models';

async function getAppId(appMapPath: string): Promise<string | undefined> {
  let searchPath = path.resolve(appMapPath);
  while (searchPath !== '/' && searchPath !== '.') {
    const configPath = path.join(searchPath, 'appmap.yml');

    try {
      await fs.access(configPath, fsConstants.R_OK);
    } catch {
      searchPath = path.dirname(searchPath);
      continue;
    }

    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = yaml.load(configContent) as { name?: string };
    return config.name;
  }
}

export async function generatePublishArtifact(
  findings: Finding[],
  apiKey: string,
  appMapPath: string,
  appIdOverride?: string
): Promise<void> {
  const normalizedFilePaths: { [key: string]: string } = {};
  for (const finding of findings) {
    if (!finding.appMapFile) {
      continue;
    }

    const hash = createHash('sha256').update(finding.appMapFile).digest('hex');
    normalizedFilePaths[finding.appMapFile] = `${hash}.appmap.json`;
  }

  const appId = appIdOverride || (await getAppId(appMapPath));
  if (!appId) {
    throw new Error('No application identifier could be resolved');
  }

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

  const clonedFindings = findings.map((finding) => {
    const clone = { ...finding };
    if (clone.appMapFile) {
      clone.appMapFile = normalizedFilePaths[clone.appMapFile];
    }
    return clone;
  });

  tarStream.entry({ name: 'app.scanner.json' }, JSON.stringify(clonedFindings));
  tarStream.finalize();

  const gzip = createGzip();
  tarStream.pipe(gzip);

  const form = new FormData();
  form.append('findings_data', gzip, 'findings.tgz');
  form.append('app_id', appId);

  return new Promise((resolve, reject) => {
    const req = request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/scanner_jobs',
      method: 'POST',
      timeout: 9999999,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...form.getHeaders(),
      },
    });

    form.pipe(req);

    req.on('response', (res) => {
      if (res.statusCode && res.statusCode < 300) {
        console.log(res.headers);
        resolve();
      } else {
        reject(new Error(`got unexpected status code ${res.statusCode}`));
      }
    });
  });
}
