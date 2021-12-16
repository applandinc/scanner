import { App, FindingStatusListItem } from '@appland/client';

export default async function (appId: string): Promise<FindingStatusListItem> {
  return new App(appId)
    .listFindingStatus()
    .then((findings: FindingStatusListItem[]) => {
      console.log(findings);
    })
    .catch((err) => {
      console.warn(err);
    });
}
