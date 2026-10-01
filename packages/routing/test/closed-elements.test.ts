import type { NavEdge, NavGraph, NavNode, Polygon } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import {
  activeClosures,
  buildGraph,
  type ClosureFeature,
  closedElements,
  type RouteClosure,
  restrictionsFor,
} from '../src';

const closure = (overrides: Partial<RouteClosure>): RouteClosure => ({
  id: 'c',
  featureId: null,
  edgeId: null,
  connectorId: null,
  startsAt: '2026-10-01T08:00:00Z',
  endsAt: '2026-10-01T12:00:00Z',
  ...overrides,
});
const now = new Date('2026-10-01T10:00:00Z');

// Dua node di dalam area "hall", satu node di luar, titik masuk unit "unit", dan pemberhentian lift.
const node = (id: string, lng: number, extra: Partial<NavNode> = {}): NavNode => ({
  id,
  floorId: 'f1',
  coordinates: [lng, -6.175],
  role: 'path',
  featureId: null,
  ...extra,
});
const edge = (id: string, from: string, to: string): NavEdge => ({
  id,
  floorId: 'f1',
  from,
  to,
  lengthM: 1,
  accessible: true,
});
const nodes = [
  node('in1', 106.80001),
  node('in2', 106.80004),
  node('out', 106.8002),
  node('door', 106.8003, { role: 'entrance', featureId: 'unit' }),
  node('lift', 106.8004, { role: 'connector' }),
];
const edges = [
  edge('e1', 'in1', 'in2'),
  edge('e2', 'in2', 'out'),
  edge('e3', 'out', 'door'),
  edge('e4', 'out', 'lift'),
];
const graph: NavGraph = {
  nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
  edges: Object.fromEntries(edges.map((e) => [e.id, e])),
};
const square: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [106.8, -6.1749],
      [106.80005, -6.1749],
      [106.80005, -6.1751],
      [106.8, -6.1751],
      [106.8, -6.1749],
    ],
  ],
};
const hall: ClosureFeature = { id: 'hall', floorId: 'f1', geometry: square };
const connectors = [
  {
    id: 'lift-a',
    stops: [{ nodeId: 'lift' }, { nodeId: 'di-lantai-lain' }],
  },
];
const options = { now, features: [hall], connectors };
const ids = (set: ReadonlySet<string>) => [...set].sort();

describe('closedElements', () => {
  it('penutupan edge hanya menutup edge itu', () => {
    const closed = closedElements(graph, [closure({ edgeId: 'e3' })], options);
    expect(ids(closed.edgeIds)).toEqual(['e3']);
    expect(closed.nodeIds.size).toBe(0);
  });

  it('penutupan area menutup node di dalam poligonnya dan setiap edge yang menyentuhnya', () => {
    const closed = closedElements(graph, [closure({ featureId: 'hall' })], options);
    expect(ids(closed.nodeIds)).toEqual(['in1', 'in2']);
    expect(ids(closed.edgeIds)).toEqual(['e1', 'e2']);
  });

  it('penutupan unit menutup titik masuknya walau poligonnya tidak diberikan', () => {
    const closed = closedElements(graph, [closure({ featureId: 'unit' })], options);
    expect(ids(closed.nodeIds)).toEqual(['door']);
    expect(ids(closed.edgeIds)).toEqual(['e3']);
  });

  it('penutupan konektor menandai pemberhentiannya tanpa menutup jalur di sekitarnya', () => {
    const closed = closedElements(graph, [closure({ connectorId: 'lift-a' })], options);
    expect(ids(closed.nodeIds)).toEqual(['lift']);
    expect(closed.edgeIds.size).toBe(0);
  });

  it('hanya penutupan yang berlaku pada waktu acuan; sasaran yang tidak ada diabaikan', () => {
    const list = [
      closure({ edgeId: 'e1', endsAt: '2026-10-01T09:00:00Z' }),
      closure({ edgeId: 'e2', startsAt: '2026-10-01T11:00:00Z', endsAt: null }),
      closure({ edgeId: 'tidak-ada' }),
      closure({ connectorId: 'tidak-ada' }),
      closure({ featureId: 'tidak-ada' }),
    ];
    const closed = closedElements(graph, list, options);
    expect(closed.edgeIds.size + closed.nodeIds.size).toBe(0);
    const later = { ...options, now: Date.parse('2026-10-01T11:30:00Z') };
    expect(ids(closedElements(graph, list, later).edgeIds)).toEqual(['e2']);
  });

  it('poligon di lantai lain tidak menutup node lantai ini', () => {
    const elsewhere = { ...hall, floorId: 'f2' };
    const closed = closedElements(graph, [closure({ featureId: 'hall' })], {
      ...options,
      features: [elsewhere],
    });
    expect(closed.nodeIds.size + closed.edgeIds.size).toBe(0);
  });

  it('edge yang ditandai sama dengan edge yang diblokir pencarian rute', () => {
    const list = [
      closure({ id: 'a', featureId: 'hall' }),
      closure({ id: 'b', edgeId: 'e3' }),
      closure({ id: 'c', featureId: 'unit', startsAt: '2026-10-01T10:30:00Z' }),
    ];
    const corridor = { id: 'hall', kind: 'corridor' as const, floorId: 'f1' };
    const route = buildGraph(
      { nodes, edges, connectors: [] },
      {
        floors: [{ id: 'f1', level: 0 }],
        features: [{ id: 'hall', geometry: square, properties: corridor }],
      },
    );
    const restrictions = restrictionsFor(route, false, activeClosures(list, now));
    const blocked = route.edgeIds.filter((_, e) => restrictions?.edges[e] === 1);
    expect(ids(closedElements(graph, list, options).edgeIds)).toEqual([...blocked].sort());
  });
});
