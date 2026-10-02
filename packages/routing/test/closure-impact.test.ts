import type { SnapshotGraph, SnapshotNavNode } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { buildGraph, closureImpact, type RouteClosure } from '../src';

const node = (id: string, floorId: string, lng: number): SnapshotNavNode => ({
  id,
  floorId,
  coordinates: [lng, -6.175],
  role: 'path',
  featureId: null,
});

// GF dan L1 tersambung lift (aksesibel) dan tangga; L2 hanya lewat lift.
const source: SnapshotGraph = {
  nodes: [
    node('g1', 'gf', 106.8),
    node('g2', 'gf', 106.8002),
    node('a1', 'l1', 106.8),
    node('a2', 'l1', 106.8002),
    node('b1', 'l2', 106.8),
  ],
  edges: [
    { id: 'e-gf', floorId: 'gf', from: 'g1', to: 'g2', lengthM: 22, accessible: true },
    { id: 'e-l1', floorId: 'l1', from: 'a1', to: 'a2', lengthM: 22, accessible: true },
  ],
  connectors: [
    {
      id: 'lift',
      kind: 'elevator',
      name: 'Lift',
      direction: null,
      accessible: true,
      stops: [
        { floorId: 'gf', nodeId: 'g1' },
        { floorId: 'l1', nodeId: 'a1' },
        { floorId: 'l2', nodeId: 'b1' },
      ],
    },
    {
      id: 'stairs',
      kind: 'stairs',
      name: 'Tangga',
      direction: null,
      accessible: false,
      stops: [
        { floorId: 'gf', nodeId: 'g2' },
        { floorId: 'l1', nodeId: 'a2' },
      ],
    },
  ],
};
const graph = buildGraph(source, {
  floors: [
    { id: 'gf', level: 0 },
    { id: 'l1', level: 1 },
    { id: 'l2', level: 2 },
  ],
});
const NOW = Date.parse('2026-10-01T08:00:00Z');
const closure = (id: string, target: Partial<RouteClosure>): RouteClosure => ({
  id,
  featureId: null,
  edgeId: null,
  connectorId: null,
  startsAt: '2026-10-01T07:00:00Z',
  endsAt: null,
  ...target,
});

describe('closureImpact', () => {
  it('menutup lift: L2 tanpa rute sama sekali, L1 kehilangan rute kursi roda saja', () => {
    expect(closureImpact(graph, closure('c', { connectorId: 'lift' }), [], NOW)).toEqual([
      { floorId: 'l2', allRoutes: true },
      { floorId: 'l1', allRoutes: false },
    ]);
  });

  it('menutup tangga atau edge yang punya jalan lain tidak berdampak', () => {
    expect(closureImpact(graph, closure('c', { connectorId: 'stairs' }), [], NOW)).toEqual([]);
    expect(closureImpact(graph, closure('c', { edgeId: 'e-l1' }), [], NOW)).toEqual([]);
  });

  it('penutupan lain yang berlaku ikut diperhitungkan; yang sudah berakhir tidak', () => {
    const stairs = closure('s', { connectorId: 'stairs' });
    expect(closureImpact(graph, closure('c', { edgeId: 'e-gf' }), [stairs], NOW)).toEqual([]);
    const ended = { ...closure('x', { connectorId: 'lift' }), endsAt: '2026-10-01T07:30:00Z' };
    expect(closureImpact(graph, closure('c', { connectorId: 'stairs' }), [ended], NOW)).toEqual([]);
  });

  it('penutupan yang diubah tidak dihitung dua kali', () => {
    const lift = closure('c', { connectorId: 'lift' });
    expect(closureImpact(graph, lift, [lift], NOW)).toHaveLength(2);
  });
});
