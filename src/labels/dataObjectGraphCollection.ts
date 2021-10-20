import { Event } from '@appland/models';
import getDataObjectLabels, { DataObject } from './dataObject';
import DataObjectGraph from './dataObjectGraph';

export default class DataObjectGraphCollection {
  private allGraphs: DataObjectGraph[] = [];
  private graphsByValue: { [key: string]: DataObjectGraph } = {};
  private graphsById: { [key: number]: DataObjectGraph } = {};

  private getOrCreateGraph(dataObject: DataObject): DataObjectGraph {
    if (dataObject.object_id) {
      const graph = this.graphsById[dataObject.object_id];
      if (graph) {
        return graph;
      }
    }

    let graph = this.graphsByValue[dataObject.value];
    if (graph) {
      return graph;
    }

    // Create a new graph
    graph = new DataObjectGraph();
    this.allGraphs.push(graph);
    this.graphsByValue[dataObject.value] = graph;
    if (dataObject.object_id) {
      this.graphsById[dataObject.object_id] = graph;
    }

    return graph;
  }

  add(event: Event, dataObject: DataObject): void {
    const graph = this.getOrCreateGraph(dataObject);
    graph.add(event, dataObject);
  }

  addEventReference(event: Event): void {
    const referenceString: string | null | undefined = event.sqlQuery;
    if (!referenceString) {
      return;
    }

    this.allGraphs.forEach((g) => g.addReference(referenceString, event));
  }

  label(): void {
    this.allGraphs.forEach((graph) => {
      graph.nodes.forEach((node) => {
        if (node.dataObject) {
          node.dataObject.labels = getDataObjectLabels(node.dataObject);
        }
      });
    });
  }

  toJSON(): {
    nodes: { id: number; label: string }[];
    links: { source: number; target: number }[];
  } {
    return this.allGraphs.reduce(
      (acc, graph) => {
        const g = graph.toJSON();
        acc.nodes.push(...g.nodes);
        acc.links.push(...g.links);
        return acc;
      },
      { nodes: [], links: [] } as {
        nodes: { id: number; label: string }[];
        links: { source: number; target: number }[];
      }
    );
  }
}
