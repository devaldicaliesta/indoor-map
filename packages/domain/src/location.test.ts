import { describe, expect, it } from 'vitest';
import { EMPTY_OPENING_HOURS } from './hours';
import type { BuildingId, CategoryId, FeatureId, FloorId, LocationId, VenueId } from './ids';
import {
  checkCategoryName,
  checkLocationCode,
  checkLocationInput,
  EMPTY_LOCATION_FILTER,
  filterLocations,
  holdsUnits,
  type Location,
  type LocationUnit,
  moveCategory,
  OUTDOOR_BUILDING,
  orderedUnits,
  otherHolder,
  suggestUnits,
  type VenueUnit,
} from './location';

const id = <T extends string>(n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as unknown as T;

const GEDUNG_A = id<BuildingId>(1);
const GEDUNG_B = id<BuildingId>(2);
const A_L1 = id<FloorId>(11);
const A_L2 = id<FloorId>(12);
const B_L1 = id<FloorId>(21);
const LUAR = id<FloorId>(31);
const POLI = id<CategoryId>(41);
const LAB = id<CategoryId>(42);

function unit(
  code: string,
  floorId: FloorId,
  buildingId: BuildingId | null,
  isPrimary = false,
): LocationUnit {
  return {
    featureId: id<FeatureId>(code.length * 1000 + code.charCodeAt(code.length - 1)),
    unitCode: code,
    floorId,
    floorName: 'L1',
    buildingId,
    buildingName: buildingId ? 'Gedung' : null,
    isPrimary,
  };
}

function location(
  n: number,
  name: string,
  extra: Partial<Pick<Location, 'code' | 'categoryIds' | 'units'>> = {},
): Location {
  return {
    id: id<LocationId>(100 + n),
    venueId: id<VenueId>(900),
    locationTypeId: id(901),
    customFields: {},
    openingDate: null,
    hours: EMPTY_OPENING_HOURS,
    code: extra.code ?? null,
    name,
    description: null,
    logoPath: null,
    photoPaths: [],
    status: 'active',
    categoryIds: extra.categoryIds ?? [],
    units: extra.units ?? [],
  };
}

const LOCATIONS = [
  location(1, 'Poli Anak', {
    code: 'POL-01',
    categoryIds: [POLI],
    units: [unit('A-L1-001', A_L1, GEDUNG_A, true), unit('A-L2-004', A_L2, GEDUNG_A)],
  }),
  location(2, 'Laboratorium', {
    code: 'LAB-02',
    categoryIds: [LAB],
    units: [unit('A-L1-002', A_L1, GEDUNG_A, true)],
  }),
  location(3, 'Poli Gigi', { categoryIds: [POLI], units: [unit('B-L1-001', B_L1, GEDUNG_B)] }),
  location(4, 'Kafé Taman', { units: [unit('LUAR-001', LUAR, null)] }),
  location(5, 'Apotek 2', { categoryIds: [POLI] }),
];

const names = (list: Location[]) => list.map((l) => l.name);

describe('filterLocations', () => {
  it('tanpa filter: semua lokasi, urut nama', () => {
    expect(names(filterLocations(LOCATIONS, EMPTY_LOCATION_FILTER))).toEqual([
      'Apotek 2',
      'Kafé Taman',
      'Laboratorium',
      'Poli Anak',
      'Poli Gigi',
    ]);
  });

  it('filter kategori, gedung, dan lantai berlaku bersamaan', () => {
    const poli = { ...EMPTY_LOCATION_FILTER, categoryId: POLI };
    expect(names(filterLocations(LOCATIONS, poli))).toEqual(['Apotek 2', 'Poli Anak', 'Poli Gigi']);
    expect(names(filterLocations(LOCATIONS, { ...poli, building: GEDUNG_A }))).toEqual([
      'Poli Anak',
    ]);
    expect(
      names(filterLocations(LOCATIONS, { ...poli, building: GEDUNG_A, floorId: A_L2 })),
    ).toEqual(['Poli Anak']);
    // Laboratorium ada di Gedung A lantai L1 tetapi bukan kategori Poli.
    expect(
      names(
        filterLocations(LOCATIONS, { ...EMPTY_LOCATION_FILTER, building: GEDUNG_A, floorId: A_L1 }),
      ),
    ).toEqual(['Laboratorium', 'Poli Anak']);
    expect(
      names(filterLocations(LOCATIONS, { ...poli, building: GEDUNG_B, floorId: A_L1 })),
    ).toEqual([]);
  });

  it('Area Luar = unit tanpa gedung; lokasi tanpa unit tidak lolos filter tempat', () => {
    expect(
      names(filterLocations(LOCATIONS, { ...EMPTY_LOCATION_FILTER, building: OUTDOOR_BUILDING })),
    ).toEqual(['Kafé Taman']);
  });

  it('penanda "belum tertaut": hanya lokasi tanpa unit', () => {
    expect(
      names(filterLocations(LOCATIONS, { ...EMPTY_LOCATION_FILTER, unlinkedOnly: true })),
    ).toEqual(['Apotek 2']);
  });

  it('cari nama tanpa diakritik/huruf besar, kode lokasi, dan kode unit', () => {
    const search = (query: string) =>
      names(filterLocations(LOCATIONS, { ...EMPTY_LOCATION_FILTER, query }));
    expect(search('kafe')).toEqual(['Kafé Taman']);
    expect(search('  POLI  ')).toEqual(['Poli Anak', 'Poli Gigi']);
    expect(search('lab-02')).toEqual(['Laboratorium']);
    expect(search('a-l2-004')).toEqual(['Poli Anak']);
    expect(search('tidak ada')).toEqual([]);
  });
});

describe('checkLocationCode', () => {
  const others = [
    { id: 'a', code: 'POL-01', name: 'Poli Anak' },
    { id: 'b', code: null, name: 'Apotek' },
  ];

  it('kode opsional: kosong sah', () => {
    expect(checkLocationCode('   ', others, null)).toBeNull();
  });

  it('kode ganda ditolak tanpa membedakan huruf besar/kecil, dengan nama pemiliknya', () => {
    expect(checkLocationCode(' pol-01 ', others, null)).toEqual({
      problem: 'duplicate',
      owner: 'Poli Anak',
    });
    expect(checkLocationCode('POL-01', others, 'a')).toBeNull();
  });

  it('format dan panjang sama dengan kode unit', () => {
    expect(checkLocationCode('-01', others, null)).toEqual({ problem: 'format' });
    expect(checkLocationCode('A B', others, null)).toEqual({ problem: 'format' });
    expect(checkLocationCode('A'.repeat(33), others, null)).toEqual({ problem: 'too_long' });
    expect(checkLocationCode('Poli-A2/3', others, null)).toBeNull();
  });
});

describe('checkLocationInput', () => {
  it('nama wajib dan dibatasi; deskripsi singkat', () => {
    expect(checkLocationInput({ code: '', name: '  ', description: '' }, [], null)).toEqual({
      name: 'required',
    });
    expect(
      checkLocationInput(
        { code: '', name: 'A'.repeat(121), description: 'x'.repeat(501) },
        [],
        null,
      ),
    ).toEqual({ name: 'too_long', description: 'too_long' });
    expect(
      checkLocationInput({ code: 'X-1', name: 'Radiologi', description: '' }, [], null),
    ).toEqual({});
  });
});

describe('unit lokasi', () => {
  const venueUnit = (code: string, holders: VenueUnit['holders'] = []): VenueUnit => ({
    featureId: id<FeatureId>(code.charCodeAt(code.length - 1)),
    unitCode: code,
    unitStatus: 'vacant',
    floorId: A_L1,
    floorName: 'L1',
    floorLevel: 1,
    buildingId: GEDUNG_A,
    buildingName: 'Gedung A',
    holders,
  });
  const self = id<LocationId>(101);
  const other = id<LocationId>(102);

  it('unit yang dipakai lokasi aktif lain tidak bisa dipilih; milik sendiri bisa', () => {
    const unitTaken = venueUnit('L1-001', [{ locationId: other, name: 'Apotek' }]);
    expect(otherHolder(unitTaken, self)).toEqual({ locationId: other, name: 'Apotek' });
    expect(otherHolder(venueUnit('L1-002', [{ locationId: self, name: 'Saya' }]), self)).toBeNull();
    expect(otherHolder(venueUnit('L1-003'), null)).toBeNull();
  });

  it('holdsUnits: hanya nonaktif permanen yang melepas unit', () => {
    expect(holdsUnits('active')).toBe(true);
    expect(holdsUnits('inactive_temporary')).toBe(true);
    expect(holdsUnits('inactive_permanent')).toBe(false);
  });

  it('saran kode unit: persis, lalu berawalan, lalu memuat', () => {
    const units = ['L1-020', 'L1-002', 'XL1-02', 'L1-02'].map((code) => venueUnit(code));
    expect(suggestUnits(units, 'l1-02').map((u) => u.unitCode)).toEqual([
      'L1-02',
      'L1-020',
      'XL1-02',
    ]);
    expect(suggestUnits(units, '  ')).toEqual([]);
    expect(suggestUnits(units, 'L1', 2)).toHaveLength(2);
  });

  it('unit utama tampil pertama, lalu urut kode', () => {
    const list = orderedUnits([
      unit('L1-010', A_L1, GEDUNG_A),
      unit('L1-002', A_L1, GEDUNG_A),
      unit('L1-003', A_L1, GEDUNG_A, true),
    ]);
    expect(list.map((u) => u.unitCode)).toEqual(['L1-003', 'L1-002', 'L1-010']);
  });
});

describe('kategori', () => {
  const categories = [
    { id: 'a', name: 'Anak', sortOrder: 0 },
    { id: 'b', name: 'Bedah', sortOrder: 0 },
    { id: 'c', name: 'Gigi', sortOrder: 5 },
  ];

  it('nama wajib, maksimal 60, dan unik tanpa membedakan huruf besar/kecil', () => {
    expect(checkCategoryName(' ', categories, null)).toEqual(['required']);
    expect(checkCategoryName('x'.repeat(61), categories, null)).toEqual(['too_long']);
    expect(checkCategoryName('anak', categories, null)).toEqual(['duplicate']);
    expect(checkCategoryName('ANAK', categories, 'a')).toEqual([]);
  });

  it('memindah kategori menomori ulang seluruh urutan', () => {
    expect(moveCategory(categories, 'c', -1)).toEqual([
      { id: 'a', sortOrder: 0 },
      { id: 'c', sortOrder: 1 },
      { id: 'b', sortOrder: 2 },
    ]);
    expect(moveCategory(categories, 'a', -1)).toEqual([
      { id: 'a', sortOrder: 0 },
      { id: 'b', sortOrder: 1 },
      { id: 'c', sortOrder: 2 },
    ]);
  });
});
