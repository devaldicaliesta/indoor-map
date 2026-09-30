import { buildSnapshot } from '@indoor/domain';
import { sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { ENTRANCES, FLOORS, GRAPH, unitIdOf } from '@indoor/domain/fixtures/venue-graph.ts';
import { describe, expect, it } from 'vitest';
import {
  buildGraph,
  type ConnectorLeg,
  findRoute,
  type RouteLeg,
  type RoutePoint,
  type RouteResult,
} from '../src';
import { referenceCost } from './helpers';

const snapshot = buildSnapshot(sampleSnapshotSource());
const graph = buildGraph(snapshot.graph, { floors: snapshot.floors });
const entrance = (code: string): RoutePoint => ({
  kind: 'node',
  nodeId: ENTRANCES.get(unitIdOf(code)) ?? '',
});
const connectorsOf = (result: RouteResult): ConnectorLeg[] =>
  result.ok ? result.legs.filter((leg): leg is ConnectorLeg => leg.kind === 'connector') : [];
const kinds = (legs: readonly RouteLeg[]) =>
  legs.map((leg) => (leg.kind === 'walk' ? `walk:${leg.floorId}` : leg.connectorKind));
const levelOf = (floorId: string) => snapshot.floors.find((f) => f.id === floorId)?.level ?? 0;
const { connectors } = GRAPH;

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

  it('2. naik lewat eskalator naik, kembali lewat eskalator turun, tidak pernah melawan arah', () => {
    const up = findRoute(graph, entrance('GF-A08'), entrance('L1-A08'));
    expect(connectorsOf(up).map((leg) => leg.connectorId)).toEqual([connectors.escalatorUp]);
    const down = findRoute(graph, entrance('L1-B07'), entrance('GF-B07'));
    expect(connectorsOf(down).map((leg) => leg.connectorId)).toEqual([connectors.escalatorDown]);

    const codes = ['GF-A01', 'GF-B04', 'L1-A02', 'L1-B08', 'L2-A05'];
    for (const a of codes) {
      for (const b of codes) {
        for (const leg of connectorsOf(findRoute(graph, entrance(a), entrance(b)))) {
          const rise = levelOf(leg.toFloorId) - levelOf(leg.fromFloorId);
          if (leg.connectorId === connectors.escalatorUp) expect(rise).toBeGreaterThan(0);
          if (leg.connectorId === connectors.escalatorDown) expect(rise).toBeLessThan(0);
        }
      }
    }
  });

  it('3. antar-gedung lewat Area Luar: keluar lalu masuk gedung', () => {
    const result = findRoute(graph, entrance('GF-A02'), entrance('GT-B03'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(kinds(result.legs)).toEqual([
      `walk:${FLOORS.guGf}`,
      'building_door',
      `walk:${FLOORS.outdoor}`,
      'building_door',
      `walk:${FLOORS.gtGf}`,
    ]);
    expect(connectorsOf(result).map((leg) => leg.connectorId)).toEqual([
      connectors.guDoor,
      connectors.gtDoor,
    ]);
    // Tanpa mode aksesibel jalan pintas bertangga di Area Luar yang dipakai (lebih pendek).
    const outdoor = result.legs[2];
    expect(outdoor?.kind === 'walk' && outdoor.nodeIds).toEqual([GRAPH.guDoorOut, GRAPH.gtDoorOut]);
  });

  it('5. lift yang tidak melayani L2 tidak pernah dipakai untuk rute ke/dari L2', () => {
    for (const [from, to] of [
      ['GF-A03', 'L2-B02'],
      ['L2-A06', 'GF-B06'],
      ['L1-A04', 'L2-A04'],
    ] as const) {
      const result = findRoute(graph, entrance(from), entrance(to));
      expect(result.ok).toBe(true);
      const legs = connectorsOf(result);
      expect(legs.some((leg) => leg.connectorId === connectors.lift)).toBe(false);
      const toL2 = legs.filter(
        (leg) => leg.toFloorId === FLOORS.guL2 || leg.fromFloorId === FLOORS.guL2,
      );
      expect(toL2.map((leg) => leg.connectorKind)).toEqual(['stairs']);
    }
  });
});
