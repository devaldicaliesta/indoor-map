import { describe, expect, it } from 'vitest';
import {
  buildSnapshot,
  categoryMembers,
  exploreChips,
  facilityMembers,
  featurePlace,
  floorsShowing,
  indexSnapshot,
  locationPlaces,
  type MapView,
  selectionHighlight,
  targetOfFeature,
  viewShowing,
} from '../src';
import { IDS, RADIOLOGY_UNITS, sampleSnapshotSource } from './fixtures/snapshot-source';

const snapshot = buildSnapshot(sampleSnapshotSource());
const index = indexSnapshot(snapshot);
const features = snapshot.features.features;
const [main, east] = [...snapshot.buildings];
const floorOf = (buildingId: string | undefined, name: string) =>
  snapshot.floors.find((f) => f.buildingId === buildingId && f.name === name);
const mainGf = floorOf(main?.id, 'GF');
const mainL1 = floorOf(main?.id, 'L1');
const mainL2 = floorOf(main?.id, 'L2');
const eastGf = floorOf(east?.id, 'GF');
const outdoor = snapshot.floors.find((f) => f.isOutdoor);
const onFloor = (floorId: string | undefined, kind: string) =>
  features.filter((f) => f.properties.floorId === floorId && f.properties.kind === kind);
const facilities = features.filter((f) => f.properties.kind === 'facility');
// Builder mengurutkan id unit lokasi.
const radiologyUnitIds = [...RADIOLOGY_UNITS].sort();

describe('tempat fitur dan lokasi', () => {
  it('fitur di gedung menyebut gedung dan lantainya; Area Luar tanpa gedung', () => {
    expect(featurePlace(index, RADIOLOGY_UNITS[0] ?? '')).toEqual({
      floor: mainGf,
      building: main,
    });
    const area = onFloor(outdoor?.id, 'outdoor_area')[0];
    expect(featurePlace(index, area?.id ?? '')).toEqual({ floor: outdoor, building: null });
    expect(featurePlace(index, 'tidak-ada')).toBeNull();
  });

  it('lokasi dikelompokkan per lantai, unit utama lebih dulu', () => {
    const radiology = index.locations.get(IDS.radiology);
    const places = radiology ? locationPlaces(index, radiology) : [];
    expect(places).toHaveLength(1);
    expect(places[0]?.floor).toEqual(mainGf);
    expect(places[0]?.units.map((u) => u.id)).toEqual(RADIOLOGY_UNITS);
    const lab = index.locations.get(IDS.lab);
    expect(lab ? locationPlaces(index, lab) : null).toEqual([]);
  });

  it('unit utama di lantai lain mendahulukan lantai itu', () => {
    const l1Unit = onFloor(mainL1?.id, 'unit')[0];
    const source = sampleSnapshotSource();
    const moved = buildSnapshot({
      ...source,
      locations: source.locations.map((l) =>
        l.id === IDS.radiology
          ? { ...l, unitIds: [...l.unitIds, l1Unit?.id ?? ''], primaryUnitId: l1Unit?.id ?? null }
          : l,
      ),
    });
    const movedIndex = indexSnapshot(moved);
    const radiology = movedIndex.locations.get(IDS.radiology);
    const places = radiology ? locationPlaces(movedIndex, radiology) : [];
    expect(places.map((p) => p.floor.name)).toEqual(['L1', 'GF']);
  });
});

describe('anggota kategori dan jenis fasilitas', () => {
  it('kategori berisi semua lokasinya, urut nama', () => {
    expect(categoryMembers(snapshot, IDS.examCategory).map((l) => l.id)).toEqual([
      IDS.lab,
      IDS.radiology,
    ]);
  });

  it('jenis fasilitas berisi semua fasilitasnya, urut lantai', () => {
    const members = facilityMembers(snapshot, index, IDS.toiletType);
    expect(members).toHaveLength(facilities.length);
    const floors = members.map((f) => index.floorOrder.get(f.properties.floorId) ?? -1);
    expect(floors).toEqual([...floors].sort((a, b) => a - b));
    expect(facilityMembers(snapshot, index, IDS.extinguisherType)).toEqual([]);
  });

  it('chip hanya untuk kategori dan jenis fasilitas yang punya anggota', () => {
    expect(
      exploreChips(snapshot).map((chip) => [
        chip.kind,
        chip.kind === 'category' ? chip.category.id : chip.facilityType.id,
        chip.count,
      ]),
    ).toEqual([
      ['category', IDS.examCategory, 2],
      ['facility_type', IDS.toiletType, facilities.length],
    ]);
  });
});

