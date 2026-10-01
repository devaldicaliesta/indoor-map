import { describe, expect, it } from 'vitest';
import {
  buildSnapshot,
  createSnapshotLookup,
  featureFloorIds,
  featuresOnFloors,
  floorPlaceNames,
  floorView,
  hitTarget,
  locationUnitIds,
  targetHighlight,
  targetTitle,
  targetView,
} from '../src';
import { BROWSE_IDS, browseSnapshotSource } from './fixtures/browse-source';
import { IDS, RADIOLOGY_UNITS } from './fixtures/snapshot-source';

const snapshot = buildSnapshot(browseSnapshotSource());
const lookup = createSnapshotLookup(snapshot);
const [main, east] = snapshot.buildings;
const floor = (buildingId: string | undefined, name: string) =>
  snapshot.floors.find((f) => f.buildingId === buildingId && f.name === name)?.id ?? '';
const outdoor = snapshot.floors.find((f) => f.isOutdoor)?.id ?? '';
const unit = (code: string) =>
  snapshot.features.features.find((f) => f.properties.unitCode === code)?.id ?? '';
const facility = (name: string) =>
  snapshot.features.features.find(
    (f) => f.properties.kind === 'facility' && f.properties.name === name,
  )?.id ?? '';

describe('indeks snapshot', () => {
  it('unit yang ditempati menunjuk lokasinya', () => {
    expect(lookup.unitLocation.get(unit('GF-A01'))?.id).toBe(IDS.radiology);
    expect(lookup.unitLocation.has(unit('GF-A04'))).toBe(false);
  });

  it('lantai lokasi: lantai unit utama lebih dulu, unit utama lebih dulu', () => {
    const places = lookup.locationPlaces.get(BROWSE_IDS.infoDesk) ?? [];
    expect(places.map((p) => p.floorId)).toEqual([floor(main?.id, 'L1'), floor(main?.id, 'GF')]);
    expect(places.map((p) => p.units.map((u) => u.properties.unitCode))).toEqual([
      ['L1-A02'],
      ['GF-A02'],
    ]);
    const radiology = lookup.locationPlaces.get(IDS.radiology) ?? [];
    expect(radiology).toHaveLength(1);
    expect(radiology[0]?.units.map((u) => u.id)).toEqual(RADIOLOGY_UNITS);
  });

  it('lokasi tanpa unit tidak punya lantai', () => {
    expect(lookup.locationPlaces.get(IDS.lab)).toEqual([]);
  });

  it('anggota kategori urut nama; fasilitas per jenis urut lantai', () => {
    expect(lookup.categoryLocations.get(IDS.examCategory)?.map((l) => l.name)).toEqual([
      'Laboratorium',
      'Radiologi',
    ]);
    expect(lookup.typeFacilities.get(IDS.toiletType)?.map((f) => f.properties.floorId)).toEqual([
      floor(main?.id, 'GF'),
      floor(main?.id, 'L2'),
    ]);
    expect(lookup.typeFacilities.has(IDS.extinguisherType)).toBe(false);
  });

  it('nama gedung dan lantai; Area Luar tanpa gedung', () => {
    expect(floorPlaceNames(lookup, floor(east?.id, 'GF'))).toEqual({
      building: 'Gedung Timur',
      floor: 'GF',
    });
    expect(floorPlaceNames(lookup, outdoor)).toEqual({ building: null, floor: 'Area Luar' });
    expect(floorPlaceNames(lookup, 'tidak-ada')).toBeNull();
  });
});

describe('ketuk peta', () => {
  it('label lokasi dan unit yang ditempati membuka lokasinya', () => {
    expect(hitTarget(lookup, { kind: 'location', id: IDS.radiology })).toEqual({
      kind: 'location',
      id: IDS.radiology,
    });
    expect(hitTarget(lookup, { kind: 'feature', id: unit('GF-B01') })).toEqual({
      kind: 'location',
      id: IDS.radiology,
    });
  });

  it('unit tanpa lokasi dan fasilitas membuka dirinya sendiri', () => {
    expect(hitTarget(lookup, { kind: 'feature', id: unit('GF-A04') })).toEqual({
      kind: 'unit',
      id: unit('GF-A04'),
    });
    expect(hitTarget(lookup, { kind: 'feature', id: facility('Toilet') })).toEqual({
      kind: 'facility',
      id: facility('Toilet'),
    });
  });

  it('fitur lain dan id yang tidak dikenal diabaikan', () => {
    const corridor = snapshot.features.features.find((f) => f.properties.kind === 'corridor');
    expect(hitTarget(lookup, { kind: 'feature', id: corridor?.id ?? '' })).toBeNull();
    expect(hitTarget(lookup, { kind: 'feature', id: 'tidak-ada' })).toBeNull();
    expect(hitTarget(lookup, { kind: 'location', id: IDS.closedPharmacy })).toBeNull();
  });
});

