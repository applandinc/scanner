import postCommitStatus from '../integration/github/commitStatus';

export default async function updateCommitStatus(
  numFindings: number,
  numChecks: number,
  targetUrl?: string
): Promise<void> {
  if (numFindings > 0) {
    await postCommitStatus('failure', `${numChecks} checks, ${numFindings} findings`, targetUrl);
    console.log(`Commit status updated to: failure (${numFindings} findings)`);
  } else {
    await postCommitStatus('success', `${numChecks} checks passed`, targetUrl);
    console.log(`Commit status updated to: success.`);
  }
}
