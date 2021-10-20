import { Event } from '@appland/models';

export default function getEventLabels(event: Event): Set<string> {
  const labels = new Set<string>();

  if (event.sql) {
    labels.add('sql');
  }

  return labels;
}