describe('ketuk peta dan sorotan', () => {
  it('unit berlokasi membuka lokasi; unit kosong membuka unit; fasilitas membuka fasilitas', () => {
    const vacant = onFloor(mainGf?.id, 'unit').find((u) => !RADIOLOGY_UNITS.includes(u.id));
    expect(targetOfFeature(index, RADIOLOGY_UNITS[1] ?? '')).toEqual({
      kind: 'location',
      id: IDS.radiology,
    });
    expect(targetOfFeature(index, vacant?.id ?? '')).toEqual({ kind: 'unit', id: vacant?.id });
    expect(targetOfFeature(index, facilities[0]?.id ?? '')).toEqual({
      kind: 'facility',
      id: facilities[0]?.id,
    });
    expect(targetOfFeature(index, onFloor(mainGf?.id, 'corridor')[0]?.id ?? '')).toBeNull();
  });

  it('kategori menyorot unit semua anggotanya dan mendahulukan labelnya', () => {
    expect(selectionHighlight(snapshot, index, { kind: 'category', id: IDS.examCategory })).toEqual(
      { featureIds: radiologyUnitIds, labelIds: [IDS.lab, IDS.radiology], preferredFloorId: null },
    );
  });

  it('jenis fasilitas menyorot semua fasilitasnya', () => {
    const highlight = selectionHighlight(snapshot, index, {
      kind: 'facility_type',
      id: IDS.toiletType,
    });
    expect(highlight.featureIds).toHaveLength(facilities.length);
    expect(highlight.labelIds).toEqual(highlight.featureIds);
  });

  it('lokasi, unit, dan fasilitas membawa lantainya', () => {
    expect(selectionHighlight(snapshot, index, { kind: 'location', id: IDS.radiology })).toEqual({
      featureIds: radiologyUnitIds,
      labelIds: [IDS.radiology],
      preferredFloorId: mainGf?.id,
    });
    const facility = facilities[0];
    expect(
      selectionHighlight(snapshot, index, { kind: 'facility', id: facility?.id ?? '' }),
    ).toEqual({
      featureIds: [facility?.id],
      labelIds: [facility?.id],
      preferredFloorId: facility?.properties.floorId,
    });
    expect(
      selectionHighlight(snapshot, index, { kind: 'unit', id: 'tidak-ada' }).featureIds,
    ).toEqual([]);
    expect(selectionHighlight(snapshot, index, null).featureIds).toEqual([]);
  });
});

describe('lantai yang memperlihatkan fitur', () => {
  const current: MapView = { buildingId: main?.id ?? null, floorId: mainL1?.id ?? null };

  it('penanda lantai: lantai gedung yang menampilkan fitur, Area Luar di lantai dasar', () => {
    expect(floorsShowing(snapshot, index, main?.id ?? '', RADIOLOGY_UNITS)).toEqual([mainGf?.id]);
    const area = onFloor(outdoor?.id, 'outdoor_area')[0];
    expect(floorsShowing(snapshot, index, main?.id ?? '', [area?.id ?? ''])).toEqual([mainGf?.id]);
    expect(floorsShowing(snapshot, index, east?.id ?? '', RADIOLOGY_UNITS)).toEqual([]);
  });

  it('lantai sekarang dipertahankan bila sudah menampilkan salah satu fitur', () => {
    const l1Unit = onFloor(mainL1?.id, 'unit')[0]?.id ?? '';
    expect(viewShowing(snapshot, index, current, [l1Unit, ...RADIOLOGY_UNITS])).toBe(current);
  });

  it('pindah ke lantai pilihan, lalu lantai dengan fitur terbanyak', () => {
    // 16 unit di L2 mengalahkan 2 unit Radiologi di GF.
    const l2Units = onFloor(mainL2?.id, 'unit').map((u) => u.id);
    expect(viewShowing(snapshot, index, current, [...RADIOLOGY_UNITS, ...l2Units])).toEqual({
      buildingId: main?.id,
      floorId: mainL2?.id,
    });
    expect(
      viewShowing(snapshot, index, current, [...RADIOLOGY_UNITS, ...l2Units], mainGf?.id),
    ).toEqual({ buildingId: main?.id, floorId: mainGf?.id });
  });

  it('fitur di gedung lain membuka gedung itu; Area Luar lewat lantai dasar gedung sekarang', () => {
    const eastUnit = onFloor(eastGf?.id, 'unit')[0]?.id ?? '';
    expect(viewShowing(snapshot, index, current, [eastUnit])).toEqual({
      buildingId: east?.id,
      floorId: eastGf?.id,
    });
    const area = onFloor(outdoor?.id, 'outdoor_area')[0]?.id ?? '';
    expect(viewShowing(snapshot, index, current, [area])).toEqual({
      buildingId: main?.id,
      floorId: mainGf?.id,
    });
    expect(viewShowing(snapshot, index, current, ['tidak-ada'])).toBeNull();
  });
});
