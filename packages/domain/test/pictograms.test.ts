import { describe, expect, it } from 'vitest';
import { parseFacilityIcon } from '../src/facility';
import {
  PICTOGRAM_CATEGORIES,
  PICTOGRAM_KEYS,
  PICTOGRAM_SECTORS,
  PICTOGRAMS,
  searchPictograms,
} from '../src/pictograms';
import { buildSnapshot } from '../src/snapshot-builder';
import { parseSnapshot } from '../src/snapshot-schema';
import { VENUE_TEMPLATES } from '../src/templates';
import { sampleSnapshotSource } from './fixtures/snapshot-source';

describe('katalog piktogram', () => {
  it('sekitar 150 ikon, tanpa duplikat, dengan label ID dan EN', () => {
    expect(PICTOGRAM_KEYS.length).toBeGreaterThanOrEqual(140);
    expect(PICTOGRAM_KEYS.length).toBeLessThanOrEqual(220);
    expect(new Set(PICTOGRAM_KEYS).size).toBe(PICTOGRAM_KEYS.length);
    for (const key of PICTOGRAM_KEYS) {
      expect(key).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(PICTOGRAMS[key].id.length).toBeGreaterThan(0);
      expect(PICTOGRAMS[key].en.length).toBeGreaterThan(0);
    }
  });

  it('14 kunci awal tetap ada di urutan depan', () => {
    expect(PICTOGRAM_KEYS.slice(0, 14)).toEqual([
      'toilet-male',
      'toilet-female',
      'toilet-accessible',
      'prayer-room',
      'atm',
      'first-aid',
      'information',
      'fire-extinguisher',
      'assembly-point',
      'emergency-exit',
      'elevator',
      'escalator',
      'stairs',
      'parking',
    ]);
  });

  it('setiap kategori dan sektor punya ikon', () => {
    for (const category of PICTOGRAM_CATEGORIES) {
      expect(searchPictograms({ category }).length).toBeGreaterThanOrEqual(5);
    }
    for (const sector of PICTOGRAM_SECTORS) {
      const specific = PICTOGRAM_KEYS.filter((key) => PICTOGRAMS[key].sectors.includes(sector));
      expect(specific.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('searchPictograms', () => {
  it('mencari nama Indonesia, Inggris, alias, dan kunci tanpa membedakan huruf dan aksen', () => {
    expect(searchPictograms({ query: 'apotek' })).toContain('pharmacy');
    expect(searchPictograms({ query: 'Pharmacy' })).toContain('pharmacy');
    expect(searchPictograms({ query: 'obat' })).toContain('pharmacy');
    expect(searchPictograms({ query: 'cafe' })).toContain('cafe');
    expect(searchPictograms({ query: 'café' })).toContain('cafe');
    expect(searchPictograms({ query: 'MUSHOLA' })).toEqual(['prayer-room']);
  });

  it('mencocokkan awal kata, semua kata harus cocok', () => {
    expect(searchPictograms({ query: 'parkir' })).toEqual(
      expect.arrayContaining(['parking', 'bicycle-parking', 'motorcycle-parking']),
    );
    expect(searchPictograms({ query: 'parkir motor' })).toEqual(['motorcycle-parking']);
    expect(searchPictograms({ query: 'rkir' })).toEqual([]);
  });

  it('filter kategori dan sektor; ikon lintas sektor ikut di setiap sektor', () => {
    const health = searchPictograms({ category: 'kesehatan' });
    expect(health.every((key) => PICTOGRAMS[key].category === 'kesehatan')).toBe(true);
    expect(searchPictograms({ query: 'lab', category: 'kesehatan' })).toEqual(['laboratory']);
    const retail = searchPictograms({ sector: 'ritel' });
    expect(retail).toContain('supermarket');
    expect(retail).toContain('toilet-male');
    expect(retail).not.toContain('pharmacy');
  });

  it('tanpa kueri mengembalikan semua ikon sesuai urutan katalog', () => {
    expect(searchPictograms()).toEqual(PICTOGRAM_KEYS);
  });
});

describe('kompatibilitas', () => {
  it('template tipe venue hanya memakai kunci yang ada', () => {
    const keys = new Set<string>(PICTOGRAM_KEYS);
    for (const template of Object.values(VENUE_TEMPLATES)) {
      for (const type of template.facilityTypes) if (type.icon) expect(keys).toContain(type.icon);
      for (const locationType of template.locationTypes) {
        if (locationType.icon) expect(keys).toContain(locationType.icon);
        for (const category of locationType.categories) {
          if (category.icon) expect(keys).toContain(category.icon);
        }
      }
    }
  });

  it('snapshot lama dengan kunci ikon lama tetap terbaca', () => {
    const stored = JSON.parse(JSON.stringify(buildSnapshot(sampleSnapshotSource())));
    const snapshot = parseSnapshot(stored);
    const icons = snapshot.facilityTypes.map((type) => parseFacilityIcon(type.icon));
    expect(icons).toContainEqual({ kind: 'builtin', key: 'fire-extinguisher' });
  });
});
