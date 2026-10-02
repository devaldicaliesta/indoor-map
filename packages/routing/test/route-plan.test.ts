import { buildSnapshot, type SnapshotSource } from '@indoor/domain';
import { IDS, sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { FLOORS, GRAPH, unitIdOf } from '@indoor/domain/fixtures/venue-graph.ts';
import { describe, expect, it } from 'vitest';
import {
  buildRouteGraph,
  instructionText,
  planRoute,
  type RouteClosure,
  type RouteOptions,
  type RoutePlace,
  type RoutePlan,
  routeDataFromDraft,
} from '../src';
import { DEFAULT_TEMPLATES } from './fixtures/instruction-templates';
import { draftOf } from './fixtures/route-draft';

/** Rencana rute dari snapshot (Visitor) dan dari draft (uji rute Admin) untuk sumber yang sama. */
function bothWays(source: SnapshotSource) {
  const snapshot = buildSnapshot(source);
  const data = routeDataFromDraft(draftOf(source));
  const snapshotGraph = buildRouteGraph(snapshot);
  const draftGraph = buildRouteGraph(data);
  return {
    snapshot,
    plan: (from: RoutePlace, to: RoutePlace, options: RouteOptions = {}) => ({
      visitor: planRoute(snapshotGraph, snapshot, from, to, options),
      admin: planRoute(draftGraph, data, from, to, options),
    }),
  };
}

const unit = (code: string): RoutePlace => ({ kind: 'feature', featureId: unitIdOf(code) });
const lobby: RoutePlace = { kind: 'origin_point', code: '3fa9c1d2e4b5' };
const infoPoint: RoutePlace = { kind: 'info_point', code: 'IP-LOBI' };
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
const { connectors } = GRAPH;

/** Ringkasan rencana: urutan bagian rute (berjalan/konektor), atau alasan gagal. */
function summary(plan: RoutePlan): string {
  if (!plan.ok) return plan.reason;
  return plan.route.legs
    .map((leg) => (leg.kind === 'walk' ? 'jalan' : leg.connectorKind))
    .join(' > ');
}

/** Lokasi Kios di Gedung Timur, tujuan skenario 7. */
const KIOSK = '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4c01';
function withKiosk(): SnapshotSource {
  const source = sampleSnapshotSource();
  const [template] = source.locations;
  if (!template) return source;
  const gtUnit = unitIdOf('GT-A02');
  return {
    ...source,
    locations: [
      ...source.locations,
      {
        ...template,
        id: KIOSK,
        code: 'KIO-1',
        name: 'Kios',
        unitIds: [gtUnit],
        primaryUnitId: gtUnit,
      },
    ],
  };
}

/** Radiologi menempati unit paling barat dan paling timur GF (skenario 6). */
function splitRadiology(): SnapshotSource {
  const source = sampleSnapshotSource();
  const west = unitIdOf('GF-A01');
  const east = unitIdOf('GF-A08');
  return {
    ...source,
    locations: source.locations.map((l) =>
      l.id === IDS.radiology ? { ...l, unitIds: [west, east], primaryUnitId: west } : l,
    ),
  };
}

describe('uji rute Admin dari draft sama dengan rute Visitor dari snapshot (skenario wajib)', () => {
  const liftClosed = closure('lift-rusak', { connectorId: connectors.lift });
  const shortcut = closure('tangga-luar', { edgeId: GRAPH.outdoorShortcut });
  const door = closure('pintu-utama', { connectorId: connectors.guDoor });
  const cases: [string, SnapshotSource, RoutePlace, RoutePlace, RouteOptions, string][] = [
    ['1. satu lantai', sampleSnapshotSource(), unit('GF-A01'), unit('GF-B08'), {}, 'jalan'],
    [
      '2. naik lewat eskalator naik',
      sampleSnapshotSource(),
      unit('GF-A08'),
      unit('L1-A08'),
      {},
      'jalan > escalator > jalan',
    ],
    [
      '2. turun lewat eskalator turun',
      sampleSnapshotSource(),
      unit('L1-B07'),
      unit('GF-B07'),
      {},
      'jalan > escalator > jalan',
    ],
    [
      '3. antar-gedung lewat Area Luar',
      sampleSnapshotSource(),
      unit('GF-A02'),
      unit('GT-B03'),
      {},
      'jalan > building_door > jalan > building_door > jalan',
    ],
    [
      '4. aksesibel lewat satu-satunya lift',
      sampleSnapshotSource(),
      lobby,
      unit('L1-A03'),
      { accessible: true },
      'jalan > elevator > jalan',
    ],
    [
      '4. lift ditutup',
      sampleSnapshotSource(),
      lobby,
      unit('L1-A03'),
      { accessible: true, closures: [liftClosed], now },
      'accessible_blocked',
    ],
    [
      '4. lantai tanpa lift',
      sampleSnapshotSource(),
      lobby,
      unit('L2-A01'),
      { accessible: true },
      'accessible_blocked',
    ],
    [
      '5. ke L2 tanpa lift',
      sampleSnapshotSource(),
      unit('GF-A03'),
      unit('L2-B02'),
      {},
      'jalan > stairs > jalan',
    ],
    [
      '5. dari L2 tanpa lift',
      sampleSnapshotSource(),
      unit('L2-A06'),
      unit('GF-B06'),
      {},
      'jalan > stairs > jalan',
    ],
    [
      '6. lokasi dua unit, dari timur',
      splitRadiology(),
      unit('GF-B08'),
      { kind: 'location', locationId: IDS.radiology },
      {},
      'jalan',
    ],
    [
      '7. dari QR titik asal ke lokasi di gedung lain',
      withKiosk(),
      lobby,
      { kind: 'location', locationId: KIOSK },
      {},
      'jalan > building_door > jalan > building_door > jalan',
    ],
    [
      '7. dari Info Point ke lokasi di gedung lain',
      withKiosk(),
      infoPoint,
      { kind: 'location', locationId: KIOSK },
      {},
      'jalan > building_door > jalan > building_door > jalan',
    ],
    [
      'penutupan jalan pintas: rute memutar',
      sampleSnapshotSource(),
      unit('GF-A02'),
      unit('GT-B03'),
      { closures: [shortcut], now },
      'jalan > building_door > jalan > building_door > jalan',
    ],
    [
      'pintu satu-satunya ditutup',
      sampleSnapshotSource(),
      unit('GF-A02'),
      unit('GT-B03'),
      { closures: [door], now },
      'closed',
    ],
  ];

  it.each(cases)('%s', (_, source, from, to, options, expected) => {
    const { visitor, admin } = bothWays(source).plan(from, to, options);
    expect(summary(admin)).toBe(expected);
    expect(admin).toEqual(visitor);
  });

  it('3. instruksi dari draft sama dengan test skenario routing (ID dan EN)', () => {
    const { snapshot, plan } = bothWays(sampleSnapshotSource());
    const { admin } = plan(unit('GF-A02'), unit('GT-B03'));
    const texts = (language: 'id' | 'en') =>
      admin.ok
        ? admin.steps.map((step) =>
            instructionText(step, {
              templates: DEFAULT_TEMPLATES,
              language,
              floors: snapshot.floors,
              buildings: snapshot.buildings,
              origin: 'GF-A02',
              destination: 'GT-B03',
            }),
          )
        : [];
    expect(texts('id')).toEqual([
      'Mulai dari GF-A02',
      'Jalan lurus 5 m',
      'Belok kiri',
      'Jalan lurus 75 m',
      'Keluar dari Gedung Utama',
      'Jalan lurus 45 m',
      'Masuk ke Gedung Timur',
      'Jalan lurus 25 m',
      'Belok kanan',
      'Jalan lurus 5 m',
      'Tiba di GT-B03',
    ]);
    expect(texts('en')).toContain('Exit Gedung Utama');
  });

  it('penutupan yang membuat rute memutar atau gagal disebut, tanpa mencari letak putus', () => {
    const { plan } = bothWays(sampleSnapshotSource());
    const detour = plan(unit('GF-A02'), unit('GT-B03'), {
      closures: [shortcut],
      now,
    }).admin;
    expect(detour.ok && detour.route.avoidedClosureIds).toEqual(['tangga-luar']);
    expect(
      plan(lobby, unit('L1-A03'), { accessible: true, closures: [liftClosed], now }).admin,
    ).toEqual({
      ok: false,
      reason: 'accessible_blocked',
      blockingClosureIds: ['lift-rusak'],
      gap: null,
    });
  });

  it('lantai tanpa lift aksesibel: letak putus menyebut lantai dan konektornya', () => {
    const { admin } = bothWays(sampleSnapshotSource()).plan(lobby, unit('L2-A01'), {
      accessible: true,
    });
    expect(admin).toEqual({
      ok: false,
      reason: 'accessible_blocked',
      blockingClosureIds: [],
      gap: {
        kind: 'floor',
        floorId: FLOORS.guL2,
        fromFloorId: FLOORS.guGf,
        connectorIds: [connectors.stairs],
      },
    });
  });

  it('tempat yang tidak ada di draft ditolak sebelum mencari rute', () => {
    const { plan } = bothWays(sampleSnapshotSource());
    const missing: RoutePlace = { kind: 'feature', featureId: 'tidak-ada' };
    expect(plan(missing, unit('GF-A01')).admin).toMatchObject({ reason: 'origin_unknown' });
    expect(plan(unit('GF-A01'), { kind: 'origin_point', code: 'x' }).admin).toMatchObject({
      reason: 'destination_unknown',
    });
  });
});

describe('routeDataFromDraft', () => {
  it('membentuk bagian snapshot yang dipakai routing dengan aturan builder yang sama', () => {
    const source = withKiosk();
    const snapshot = buildSnapshot(source);
    const data = routeDataFromDraft(draftOf(source));
    expect(data.graph).toEqual(snapshot.graph);
    // Urutan lokasi tidak berpengaruh: routing mencarinya per id.
    const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
    expect([...data.locations].sort(byId)).toEqual(
      snapshot.locations
        .map(({ id, unitIds, primaryUnitId }) => ({ id, unitIds, primaryUnitId }))
        .sort(byId),
    );
    const geometry = new Map(snapshot.features.features.map((f) => [f.id, f.geometry]));
    for (const feature of data.features.features) {
      expect(feature.geometry).toEqual(geometry.get(feature.id));
    }
    expect(data.originPoints).toEqual(snapshot.originPoints);
    expect(data.infoPoints[0]?.coordinates).toEqual(snapshot.infoPoints[0]?.coordinates);
  });

  it('lokasi nonaktif permanen tidak bisa menjadi tujuan, sama dengan snapshot', () => {
    const data = routeDataFromDraft(draftOf(sampleSnapshotSource()));
    expect(data.locations.some((l) => l.id === IDS.closedPharmacy)).toBe(false);
    expect(data.locations.some((l) => l.id === IDS.radiology)).toBe(true);
  });
});
