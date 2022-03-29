import { ScanResults } from '../../report/scanResults';
import { Metadata } from '@appland/models';
import { URL } from 'url';

export default function normalize(results: ScanResults): ScanResults {
  results.summary.appMapMetadata.git.map(function (metadata: Metadata.Git) {
    if (/^https/.test(metadata.repository)) {
      const url = new URL(metadata.repository);
      url.username = url.password = '';
      metadata.repository = url.toString();
    }
    return metadata;
  });

  return results;
}
