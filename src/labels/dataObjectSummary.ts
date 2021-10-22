import { Event } from '@appland/models';
import { DataObject } from './dataObject';
import DataObjectGraph from './dataObjectGraph';

/**
 * Roll up the data object graph into an aggregate summary. This should be easier to work with,
 * especially when looking for specific labels, as they'll all be present in this top level object.
 */
export default class DataObjectSummary {
  constructor(
    readonly values: readonly string[],
    readonly events: readonly Event[],
    readonly dataObjects: readonly DataObject[],
    readonly labels: Set<string>,
    readonly graph: DataObjectGraph
  ) {}
}
