import { describe, expect, it } from 'vitest';
import {
  checkFacilityIconFile,
  checkFacilityTypeName,
  facilityIconPath,
  MAX_FACILITY_ICON_BYTES,
  PICTOGRAM_KEYS,
  parseFacilityIcon,
  sortFacilityTypes,
} from './facility';

describe('ikon jenis fasilitas', () => {
  it('piktogram bawaan disimpan sebagai builtin:<kunci> dan dibaca kembali', () => {
    for (const key of PICTOGRAM_KEYS) {
      const path = facilityIconPath({ kind: 'builtin', key });
      expect(path).toBe(`builtin:${key}`);
      expect(parseFacilityIcon(path)).toEqual({ kind: 'builtin', key });
    }
  });

  it('path lain adalah berkas unggahan; kunci bawaan tak dikenal diabaikan', () => {
    const path = 'facility-types/v/t-1.png';
    expect(parseFacilityIcon(path)).toEqual({ kind: 'upload', path });
    expect(facilityIconPath({ kind: 'upload', path })).toBe(path);
    expect(parseFacilityIcon('builtin:tidak-ada')).toBeNull();
    expect(parseFacilityIcon(null)).toBeNull();
    expect(facilityIconPath(null)).toBeNull();
  });

  it('set bawaan memuat 14 piktogram yang diminta tanpa duplikat', () => {
    expect(new Set(PICTOGRAM_KEYS).size).toBe(14);
  });
});

describe('checkFacilityTypeName', () => {
  const others = [
    { id: 'a', name: 'Toilet' },
    { id: 'b', name: 'Musala' },
  ];

  it('wajib, maksimal 60 karakter', () => {
    expect(checkFacilityTypeName('  ', others, null)).toEqual(['required']);
    expect(checkFacilityTypeName('A'.repeat(61), others, null)).toEqual(['too_long']);
    expect(checkFacilityTypeName('ATM', others, null)).toEqual([]);
  });

  it('nama kembar ditolak tanpa membedakan huruf besar/kecil, kecuali dirinya sendiri', () => {
    expect(checkFacilityTypeName(' toilet ', others, null)).toEqual(['duplicate']);
    expect(checkFacilityTypeName('TOILET', others, 'a')).toEqual([]);
  });
});

describe('sortFacilityTypes', () => {
  it('urut sort_order lalu nama', () => {
    const sorted = sortFacilityTypes([
      { name: 'Toilet', sortOrder: 1 },
      { name: 'ATM', sortOrder: 1 },
      { name: 'Musala', sortOrder: 0 },
    ]);
    expect(sorted.map((t) => t.name)).toEqual(['Musala', 'ATM', 'Toilet']);
  });
});

describe('checkFacilityIconFile', () => {
  const file = (name: string, type: string, size = 1000) => ({ name, type, size });

  it('menerima SVG dan PNG ≤ 200 kB', () => {
    expect(checkFacilityIconFile(file('toilet.svg', 'image/svg+xml'))).toEqual({
      ok: true,
      format: 'svg',
    });
    expect(checkFacilityIconFile(file('ATM.PNG', 'image/png', MAX_FACILITY_ICON_BYTES))).toEqual({
      ok: true,
      format: 'png',
    });
    expect(checkFacilityIconFile(file('ikon.svg', ''))).toEqual({ ok: true, format: 'svg' });
  });

  it('menolak berkas lebih dari 200 kB, kosong, atau tipe lain', () => {
    expect(checkFacilityIconFile(file('a.png', 'image/png', MAX_FACILITY_ICON_BYTES + 1))).toEqual({
      ok: false,
      problem: 'too_large',
    });
    expect(checkFacilityIconFile(file('a.png', 'image/png', 0))).toEqual({
      ok: false,
      problem: 'empty',
    });
    expect(checkFacilityIconFile(file('a.jpg', 'image/jpeg'))).toEqual({
      ok: false,
      problem: 'unsupported_type',
    });
    expect(checkFacilityIconFile(file('a.png', 'image/svg+xml'))).toEqual({
      ok: false,
      problem: 'unsupported_type',
    });
  });
});
