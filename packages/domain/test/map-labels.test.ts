import { describe, expect, it } from 'vitest';
import { buildSnapshot, LABEL_PRIORITY, type MapLabel, mapLabels, visibleFloorIds } from '../src';
import { IDS, RADIOLOGY_UNITS, sampleSnapshotSource } from './fixtures/snapshot-source';

function snapshotWithSafetyFacility() {
  const source = sampleSnapshotSource();
  const firstFacility = source.features.find((f) => f.kind === 'facility');
  return {
    snapshot: buildSnapshot({
      ...source,
      features: source.features.map((f) =>
        f.id === firstFacility?.id ? { ...f, facilityTypeId: IDS.extinguisherType } : f,
      ),
    }),
    safetyId: firstFacility?.id,
  };
}

const locationLabels = (labels: MapLabel[]) => labels.filter((l) => l.kind === 'location');

describe('label peta', () => {
  const { snapshot, safetyId } = snapshotWithSafetyFacility();
  const unitFloor = snapshot.features.features.find((f) => f.id === RADIOLOGY_UNITS[0])?.properties
    .floorId;
  const floors = visibleFloorIds(snapshot, unitFloor ?? '');

  it('satu label per lokasi per lantai, diletakkan di dalam unit utamanya', () => {
    const labels = locationLabels(mapLabels(snapshot, floors));
    const radiology = labels.filter((l) => l.id === IDS.radiology);
    expect(radiology).toHaveLength(1);
    const unit = snapshot.features.features.find((f) => f.id === RADIOLOGY_UNITS[0]);
    const ring = unit?.geometry.type === 'Polygon' ? unit.geometry.coordinates[0] : undefined;
    const xs = (ring ?? []).map((p) => p[0]);
    const ys = (ring ?? []).map((p) => p[1]);
    const [x, y] = radiology[0]?.position ?? [0, 0];
    expect(x).toBeGreaterThan(Math.min(...xs));
    expect(x).toBeLessThan(Math.max(...xs));
    expect(y).toBeGreaterThan(Math.min(...ys));
    expect(y).toBeLessThan(Math.max(...ys));
    expect(radiology[0]).toMatchObject({ name: 'Radiologi', priority: LABEL_PRIORITY.location });
  });

  it('lokasi dan fasilitas yang disorot mendapat prioritas tertinggi', () => {
    const allFloors = snapshot.floors.map((f) => f.id);
    const labels = mapLabels(snapshot, allFloors, [IDS.radiology, safetyId ?? '']);
    expect(labels.find((l) => l.id === IDS.radiology)?.priority).toBe(LABEL_PRIORITY.selected);
    expect(labels.find((l) => l.id === safetyId)?.priority).toBe(LABEL_PRIORITY.selected);
    const others = labels.filter((l) => l.id !== IDS.radiology && l.id !== safetyId);
    expect(others.every((l) => l.priority !== LABEL_PRIORITY.selected)).toBe(true);
  });

  it('fasilitas keselamatan didahulukan dari lokasi dan fasilitas lain', () => {
    const labels = mapLabels(
      snapshot,
      snapshot.floors.map((f) => f.id),
    );
    const facilities = labels.filter((l) => l.kind === 'facility');
    expect(facilities.find((l) => l.id === safetyId)?.priority).toBe(LABEL_PRIORITY.safety);
    expect(
      facilities
        .filter((l) => l.id !== safetyId)
        .every((l) => l.priority === LABEL_PRIORITY.facility),
    ).toBe(true);
    expect(LABEL_PRIORITY.selected).toBeLessThan(LABEL_PRIORITY.safety);
    expect(LABEL_PRIORITY.safety).toBeLessThan(LABEL_PRIORITY.location);
    expect(LABEL_PRIORITY.location).toBeLessThan(LABEL_PRIORITY.facility);
  });

  it('hanya lantai yang digambar yang diberi label', () => {
    const labels = mapLabels(snapshot, floors);
    expect(labels.every((l) => floors.includes(l.floorId))).toBe(true);
    expect(mapLabels(snapshot, [])).toEqual([]);
  });

  it('lokasi tanpa unit atau di lantai lain tidak diberi label', () => {
    const labels = locationLabels(mapLabels(snapshot, floors));
    expect(labels.some((l) => l.id === IDS.lab)).toBe(false);
  });
});
