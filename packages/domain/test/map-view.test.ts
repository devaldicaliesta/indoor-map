import { describe, expect, it } from 'vitest';
import {
  allows3d,
  buildingFloors,
  buildSnapshot,
  groundFloor,
  initialMapView,
  initialViewMode,
  visibleFloorIds,
} from '../src';
import { sampleSnapshotSource } from './fixtures/snapshot-source';

const snapshot = buildSnapshot(sampleSnapshotSource());
const [main, east] = snapshot.buildings;
const floorNamed = (buildingId: string | undefined, name: string) =>
  snapshot.floors.find((f) => f.buildingId === buildingId && f.name === name);
const outdoor = snapshot.floors.find((f) => f.isOutdoor);

describe('lantai dasar', () => {
  it('level 0 lebih dulu, lalu yang paling dekat ke 0 dengan lantai di atas tanah didahulukan', () => {
    expect(groundFloor([{ level: 2 }, { level: 0 }, { level: -1 }])?.level).toBe(0);
    expect(groundFloor([{ level: -1 }, { level: 1 }, { level: 3 }])?.level).toBe(1);
    expect(groundFloor([{ level: -2 }, { level: -1 }])?.level).toBe(-1);
    expect(groundFloor([])).toBeUndefined();
  });
});

describe('lantai yang digambar', () => {
  it('Area Luar ikut tampil bersama lantai dasar gedung', () => {
    const gf = floorNamed(main?.id, 'GF');
    expect(visibleFloorIds(snapshot, gf?.id ?? '')).toEqual([outdoor?.id, gf?.id]);
  });

  it('lantai atas hanya menampilkan lantainya sendiri', () => {
    const l1 = floorNamed(main?.id, 'L1');
    expect(visibleFloorIds(snapshot, l1?.id ?? '')).toEqual([l1?.id]);
  });

  it('lapisan Area Luar sendiri dan lantai yang tidak ada', () => {
    expect(visibleFloorIds(snapshot, outdoor?.id ?? '')).toEqual([outdoor?.id]);
    expect(visibleFloorIds(snapshot, 'tidak-ada')).toEqual([]);
  });

  it('pemilih lantai berurutan dari atas ke bawah', () => {
    expect(buildingFloors(snapshot, main?.id ?? '').map((f) => f.name)).toEqual(['L2', 'L1', 'GF']);
  });
});

describe('tampilan awal', () => {
  it('gedung default venue dan lantai default gedung itu', () => {
    expect(initialMapView(snapshot)).toEqual({
      buildingId: main?.id,
      floorId: floorNamed(main?.id, 'GF')?.id,
    });
  });

  it('tanpa gedung default: gedung pertama dan lantai dasarnya', () => {
    const noDefault = {
      ...snapshot,
      venue: { ...snapshot.venue, defaultBuildingId: east?.id ?? null },
      buildings: snapshot.buildings.map((b) => ({ ...b, defaultFloorId: null })),
    };
    expect(initialMapView(noDefault)).toEqual({
      buildingId: east?.id,
      floorId: floorNamed(east?.id, 'GF')?.id,
    });
  });

  it('venue tanpa gedung membuka lapisan Area Luar', () => {
    expect(initialMapView({ ...snapshot, buildings: [] })).toEqual({
      buildingId: null,
      floorId: outdoor?.id,
    });
  });

  it('mode 3D hanya bila fitur 3d ada di snapshot', () => {
    expect(snapshot.venue.display.defaultMode).toBe('3d');
    expect(allows3d(snapshot)).toBe(true);
    expect(initialViewMode(snapshot)).toBe('3d');
    const without3d = { ...snapshot, enabledFeatures: ['info_point'] };
    expect(allows3d(without3d)).toBe(false);
    expect(initialViewMode(without3d)).toBe('2d');
  });
});
