import type { SnapshotGraph, SnapshotNavNode } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import {
  ARC_ACCESSIBLE,
  ARC_CONNECTOR,
  buildGraph,
  connectorAllows,
  connectorCost,
  nodeDistanceM,
} from '../src';

describe('bobot konektor', () => {
  it('lift 15 + 3/lantai, eskalator 10/lantai, tangga 12/lantai, pintu gedung 0', () => {
    expect(connectorCost('elevator', 1)).toBe(18);
    expect(connectorCost('elevator', 3)).toBe(24);
    expect(connectorCost('escalator', 1)).toBe(10);
    expect(connectorCost('stairs', 2)).toBe(24);
    expect(connectorCost('building_door', 0)).toBe(0);
  });

  it('eskalator mengikuti arahnya; konektor lain dua arah', () => {
    const up = { kind: 'escalator', direction: 'up' } as const;
    const down = { kind: 'escalator', direction: 'down' } as const;
    expect(connectorAllows(up, 0, 1)).toBe(true);
    expect(connectorAllows(up, 1, 0)).toBe(false);
    expect(connectorAllows(down, 1, 0)).toBe(true);
    expect(connectorAllows(down, 0, 1)).toBe(false);
    expect(connectorAllows({ kind: 'escalator', direction: 'both' }, 1, 0)).toBe(true);
    expect(connectorAllows({ kind: 'stairs', direction: null }, 2, 0)).toBe(true);
  });
});

const at = (id: string, floorId: string, lng: number): SnapshotNavNode => ({
  id,
  floorId,
  coordinates: [lng, -6.175],
  role: 'path',
  featureId: null,
});

describe('arc konektor di graf', () => {
  const source: SnapshotGraph = {
    nodes: [
      at('g', 'gf', 106.8),
      at('l1', 'l1', 106.8),
      at('l2', 'l2', 106.8),
      at('eg', 'gf', 106.8001),
      at('el', 'l1', 106.80012),
      at('out', 'out', 106.8003),
    ],
    edges: [],
    connectors: [
      {
        id: 'lift',
        kind: 'elevator',
        name: 'Lift',
        direction: null,
        accessible: true,
        stops: [
          { floorId: 'gf', nodeId: 'g' },
          { floorId: 'l1', nodeId: 'l1' },
          { floorId: 'l2', nodeId: 'hilang' },
        ],
      },
      {
        id: 'up',
        kind: 'escalator',
        name: 'Naik',
        direction: 'up',
        accessible: false,
        stops: [
          { floorId: 'l1', nodeId: 'el' },
          { floorId: 'gf', nodeId: 'eg' },
        ],
      },
      {
        id: 'stairs',
        kind: 'stairs',
        name: 'Tangga',
        direction: null,
        accessible: false,
        stops: [
          { floorId: 'gf', nodeId: 'g' },
          { floorId: 'l1', nodeId: 'l1' },
          { floorId: 'l2', nodeId: 'l2' },
        ],
      },
      {
        id: 'door',
        kind: 'building_door',
        name: 'Pintu',
        direction: null,
        accessible: true,
        stops: [
          { floorId: 'gf', nodeId: 'g' },
          { floorId: 'out', nodeId: 'out' },
        ],
      },
    ],
  };
  const graph = buildGraph(source, {
    floors: [
      { id: 'out', level: 0 },
      { id: 'gf', level: 0 },
      { id: 'l1', level: 1 },
      { id: 'l2', level: 2 },
    ],
  });
  const arcs = Array.from(graph.arcTo, (to, a) => ({
    connector: graph.connectorIds[graph.arcSource[a] ?? 0],
    from: graph.nodeIds[graph.arcFrom[a] ?? 0],
    to: graph.nodeIds[to],
    cost: graph.arcCost[a] ?? 0,
    flags: graph.arcFlags[a] ?? 0,
  }));
  const pairs = (connector: string) =>
    arcs.filter((a) => a.connector === connector).map((a) => `${a.from}>${a.to}`);

  it('lift hanya antar pemberhentian yang ada; tangga setiap pasang lantai', () => {
    expect(new Set(pairs('lift'))).toEqual(new Set(['g>l1', 'l1>g']));
    expect(new Set(pairs('stairs'))).toEqual(
      new Set(['g>l1', 'g>l2', 'l1>g', 'l1>l2', 'l2>g', 'l2>l1']),
    );
  });

  it('eskalator naik hanya satu arah; pintu gedung dua arah dengan bobot 0 + jarak', () => {
    expect(pairs('up')).toEqual(['eg>el']);
    expect(new Set(pairs('door'))).toEqual(new Set(['g>out', 'out>g']));
    const door = arcs.find((a) => a.connector === 'door');
    const g = graph.nodeIndex.get('g') ?? 0;
    const out = graph.nodeIndex.get('out') ?? 0;
    expect(door?.cost).toBeCloseTo(nodeDistanceM(graph, g, out), 9);
  });

  it('bobot = tetap + jarak horizontal; flag konektor dan aksesibel', () => {
    const stairs = arcs.find((a) => a.connector === 'stairs' && a.from === 'g' && a.to === 'l2');
    expect(stairs?.cost).toBeCloseTo(24, 9);
    const escalator = arcs.find((a) => a.connector === 'up');
    const eg = graph.nodeIndex.get('eg') ?? 0;
    const el = graph.nodeIndex.get('el') ?? 0;
    expect(escalator?.cost).toBeCloseTo(10 + nodeDistanceM(graph, eg, el), 9);
    for (const arc of arcs) expect(arc.flags & ARC_CONNECTOR).toBe(ARC_CONNECTOR);
    const lift = arcs.find((a) => a.connector === 'lift');
    expect((lift?.flags ?? 0) & ARC_ACCESSIBLE).toBe(ARC_ACCESSIBLE);
    expect((escalator?.flags ?? 0) & ARC_ACCESSIBLE).toBe(0);
  });

  it('biaya per level terkecil untuk heuristik: eskalator 10', () => {
    expect(graph.costPerLevel).toBe(10);
  });
});
