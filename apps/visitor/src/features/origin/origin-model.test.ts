import { buildSnapshot, indexSnapshot } from '@indoor/domain';
import {
  IDS,
  RADIOLOGY_UNITS,
  sampleSnapshotSource,
} from '@indoor/domain/fixtures/snapshot-source.ts';
import { describe, expect, it } from 'vitest';
import { originView, placeOfTarget, tapFloorId } from './origin-model';

const snapshot = buildSnapshot(sampleSnapshotSource());
const index = indexSnapshot(snapshot);
const lobby = snapshot.originPoints[0];

describe('titik asal Visitor', () => {
  it('QR: posisi, lantai, arah hadap, dan nama dari snapshot', () => {
    expect(originView(snapshot, index, { kind: 'origin_point', code: lobby?.code ?? '' })).toEqual({
      floorId: lobby?.floorId,
      position: lobby?.coordinates,
      headingDeg: 90,
      name: 'Lobi Utama',
    });
  });

  it('lokasi dan fitur: titik di dalam unit utama, tanpa arah hadap', () => {
    const view = originView(
      snapshot,
      index,
      placeOfTarget({ kind: 'location', id: IDS.radiology }),
    );
    const unit = index.features.get(RADIOLOGY_UNITS[0] ?? '');
    expect(view?.floorId).toBe(unit?.properties.floorId);
    expect(view?.headingDeg).toBeNull();
    expect(view?.name).toBe(index.locations.get(IDS.radiology)?.name);
    const facility = snapshot.features.features.find((f) => f.properties.kind === 'facility');
    const facilityView = originView(
      snapshot,
      index,
      placeOfTarget({ kind: 'facility', id: facility?.id ?? '' }),
    );
    expect(facilityView?.position).toEqual(
      facility?.geometry.type === 'Point' ? facility.geometry.coordinates : null,
    );
  });

  it('titik di peta tanpa nama; tempat yang tidak ada: null', () => {
    const floorId = snapshot.floors[0]?.id ?? '';
    expect(originView(snapshot, index, { kind: 'point', lng: 1, lat: 2, floorId })).toEqual({
      floorId,
      position: [1, 2],
      headingDeg: null,
      name: null,
    });
    expect(originView(snapshot, index, { kind: 'feature', featureId: 'hilang' })).toBeNull();
    expect(originView(snapshot, index, { kind: 'point', lng: 1, lat: 2, floorId: 'x' })).toBeNull();
  });
});

describe('lantai ketukan', () => {
  it('di dalam footprint: lantai gedung; di luar pada lantai dasar: Area Luar', () => {
    const lobbyFloor = lobby?.floorId ?? '';
    const outdoor = snapshot.floors.find((f) => f.isOutdoor)?.id;
    const building = snapshot.buildings.find(
      (b) => b.id === snapshot.floors.find((f) => f.id === lobbyFloor)?.buildingId,
    );
    const [[x0, y0] = [0, 0], [x1, y1] = [0, 0]] = [
      building?.footprint?.coordinates[0]?.[0],
      building?.footprint?.coordinates[0]?.[2],
    ];
    const inside: [number, number] = [(x0 + x1) / 2, (y0 + y1) / 2];
    expect(tapFloorId(snapshot, lobbyFloor, inside)).toBe(lobbyFloor);
    expect(tapFloorId(snapshot, lobbyFloor, [x1 + 0.001, y1 + 0.001])).toBe(outdoor);
    const upper =
      snapshot.floors.find((f) => f.buildingId === building?.id && f.level > 0)?.id ?? '';
    expect(tapFloorId(snapshot, upper, [x1 + 0.001, y1 + 0.001])).toBe(upper);
  });
});
