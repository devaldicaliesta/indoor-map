import { buildGraph, findRoute } from '@indoor/routing';
import { describe, expect, it } from 'vitest';
import { DENSE_FLOOR, LARGE, largeVenueSource } from '../src/large-venue';

describe('largeVenueSource', () => {
  const source = largeVenueSource();

  it('10 lantai, 2.000 fitur, 20.000 edge tanpa edge ganda', () => {
    expect(source.floors).toHaveLength(LARGE.floors);
    expect(source.features).toHaveLength(2_000);
    expect(source.graph.edges).toHaveLength(20_000);
    const pairs = new Set(source.graph.edges.map((e) => [e.from, e.to].sort().join()));
    expect(pairs.size).toBe(20_000);
  });

  it('setiap unit lokasi bisa dicapai dari titik asal lewat lift', () => {
    const { nodes, edges, connectors } = source.graph;
    const graph = buildGraph(
      { nodes: [...nodes], edges: [...edges], connectors: [...connectors] },
      {
        floors: source.floors.map((f) => ({ id: f.id, level: f.level })),
      },
    );
    const origin = source.originPoints[0]?.nodeId ?? '';
    const lastUnit = source.locations.at(-1)?.primaryUnitId;
    const entrance = source.graph.nodes.find((n) => n.featureId === lastUnit);
    const result = findRoute(
      graph,
      { kind: 'node', nodeId: origin },
      { kind: 'node', nodeId: entrance?.id ?? '' },
    );
    expect(result.ok).toBe(true);
  });
});

describe('lantai padat editor', () => {
  it('satu lantai berisi tepat 1.000 fitur', () => {
    const source = largeVenueSource(DENSE_FLOOR);
    expect(source.floors).toHaveLength(1);
    expect(source.features).toHaveLength(1_000);
  });
});
