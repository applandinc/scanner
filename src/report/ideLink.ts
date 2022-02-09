import { isAbsolute, normalize } from 'path';
import supportsColor from './supportsColor';

import hyperlink from './hyperlink';
import { Finding, Rule } from '../types';
import { IDE } from '../cli/detectIde';

export default function ideLink(finding: Finding, rule: Rule, ide?: IDE): string {
  const filePath = finding.appMapFile;

  if (!ide) {
    return filePath;
  }

  if (!supportsColor.stdout) {
    return filePath;
  }

  let path: string;
  if (!isAbsolute(filePath)) {
    path = `${__dirname}/../../${filePath}`;
  } else {
    path = filePath;
  }

  const eventIds = [
    ...new Set(
      [finding.scope, finding.event].concat(finding.relatedEvents || []).map((event) => event.id)
    ),
  ].sort();
  const labels = [...new Set(rule.labels || [])].sort();

  const traceFilter = eventIds
    .map((id) => `id:${id}`)
    .concat(labels.map((label) => `label:${label}`))
    .join(' ');

  const state = {
    currentView: 'viewFlow',
    selectedObject: `id:${finding.event.id}`,
    traceFilter,
  };

  let urlPath = '';
  const params: Record<string, string> = { uri: path };
  if (ide === 'vscode') {
    urlPath = 'vscode://appland.appmap/open';
    params.state = encodeURIComponent(JSON.stringify(state));
  } else {
    urlPath = `${ide}://open`;
  }

  return hyperlink(filePath, urlPath, params);
}
