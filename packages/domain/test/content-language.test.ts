import { describe, expect, it } from 'vitest';
import {
  buildSnapshot,
  categoryName,
  checkLocationInput,
  createSnapshotSearchFromPrepared,
  locationDescription,
  parseSnapshot,
  prepareSnapshotSearch,
} from '../src';
import { IDS, sampleSnapshotSource } from './fixtures/snapshot-source';

function translatedSource() {
  const source = sampleSnapshotSource();
  return {
    ...source,
    categories: source.categories.map((c) =>
      c.id === IDS.examCategory ? { ...c, nameEn: ' Examination ' } : c,
    ),
    locations: source.locations.map((l) =>
      l.id === IDS.radiology ? { ...l, descriptionEn: 'X-ray and CT scan.' } : l,
    ),
  };
}

describe('konten multi-bahasa', () => {
  it('EN dipakai bila terisi; kosong atau bahasa lain jatuh ke ID', () => {
    const category = { name: 'Pemeriksaan', nameEn: 'Examination' };
    expect(categoryName(category, 'en')).toBe('Examination');
    expect(categoryName(category, 'id')).toBe('Pemeriksaan');
    expect(categoryName({ name: 'Pemeriksaan', nameEn: '  ' }, 'en')).toBe('Pemeriksaan');
    expect(categoryName({ name: 'Pemeriksaan' }, 'en')).toBe('Pemeriksaan');
    const location = { description: 'Rontgen.', descriptionEn: 'X-ray.' };
    expect(locationDescription(location, 'en')).toBe('X-ray.');
    expect(locationDescription(location, undefined)).toBe('Rontgen.');
    expect(locationDescription({ description: null }, 'en')).toBeNull();
  });

  it('terjemahan masuk snapshot dan lolos skema; snapshot tanpa terjemahan tidak berubah', () => {
    const snapshot = buildSnapshot(translatedSource());
    expect(snapshot.categories.find((c) => c.id === IDS.examCategory)?.nameEn).toBe('Examination');
    expect(snapshot.locations.find((l) => l.id === IDS.radiology)?.descriptionEn).toBe(
      'X-ray and CT scan.',
    );
    expect(parseSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot);
    const plain = buildSnapshot(sampleSnapshotSource());
    expect(plain.categories.some((c) => 'nameEn' in c)).toBe(false);
    expect(plain.locations.some((l) => 'descriptionEn' in l)).toBe(false);
  });

  it('nama kategori EN ikut dicari', () => {
    const search = createSnapshotSearchFromPrepared(
      prepareSnapshotSearch(buildSnapshot(translatedSource())),
    );
    expect(search('examination').map((hit) => hit.id)).toContain(IDS.examCategory);
  });

  it('deskripsi EN dibatasi 500 karakter', () => {
    const base = { code: '', name: 'Radiologi', description: '' };
    expect(checkLocationInput({ ...base, descriptionEn: 'x'.repeat(501) }, [], null)).toEqual({
      descriptionEn: 'too_long',
    });
    expect(checkLocationInput({ ...base, descriptionEn: 'x'.repeat(500) }, [], null)).toEqual({});
  });
});
