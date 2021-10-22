import { AppMap } from '@appland/models';
import { DataObject } from './dataObject';
import DataObjectGraphCollection from './dataObjectGraphCollection';
import DataObjectSummary from './dataObjectSummary';
import getEventLabels from './event';

export default function processLabels(appMap: AppMap): readonly DataObjectSummary[] {
  const dataObjects = new DataObjectGraphCollection();
  const { events } = appMap;

  for (let eventIndex = 0; eventIndex < events.length; ++eventIndex) {
    const event = events[eventIndex];
    if (event.isReturn()) {
      continue;
    }

    const eventData = event.dataObjects();

    getEventLabels(event).forEach((label) => {
      event.labels.add(label);
    });

    for (let dataObjectIndex = 0; dataObjectIndex < eventData.length; ++dataObjectIndex) {
      const dataObject = eventData[dataObjectIndex] as DataObject & { value: string | null };
      if (dataObject.value === null) {
        // This is a bug in the AppMap
        continue;
      }

      dataObjects.add(event, dataObject);
    }
  }

  // Once all the data objects have been grouped, we can look for references by value in
  // event content. e.g. SQL queries that contain data object values
  for (let eventIndex = 0; eventIndex < events.length; ++eventIndex) {
    const event = events[eventIndex];

    if (event.isCall()) {
      dataObjects.addEventReference(event);
    }
  }

  // Finally, we can process the data objects themselves
  dataObjects.label();

  return dataObjects.summarize();
}
