import type { SnapshotGraph } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import {
  activeClosures,
  buildGraph,
  closedFeatureNodes,
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

describe('penutupan yang berlaku', () => {
  const now = new Date('2026-10-01T10:00:00Z');
  const list = [
    closure({ id: 'aktif' }),
    closure({ id: 'lewat', startsAt: '2026-10-01T06:00:00Z', endsAt: '2026-10-01T09:59:59Z' }),
    closure({ id: 'nanti', startsAt: '2026-10-01T10:00:01Z', endsAt: null }),
    closure({ id: 'tanpa-akhir', endsAt: null }),
    closure({ id: 'berakhir-tepat', endsAt: '2026-10-01T10:00:00Z' }),
  ];

  it('memakai waktu yang disuntikkan: yang lewat, belum mulai, dan tepat berakhir diabaikan', () => {
    expect(activeClosures(list, now).map((c) => c.id)).toEqual(['aktif', 'tanpa-akhir']);
    expect(activeClosures(list, now.getTime()).map((c) => c.id)).toEqual(['aktif', 'tanpa-akhir']);
  });

  it('tanpa waktu acuan semua penutupan yang diberikan dianggap berlaku', () => {
    expect(activeClosures(list, undefined)).toHaveLength(list.length);
  });
});

// Dua node di dalam area "hall" (persegi), satu node di luar, satu titik masuk fitur "unit".
const at = (id: string, lng: number, featureId: string | null = null) => ({
  id,
  floorId: 'f1',
  coordinates: [lng, -6.175] as [number, number],
  role: featureId ? ('entrance' as const) : ('path' as const),
  featureId,
});
const source: SnapshotGraph = {
  nodes: [
    at('in1', 106.80001),
    at('in2', 106.80004),
    at('out', 106.8002),
    at('door', 106.8003, 'unit'),
  ],
  edges: [
    { id: 'e1', floorId: 'f1', from: 'in1', to: 'in2', lengthM: 3.4, accessible: true },
    { id: 'e2', floorId: 'f1', from: 'in2', to: 'out', lengthM: 18, accessible: false },
    { id: 'e3', floorId: 'f1', from: 'out', to: 'door', lengthM: 11, accessible: true },
  ],
  connectors: [],
};
const hall = {
  id: 'hall',
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [106.8, -6.1749],
        [106.80005, -6.1749],
        [106.80005, -6.1751],
        [106.8, -6.1751],
        [106.8, -6.1749],
      ] as [number, number][],
    ],
  },
  properties: { id: 'hall', kind: 'corridor' as const, floorId: 'f1' },
};
const graph = buildGraph(source, { floors: [{ id: 'f1', level: 0 }], features: [hall] });
const index = (id: string) => graph.nodeIndex.get(id) ?? -1;

describe('pembatasan rute', () => {
  it('area tertutup menutup node di dalam poligonnya; fitur tertutup menutup titik masuknya', () => {
    expect(closedFeatureNodes(graph, 'hall').sort()).toEqual([index('in1'), index('in2')].sort());
    expect(closedFeatureNodes(graph, 'unit')).toEqual([index('door')]);
    expect(closedFeatureNodes(graph, 'tidak-ada')).toEqual([]);
  });

  it('mode aksesibel memblokir arc tidak aksesibel; edge tertutup memblokir kedua arahnya', () => {
    const accessible = restrictionsFor(graph, true, []);
    const blockedEdges = (r: typeof accessible) =>
      graph.edgeIds.filter((_, e) => r?.edges[e] === 1);
    expect(blockedEdges(accessible)).toEqual(['e2']);
    const closed = restrictionsFor(graph, false, [closure({ edgeId: 'e3' })]);
    expect(blockedEdges(closed)).toEqual(['e3']);
    expect(restrictionsFor(graph, false, [])).toBeNull();
  });

  it('node tertutup memblokir semua arc yang menyentuhnya', () => {
    const r = restrictionsFor(graph, false, [closure({ featureId: 'hall' })]);
    expect(graph.edgeIds.filter((_, e) => r?.edges[e] === 1)).toEqual(['e1', 'e2']);
    expect(r?.nodes[index('out')]).toBe(0);
  });
});
