import { describe, expect, it } from 'vitest';
import { facilityTypeInUseMessage, mapFacilityTypeRow } from '../src/repositories/facility-types';

const row = {
  id: '00000000-0000-4000-8000-0000000000a1',
  venue_id: '10000000-0000-4000-8000-000000000001',
  name: 'APAR',
  icon_path: 'builtin:fire-extinguisher',
  is_safety: true,
  sort_order: 1,
};

describe('jenis fasilitas', () => {
  it('baris facility_types menjadi tipe domain dengan ikon terurai', () => {
    expect(mapFacilityTypeRow(row)).toEqual({
      id: row.id,
      venueId: row.venue_id,
      name: 'APAR',
      icon: { kind: 'builtin', key: 'fire-extinguisher' },
      isSafety: true,
      sortOrder: 1,
    });
    expect(mapFacilityTypeRow({ ...row, icon_path: 'facility-types/v/a.png' }).icon).toEqual({
      kind: 'upload',
      path: 'facility-types/v/a.png',
    });
    expect(mapFacilityTypeRow({ ...row, icon_path: null }).icon).toBeNull();
  });

  it('pesan jenis yang masih dipakai menyebut jumlah dan lantainya', () => {
    expect(facilityTypeInUseMessage('Toilet', 3, ['Gedung Utama GF', 'Gedung Utama L1'])).toBe(
      'Jenis "Toilet" tidak bisa dihapus karena masih dipakai 3 fasilitas di Gedung Utama GF, Gedung Utama L1. Ganti jenisnya atau hapus fasilitas tersebut di Editor Peta lebih dulu.',
    );
    // Fitur di luar jangkauan baca pengguna tetap memblokir; pesannya tetap jelas.
    expect(facilityTypeInUseMessage('ATM', 0, [])).toContain('masih dipakai fasilitas.');
  });
});
