import GraphVertex from '../../../../src/algorithms/dataStructures/graph/GraphVertex';
import GraphEdge from '../../../../src/algorithms/dataStructures/graph/GraphEdge';

describe('GraphEdge', () => {
  it('should create graph edge with default weight', () => {
    const startVertex = new GraphVertex('A');
    const endVertex = new GraphVertex('B');
    const edge = new GraphEdge(startVertex, endVertex);

    expect(edge.getKey()).toBe('A - B');
    expect(edge.toString()).toBe('A - B');
    expect(edge.startVertex).toEqual(startVertex);
    expect(edge.endVertex).toEqual(endVertex);
    expect(edge.weight).toEqual(0);
  });

  it('should create graph edge with predefined weight', () => {
    const startVertex = new GraphVertex('A');
    const endVertex = new GraphVertex('B');
    const edge = new GraphEdge(startVertex, endVertex, 10);

    expect(edge.startVertex).toEqual(startVertex);
    expect(edge.endVertex).toEqual(endVertex);
    expect(edge.weight).toEqual(10);
  });

  it('should be possible to do edge reverse', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const edge = new GraphEdge(vertexA, vertexB, 10);

    expect(edge.startVertex).toEqual(vertexA);
    expect(edge.endVertex).toEqual(vertexB);
    expect(edge.weight).toEqual(10);

    edge.reverse();

    expect(edge.startVertex).toEqual(vertexB);
    expect(edge.endVertex).toEqual(vertexA);
    expect(edge.weight).toEqual(10);
  });
});
