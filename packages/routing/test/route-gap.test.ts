import type {
  SnapshotConnector,
  SnapshotGraph,
  SnapshotNavEdge,
  SnapshotNavNode,
} from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { buildGraph, type RoutePoint, routeGap } from '../src';

/** Posisi `x`, `y` meter dari titik acuan di Jakarta. */
const at = (x: number, y: number): [number, number] => [106.8 + x / 110_600, -6.17 + y / 110_600];
const FLOORS = [
  { id: 'A', level: 0 },
  { id: 'B', level: 1 },
  { id: 'C', level: 2 },
];

function graphOf(
  nodes: [id: string, floorId: string, x: number][],
  edges: [from: string, to: string, accessible?: boolean][],
  connectors: Partial<SnapshotConnector>[] = [],
) {
  const list: SnapshotNavNode[] = nodes.map(([id, floorId, x]) => ({
    id,
    floorId,
    coordinates: at(x, 0),
    role: 'path',
    featureId: null,
  }));
  const floorOf = new Map(list.map((n) => [n.id, n.floorId]));
  const source: SnapshotGraph = {
    nodes: list,
    edges: edges.map(
      ([from, to, accessible = true], i): SnapshotNavEdge => ({
        id: `e${i}`,
        floorId: floorOf.get(from) ?? '',
        from,
        to,
        lengthM: 0,
        accessible,
      }),
    ),
    connectors: connectors.map((c, i) => ({
      id: c.id ?? `k${i}`,
      kind: c.kind ?? 'elevator',
      name: c.name ?? '',
      direction: c.direction ?? null,
      accessible: c.accessible ?? true,
      stops: c.stops ?? [],
    })),
  };
  return buildGraph(source, { floors: FLOORS });
}

const node = (nodeId: string): RoutePoint => ({ kind: 'node', nodeId });
const stops = (...pairs: [string, string][]) =>
  pairs.map(([floorId, nodeId]) => ({ floorId, nodeId }));