describe('sorotan dan judul', () => {
  it('lokasi menyorot semua unitnya dan mendahulukan labelnya', () => {
    expect(targetHighlight(lookup, { kind: 'location', id: BROWSE_IDS.infoDesk })).toEqual({
      featureIds: [unit('L1-A02'), unit('GF-A02')],
      labelIds: [BROWSE_IDS.infoDesk],
    });
  });

  it('kategori dan jenis fasilitas menyorot semua anggotanya', () => {
    expect(targetHighlight(lookup, { kind: 'category', id: IDS.examCategory })).toEqual({
      featureIds: [...RADIOLOGY_UNITS],
      labelIds: [IDS.lab, IDS.radiology],
    });
    const toilets = lookup.typeFacilities.get(IDS.toiletType)?.map((f) => f.id) ?? [];
    expect(targetHighlight(lookup, { kind: 'facility_type', id: IDS.toiletType })).toEqual({
      featureIds: toilets,
      labelIds: toilets,
    });
  });

  it('unit, fasilitas, dan id yang tidak dikenal', () => {
    expect(targetHighlight(lookup, { kind: 'unit', id: unit('GF-A04') }).featureIds).toEqual([
      unit('GF-A04'),
    ]);
    expect(targetHighlight(lookup, { kind: 'facility', id: facility('Musala') }).labelIds).toEqual([
      facility('Musala'),
    ]);
    expect(targetHighlight(lookup, { kind: 'unit', id: facility('Musala') }).featureIds).toEqual(
      [],
    );
    expect(targetHighlight(lookup, { kind: 'location', id: 'tidak-ada' }).featureIds).toEqual([]);
  });

  it('judul: nama, kode unit, atau nama jenis untuk fasilitas tanpa nama', () => {
    expect(targetTitle(lookup, { kind: 'location', id: IDS.radiology })).toBe('Radiologi');
    expect(targetTitle(lookup, { kind: 'unit', id: unit('GF-A04') })).toBe('GF-A04');
    expect(targetTitle(lookup, { kind: 'facility_type', id: BROWSE_IDS.prayerType })).toBe(
      'Musala',
    );
    expect(targetTitle(lookup, { kind: 'category', id: BROWSE_IDS.meetingCategory })).toBe('Rapat');
    const unnamed = buildSnapshot({
      ...browseSnapshotSource(),
      features: browseSnapshotSource().features.map((f) =>
        f.kind === 'facility' ? { ...f, name: null } : f,
      ),
    });
    const toilet = createSnapshotLookup(unnamed).typeFacilities.get(IDS.toiletType)?.[0]?.id;
    expect(targetTitle(createSnapshotLookup(unnamed), { kind: 'facility', id: toilet ?? '' })).toBe(
      'Toilet',
    );
  });

  it('lantai yang memuat sorotan urut seperti snapshot', () => {
    expect(featureFloorIds(lookup, locationUnitIds(lookup, BROWSE_IDS.infoDesk))).toEqual([
      floor(main?.id, 'GF'),
      floor(main?.id, 'L1'),
    ]);
    expect(
      featuresOnFloors(lookup, locationUnitIds(lookup, BROWSE_IDS.infoDesk), [
        floor(main?.id, 'GF'),
      ]).map((f) => f.id),
    ).toEqual([unit('GF-A02')]);
  });
});

describe('tampilan untuk target', () => {
  const mainGf = { buildingId: main?.id ?? null, floorId: floor(main?.id, 'GF') };
  const eastGf = { buildingId: east?.id ?? null, floorId: floor(east?.id, 'GF') };

  it('tidak berpindah bila sudah terlihat; Area Luar ikut terlihat di lantai dasar', () => {
    expect(targetView(lookup, { kind: 'location', id: IDS.radiology }, mainGf)).toBeNull();
    expect(targetView(lookup, { kind: 'location', id: BROWSE_IDS.pond }, mainGf)).toBeNull();
  });

  it('lokasi menuju lantai unit utamanya', () => {
    expect(targetView(lookup, { kind: 'location', id: BROWSE_IDS.infoDesk }, eastGf)).toEqual({
      buildingId: main?.id,
      floorId: floor(main?.id, 'L1'),
    });
    expect(targetView(lookup, { kind: 'location', id: IDS.radiology }, eastGf)).toEqual(mainGf);
  });

  it('kategori menuju lantai dengan anggota terbanyak, gedung sekarang didahulukan', () => {
    expect(
      targetView(lookup, { kind: 'category', id: BROWSE_IDS.meetingCategory }, mainGf),
    ).toEqual(eastGf);
    const mainL1 = { buildingId: main?.id ?? null, floorId: floor(main?.id, 'L1') };
    expect(targetView(lookup, { kind: 'facility_type', id: IDS.toiletType }, mainL1)).toEqual(
      mainGf,
    );
    expect(targetView(lookup, { kind: 'facility_type', id: IDS.toiletType }, eastGf)).toEqual(
      mainGf,
    );
  });

  it('target yang tidak ada di peta tidak memindah tampilan', () => {
    expect(targetView(lookup, { kind: 'location', id: IDS.lab }, eastGf)).toBeNull();
    expect(targetView(lookup, { kind: 'category', id: BROWSE_IDS.emptyCategory }, eastGf)).toBe(
      null,
    );
  });

  it('Area Luar dibuka bersama lantai dasar gedung yang sedang dilihat', () => {
    const mainL2 = { buildingId: main?.id ?? null, floorId: floor(main?.id, 'L2') };
    expect(floorView(lookup, outdoor, mainL2)).toEqual(mainGf);
    expect(targetView(lookup, { kind: 'location', id: BROWSE_IDS.pond }, mainL2)).toEqual(mainGf);
    expect(targetView(lookup, { kind: 'location', id: BROWSE_IDS.pond }, eastGf)).toBeNull();
    const noBuildings = createSnapshotLookup({ ...snapshot, buildings: [] });
    expect(floorView(noBuildings, outdoor, { buildingId: null, floorId: null })).toEqual({
      buildingId: null,
      floorId: outdoor,
    });
  });
});
