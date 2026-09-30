import { buildSnapshot } from '@indoor/domain';
import { sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { ENTRANCES, FLOORS, unitIdOf } from '@indoor/domain/fixtures/venue-graph.ts';
import { describe, expect, it } from 'vitest';
import { buildGraph, findRoute, type RoutePoint } from '../src';
import { referenceCost } from './helpers';

const snapshot = buildSnapshot(sampleSnapshotSource());
const graph = buildGraph(snapshot.graph, { floors: snapshot.floors });
const entrance = (code: string): RoutePoint => ({
  kind: 'node',
  nodeId: ENTRANCES.get(unitIdOf(code)) ?? '',
});

describe('skenario uji rute wajib (venue contoh)', () => {
  it('1. rute satu lantai antar-dua unit', () => {
    const from = entrance('GF-A01');
    const to = entrance('GF-B08');
    const result = findRoute(graph, from, to);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.legs.map((leg) => leg.kind)).toEqual(['walk']);
    expect(result.legs[0]).toMatchObject({ floorId: FLOORS.guGf });
    expect(result.path[0]).toBe(from.kind === 'node' ? from.nodeId : '');
    expect(result.path.at(-1)).toBe(to.kind === 'node' ? to.nodeId : '');
    // Dari ujung barat ke ujung timur koridor: 4 m ke koridor, 7 kolom × ±10 m, 4 m ke pintu.
    expect(result.distanceM).toBeGreaterThan(75);
    expect(result.distanceM).toBeLessThan(80);
    expect(result.costM).toBeCloseTo(
      referenceCost(
        snapshot.graph,
        from.kind === 'node' ? from.nodeId : '',
        to.kind === 'node' ? to.nodeId : '',
      ) ?? Number.NaN,
      6,
    );
  });
});