describe('routeGap', () => {
  it('tanpa putus bila rute ada', () => {
    const graph = graphOf(
      [
        ['a1', 'A', 0],
        ['a2', 'A', 10],
      ],
      [['a1', 'a2']],
    );
    expect(routeGap(graph, node('a1'), node('a2'), false)).toBeNull();
  });

  it('ujung di lantai tanpa jalur, atau node yang tidak ada', () => {
    const graph = graphOf(
      [
        ['a1', 'A', 0],
        ['a2', 'A', 10],
      ],
      [['a1', 'a2']],
    );
    const onB: RoutePoint = { kind: 'point', lng: at(5, 0)[0], lat: at(5, 0)[1], floorId: 'B' };
    expect(routeGap(graph, onB, node('a1'), false)).toEqual({ kind: 'origin', floorId: 'B' });
    expect(routeGap(graph, node('a1'), node('hilang'), false)).toEqual({
      kind: 'destination',
      floorId: null,
    });
  });

  it('lantai yang belum punya konektor sama sekali', () => {
    const graph = graphOf(
      [
        ['a1', 'A', 0],
        ['a2', 'A', 10],
        ['b1', 'B', 0],
        ['b2', 'B', 10],
      ],
      [
        ['a1', 'a2'],
        ['b1', 'b2'],
      ],
    );
    expect(routeGap(graph, node('a1'), node('b1'), false)).toEqual({
      kind: 'floor',
      floorId: 'B',
      fromFloorId: 'A',
      connectorIds: [],
    });
  });

  it('eskalator yang berlawanan arah disebut sebagai konektor yang tidak bisa dipakai', () => {
    const graph = graphOf(
      [
        ['a1', 'A', 0],
        ['a2', 'A', 10],
        ['b1', 'B', 0],
        ['b2', 'B', 10],
      ],
      [
        ['a1', 'a2'],
        ['b1', 'b2'],
      ],
      [
        {
          id: 'naik',
          kind: 'escalator',
          direction: 'up',
          accessible: false,
          stops: stops(['A', 'a2'], ['B', 'b2']),
        },
      ],
    );
    expect(routeGap(graph, node('a1'), node('b1'), false)).toBeNull();
    expect(routeGap(graph, node('b1'), node('a1'), false)).toEqual({
      kind: 'floor',
      floorId: 'A',
      fromFloorId: 'B',
      connectorIds: ['naik'],
    });
  });

  it('mode aksesibel: lantai yang hanya dilayani tangga', () => {
    const graph = graphOf(
      [
        ['a1', 'A', 0],
        ['a2', 'A', 10],
        ['b1', 'B', 0],
        ['b2', 'B', 10],
      ],
      [
        ['a1', 'a2'],
        ['b1', 'b2'],
      ],
      [{ id: 'tangga', kind: 'stairs', accessible: false, stops: stops(['A', 'a2'], ['B', 'b2']) }],
    );
    expect(routeGap(graph, node('a1'), node('b1'), false)).toBeNull();
    expect(routeGap(graph, node('a1'), node('b1'), true)).toEqual({
      kind: 'floor',
      floorId: 'B',
      fromFloorId: 'A',
      connectorIds: ['tangga'],
    });
  });

  it('pemberhentian konektor yang belum disambung ke jalur di lantai asal', () => {
    const graph = graphOf(
      [
        ['a1', 'A', 0],
        ['a2', 'A', 10],
        ['a3', 'A', 30],
        ['b1', 'B', 0],
        ['b3', 'B', 30],
      ],
      [
        ['a1', 'a2'],
        ['b1', 'b3'],
      ],
      [{ id: 'lift', kind: 'elevator', stops: stops(['A', 'a3'], ['B', 'b3']) }],
    );
    expect(routeGap(graph, node('a1'), node('b1'), false)).toEqual({
      kind: 'connector',
      floorId: 'A',
      toFloorId: 'B',
      connectorIds: ['lift'],
    });
  });

  it('lantai tujuan tercapai tetapi tujuannya terpisah dari jalur', () => {
    const graph = graphOf(
      [
        ['a1', 'A', 0],
        ['a2', 'A', 10],
        ['b2', 'B', 10],
        ['b3', 'B', 20],
        ['b9', 'B', 40],
      ],
      [
        ['a1', 'a2'],
        ['b2', 'b3'],
      ],
      [{ id: 'lift', kind: 'elevator', stops: stops(['A', 'a2'], ['B', 'b2']) }],
    );
    expect(routeGap(graph, node('a1'), node('b9'), false)).toEqual({ kind: 'path', floorId: 'B' });
  });

  it('mode aksesibel: edge tidak aksesibel di lantai tujuan', () => {
    const graph = graphOf(
      [
        ['a1', 'A', 0],
        ['a2', 'A', 10],
        ['b2', 'B', 10],
        ['b1', 'B', 0],
      ],
      [
        ['a1', 'a2'],
        ['b2', 'b1', false],
      ],
      [{ id: 'lift', kind: 'elevator', stops: stops(['A', 'a2'], ['B', 'b2']) }],
    );
    expect(routeGap(graph, node('a1'), node('b1'), true)).toEqual({ kind: 'path', floorId: 'B' });
  });

  it('lantai jauh tanpa konektor dibandingkan dengan lantai asal', () => {
    const graph = graphOf(
      [
        ['a1', 'A', 0],
        ['a2', 'A', 10],
        ['b2', 'B', 10],
        ['c1', 'C', 0],
        ['c2', 'C', 10],
      ],
      [
        ['a1', 'a2'],
        ['c1', 'c2'],
      ],
      [{ id: 'lift', kind: 'elevator', stops: stops(['A', 'a2'], ['B', 'b2']) }],
    );
    expect(routeGap(graph, node('a1'), node('c1'), false)).toEqual({
      kind: 'floor',
      floorId: 'C',
      fromFloorId: 'A',
      connectorIds: [],
    });
  });
});
