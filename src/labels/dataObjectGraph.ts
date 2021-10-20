import { Event } from '@appland/models';
import { DataObject } from './dataObject';

let ID = 0;

class DataObjectNode {
  public id = ID++;
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

  toJSON(): {
    nodes: { id: number; label: string }[];
    links: { source: number; target: number }[];
  } {
    return {
      nodes: this._nodes.map((node) => ({
        id: node.id,
        label: `${node.dataObject?.value}\n${node.dataObject?.object_id}`,
      })),
      links: this._edges.map((edge) => ({ source: edge.from.id, target: edge.to.id })),
    };
  }
}
