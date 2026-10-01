import { buildSnapshot, type SnapshotSource } from '@indoor/domain';
import { IDS, sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { ENTRANCES, FLOORS, GRAPH, unitIdOf } from '@indoor/domain/fixtures/venue-graph.ts';
import { describe, expect, it } from 'vitest';
import {
  buildGraph,
  type ConnectorLeg,
  findRoute,
  infoPointTarget,
  instructionText,
  locationTarget,
  originPointTarget,
  type RouteClosure,
  type RouteLeg,
  type RoutePoint,
  type RouteResult,
  routeSteps,
} from '../src';
import { DEFAULT_TEMPLATES } from './fixtures/instruction-templates';
import { referenceCost } from './helpers';

/** Snapshot dan graf rute venue contoh, dengan poligon fitur untuk penutupan area. */
function venue(source: SnapshotSource = sampleSnapshotSource()) {
  const snapshot = buildSnapshot(source);
  const graph = buildGraph(snapshot.graph, {
    floors: snapshot.floors,
    features: snapshot.features.features,
  });
  return { snapshot, graph };
}
const { snapshot, graph } = venue();
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
    const escalatorSteps = (result: RouteResult) =>
      result.ok
        ? routeSteps(result, snapshot.floors).filter((step) => step.action.startsWith('escalator'))
        : [];
    expect(escalatorSteps(up)).toMatchObject([{ action: 'escalator_up', floorId: FLOORS.guL1 }]);
    expect(escalatorSteps(down)).toMatchObject([
      { action: 'escalator_down', floorId: FLOORS.guGf },
    ]);

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

    const steps = routeSteps(result, snapshot.floors);
    const texts = (language: 'id' | 'en') =>
      steps.map((step) =>
        instructionText(step, {
          templates: DEFAULT_TEMPLATES,
          language,
          floors: snapshot.floors,
          buildings: snapshot.buildings,
          origin: 'GF-A02',
          destination: 'GT-B03',
        }),
      );
    expect(texts('id')).toMatchInlineSnapshot(`
      [
        "Mulai dari GF-A02",
        "Jalan lurus 5 m",
        "Belok kiri",
        "Jalan lurus 75 m",
        "Keluar dari Gedung Utama",
        "Jalan lurus 45 m",
        "Masuk ke Gedung Timur",
        "Jalan lurus 25 m",
        "Belok kanan",
        "Jalan lurus 5 m",
        "Tiba di GT-B03",
      ]
    `);
    expect(texts('en')).toMatchInlineSnapshot(`
      [
        "Start at GF-A02",
        "Go straight for 5 m",
        "Turn left",
        "Go straight for 75 m",
        "Exit Gedung Utama",
        "Go straight for 45 m",
        "Enter Gedung Timur",
        "Go straight for 25 m",
        "Turn right",
        "Go straight for 5 m",
        "Arrive at GT-B03",
      ]
    `);
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

  const now = new Date('2026-10-01T10:00:00Z');
  const closure = (id: string, target: Partial<RouteClosure>): RouteClosure => ({
    id,
    featureId: null,
    edgeId: null,
    connectorId: null,
    startsAt: '2026-10-01T08:00:00Z',
    endsAt: null,
    ...target,
  });
  const lobby: RoutePoint = { kind: 'node', nodeId: GRAPH.lobby };

  it('4. rute aksesibel ke lantai yang hanya dilayani satu lift; lift ditutup → accessible_blocked', () => {
    const open = findRoute(graph, lobby, entrance('L1-A03'), { accessible: true });
    expect(connectorsOf(open).map((leg) => leg.connectorId)).toEqual([connectors.lift]);

    const liftClosed = closure('lift-rusak', { connectorId: connectors.lift });
    expect(
      findRoute(graph, lobby, entrance('L1-A03'), {
        accessible: true,
        closures: [liftClosed],
        now,
      }),
    ).toEqual({ ok: false, reason: 'accessible_blocked', blockingClosureIds: ['lift-rusak'] });

    // Area lift L1 yang ditutup (bukan konektornya) juga memutus pemberhentian L1.
    const liftArea = snapshot.features.features.find(
      (f) => f.properties.kind === 'elevator' && f.properties.floorId === FLOORS.guL1,
    );
    expect(
      findRoute(graph, lobby, entrance('L1-A03'), {
        accessible: true,
        closures: [closure('area-lift', { featureId: liftArea?.id ?? '' })],
        now,
      }),
    ).toMatchObject({ reason: 'accessible_blocked', blockingClosureIds: ['area-lift'] });

    // Tanpa mode aksesibel rute tetap ada lewat eskalator.
    const any = findRoute(graph, lobby, entrance('L1-A03'), { closures: [liftClosed], now });
    expect(connectorsOf(any).map((leg) => leg.connectorKind)).toEqual(['escalator']);

    // L2 tidak dilayani lift sama sekali: gagal aksesibel tanpa penutupan penyebab.
    expect(findRoute(graph, lobby, entrance('L2-A01'), { accessible: true })).toEqual({
      ok: false,
      reason: 'accessible_blocked',
      blockingClosureIds: [],
    });
  });

  it('penutupan yang sudah lewat tidak berpengaruh (waktu disuntikkan)', () => {
    const expired = closure('kemarin', {
      connectorId: connectors.lift,
      startsAt: '2026-09-30T08:00:00Z',
      endsAt: '2026-09-30T17:00:00Z',
    });
    const result = findRoute(graph, lobby, entrance('L1-A03'), {
      accessible: true,
      closures: [expired],
      now,
    });
    expect(connectorsOf(result).map((leg) => leg.connectorId)).toEqual([connectors.lift]);
    expect(result.ok && result.avoidedClosureIds).toEqual([]);
  });

  it('rute memutar karena penutupan menyebut penutupannya; jalan satu-satunya → closed', () => {
    const shortcut = closure('tangga-luar', { edgeId: GRAPH.outdoorShortcut });
    const detour = findRoute(graph, entrance('GF-A02'), entrance('GT-B03'), {
      closures: [shortcut],
      now,
    });
    expect(detour.ok && detour.avoidedClosureIds).toEqual(['tangga-luar']);
    expect(detour.ok && detour.legs[2]?.kind === 'walk' && detour.legs[2].nodeIds).toEqual([
      GRAPH.guDoorOut,
      GRAPH.outdoorWest,
      GRAPH.outdoorEast,
      GRAPH.gtDoorOut,
    ]);

    const door = closure('pintu-utama', { connectorId: connectors.guDoor });
    expect(
      findRoute(graph, entrance('GF-A02'), entrance('GT-B03'), { closures: [door], now }),
    ).toEqual({ ok: false, reason: 'closed', blockingClosureIds: ['pintu-utama'] });
  });

  it('6. tujuan dengan dua unit: rute ke titik masuk terdekat', () => {
    const source = sampleSnapshotSource();
    const east = unitIdOf('GF-A08');
    const west = unitIdOf('GF-A01');
    const split = venue({
      ...source,
      locations: source.locations.map((l) =>
        l.id === IDS.radiology ? { ...l, unitIds: [west, east], primaryUnitId: west } : l,
      ),
    });
    const target = locationTarget(split.snapshot, IDS.radiology);
    expect(target).toEqual({
      kind: 'nodes',
      nodeIds: expect.arrayContaining([ENTRANCES.get(west), ENTRANCES.get(east)]),
    });
    const fromEast = findRoute(split.graph, entrance('GF-B08'), target ?? lobby);
    expect(fromEast.ok && fromEast.path.at(-1)).toBe(ENTRANCES.get(east));
    const fromWest = findRoute(split.graph, lobby, target ?? lobby);
    expect(fromWest.ok && fromWest.path.at(-1)).toBe(ENTRANCES.get(west));
  });

  it('7. dari QR titik asal dan dari Info Point ke lokasi di gedung lain', () => {
    const source = sampleSnapshotSource();
    const gtUnit = unitIdOf('GT-A02');
    const kiosk = '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4c01';
    const [template] = source.locations;
    const withKiosk = venue({
      ...source,
      locations: template
        ? [
            ...source.locations,
            {
              ...template,
              id: kiosk,
              code: 'KIO-1',
              name: 'Kios',
              unitIds: [gtUnit],
              primaryUnitId: gtUnit,
            },
          ]
        : source.locations,
    });
    const to = locationTarget(withKiosk.snapshot, kiosk);
    for (const from of [
      originPointTarget(withKiosk.snapshot, '3fa9c1d2e4b5'),
      infoPointTarget(withKiosk.snapshot, 'IP-LOBI'),
    ]) {
      expect(from).not.toBeNull();
      const result = findRoute(withKiosk.graph, from ?? lobby, to ?? lobby);
      expect(result.ok).toBe(true);
      expect(connectorsOf(result).map((leg) => leg.connectorKind)).toEqual([
        'building_door',
        'building_door',
      ]);
      expect(result.ok && result.path.at(-1)).toBe(ENTRANCES.get(gtUnit));
    }
    expect(originPointTarget(withKiosk.snapshot, 'tidak-ada')).toBeNull();
  });
});
