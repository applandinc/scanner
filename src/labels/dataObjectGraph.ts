import { Event } from '@appland/models';
import { DataObject } from './dataObject';
import DataObjectSummary from './dataObjectSummary';

class DataObjectNode {
  constructor(public readonly event: Event, public readonly dataObject?: DataObject) {}
}

class DataObjectEdge {
  constructor(public readonly to: DataObjectNode, public readonly from: DataObjectNode) {}
}

export default class DataObjectGraph {
  private valueTable: { [key: string]: DataObjectNode[] } = {};
  public _nodes: DataObjectNode[] = [];
  public _edges: DataObjectEdge[] = [];

  add(event: Event, dataObject?: DataObject): void {
    const node = new DataObjectNode(event, dataObject);

    for (let i = 0; i < this._nodes.length; i++) {
      const otherNode = this._nodes[i];
      if (otherNode.dataObject) {
        const { dataObject: otherDataObject } = otherNode;
        if (
          (otherDataObject.object_id !== undefined &&
            otherDataObject.object_id === dataObject?.object_id) ||
          otherDataObject.value === dataObject?.value
        ) {
          this._edges.push(new DataObjectEdge(otherNode, node));
          continue;
        }
      }
    }

    // Add the data object to the value table for faster lookup by value
    if (dataObject) {
      let valueBucket = this.valueTable[dataObject.value];
      if (valueBucket === undefined) {
        valueBucket = [];
        this.valueTable[dataObject.value] = valueBucket;
      }
      valueBucket.push(node);
    }

    this._nodes.push(node);
  }

  // If referenceString is found in the value table, add an edge between the event and each data
  // object associated with that value.
  addReference(referenceString: string, event: Event): void {
    Object.entries(this.valueTable)
      .filter(([v]) => v.includes(referenceString))
      .forEach(([, dataObjectNodes]) => {
        dataObjectNodes.forEach((node) => {
          const eventNode = new DataObjectNode(event);
          const edge = new DataObjectEdge(eventNode, node);
          this._nodes.push(eventNode);
          this._edges.push(edge);
        });
      });
  }

  get nodes(): readonly DataObjectNode[] {
    return this._nodes;
  }

  get values(): readonly string[] {
    return Object.keys(this.valueTable);
  }

  summarize(): DataObjectSummary {
    return new DataObjectSummary(
      this.values,
      this._nodes.map((node) => node.event),
      this._nodes.map((node) => node.dataObject).filter(Boolean) as readonly DataObject[],
      this._nodes.reduce((set, node) => {
        if (node.dataObject) {
          node.dataObject.labels?.forEach((label) => set.add(label));
        }
        return set;
      }, new Set<string>()),
      this
    );
  }
}
