import { buildSnapshot } from '@indoor/domain';
import { IDS, sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { describe, expect, it } from 'vitest';
import { buildRouteGraph, nearestPlace, planRoute, planTrip, type RoutePlace } from '../src';

const snapshot = buildSnapshot(sampleSnapshotSource());
const graph = buildRouteGraph(snapshot);
const lobby: RoutePlace = { kind: 'origin_point', code: '3fa9c1d2e4b5' };
const facilities = snapshot.features.features.filter(
  (f) => f.properties.kind === 'facility' && f.properties.facilityTypeId === IDS.toiletType,
);
const toilets = facilities.map((f) => ({ kind: 'feature' as const, featureId: f.id }));
const floorOf = (featureId: string) =>
  snapshot.floors.find(
    (floor) =>
      floor.id === snapshot.features.features.find((f) => f.id === featureId)?.properties.floorId,
  );

describe('fasilitas terdekat', () => {
  it('memilih fasilitas dengan rute terpendek di antara semua kandidat', () => {
    const nearest = nearestPlace(graph, snapshot, lobby, toilets);
    const costs = toilets.map((t) => {
      const plan = planRoute(graph, snapshot, lobby, t);
      return plan.ok ? plan.route.costM : Number.POSITIVE_INFINITY;
    });
    expect(nearest?.place).toEqual(toilets[costs.indexOf(Math.min(...costs))]);
    expect(nearest?.plan.route.costM).toBe(Math.min(...costs));
    expect(floorOf(nearest?.place.featureId ?? '')?.level).toBe(0);
  });

  it('dari lantai atas memilih toilet di lantai itu, walau toilet lain lebih dekat garis lurusnya', () => {
    const upper = toilets.find((t) => floorOf(t.featureId)?.level === 2);
    if (!upper) throw new Error('Toilet L2 tidak ada');
    const nearest = nearestPlace(graph, snapshot, upper, toilets);
    expect(nearest?.place).toEqual(upper);
  });

  it('tanpa kandidat yang terjangkau hasilnya null', () => {
    expect(nearestPlace(graph, snapshot, lobby, [])).toBeNull();
  });
});

describe('rute beberapa tujuan', () => {
  const radiology: RoutePlace = { kind: 'location', locationId: IDS.radiology };
  const [first, second] = toilets.filter((t) => floorOf(t.featureId)?.level !== 0);

  it('menyambung segmen berurutan dengan langkah per segmen', () => {
    if (!first || !second) throw new Error('Toilet lantai atas tidak ada');
    const trip = planTrip(graph, snapshot, lobby, [radiology, first, second]);
    if (!trip.ok) throw new Error(trip.reason);
    const parts = [
      planRoute(graph, snapshot, lobby, radiology),
      planRoute(graph, snapshot, radiology, first),
      planRoute(graph, snapshot, first, second),
    ];
    expect(trip.segments).toHaveLength(3);
    let step = 0;
    trip.segments.forEach((segment, i) => {
      const part = parts[i];
      if (!part?.ok) throw new Error('segmen gagal');
      expect(segment).toEqual({
        firstStep: step,
        stepCount: part.steps.length,
        distanceM: part.route.distanceM,
      });
      step += part.steps.length;
    });
    expect(trip.steps).toHaveLength(step);
    expect(trip.route.distanceM).toBeCloseTo(
      parts.reduce((sum, p) => sum + (p.ok ? p.route.distanceM : 0), 0),
    );
    const lastLeg = trip.route.legs.at(-1);
    expect(lastLeg?.kind === 'walk' ? lastLeg.floorId : '').toBe(
      floorOf(second.featureId)?.id ?? 'tidak ada',
    );
  });

  it('segmen yang gagal menyebut urutan tujuannya', () => {
    const trip = planTrip(graph, snapshot, lobby, [
      radiology,
      { kind: 'location', locationId: 'tidak-ada' },
    ]);
    expect(trip.ok).toBe(false);
    if (!trip.ok) expect(trip.failedStop).toBe(1);
  });
});
