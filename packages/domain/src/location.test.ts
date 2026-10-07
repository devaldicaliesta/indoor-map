import { describe, expect, it } from 'vitest';
import type { BuildingId, FeatureId, FloorId, LocationId } from './ids';
import {
  checkCategoryName,
  checkLocationCode,
  checkLocationInput,
  holdsUnits,
  type LocationUnit,
  moveCategory,
  orderedUnits,
  otherHolder,
  suggestUnits,
  type VenueUnit,
} from './location';

const id = <T extends string>(n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as unknown as T;

const GEDUNG_A = id<BuildingId>(1);
const A_L1 = id<FloorId>(11);

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
