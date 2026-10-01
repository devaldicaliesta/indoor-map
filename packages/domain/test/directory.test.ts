import { describe, expect, it } from 'vitest';
import {
  buildSnapshot,
  type DirectoryFilter,
  directoryFilterOptions,
  directoryGroups,
  directoryLetter,
  directoryLocations,
  indexSnapshot,
  NO_DIRECTORY_FILTER,
  OUTDOOR_FILTER,
  type SnapshotSource,
} from '../src';
import { IDS, sampleSnapshotSource } from './fixtures/snapshot-source';

const OTHER_TYPE = '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4b01';
const KIOSK = '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4b02';
const KIOSK_UNIT = '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4b03';

/** Contoh ditambah tipe kedua dan kios di unit Area Luar agar semua filter teruji. */
function source(): SnapshotSource {
  const base = sampleSnapshotSource();
  const outdoor = base.floors.find((f) => f.isOutdoor);
  return {
    ...base,
    locationTypes: [
      ...base.locationTypes,
      { id: OTHER_TYPE, name: 'Kios', icon: null, color: null, sortOrder: 1, fields: [] },
    ],
    features: [
      ...base.features,
      {
        id: KIOSK_UNIT,
        floorId: outdoor?.id ?? '',
        kind: 'unit',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [106.827, -6.1756],
              [106.82701, -6.1756],
              [106.82701, -6.17561],
              [106.827, -6.17561],
              [106.827, -6.1756],
            ],
          ],
        },
        name: null,
        unitCode: 'LUAR-01',
        unitStatus: 'occupied',
        height: null,
        color: null,
        facilityTypeId: null,
        subtype: null,
      },
    ],
    locations: [
      ...base.locations,
      {
        id: KIOSK,
        code: null,
        name: '24 Jam Kopi',
        description: null,
        locationTypeId: OTHER_TYPE,
        status: 'active',
        openingDate: null,
        categoryIds: [],
        unitIds: [KIOSK_UNIT],
        primaryUnitId: KIOSK_UNIT,
        logoPath: null,
        photoPaths: [],
        customFields: {},
      },
    ],
  };
}

const snapshot = buildSnapshot(source());
const index = indexSnapshot(snapshot);
const [main, east] = snapshot.buildings;
const mainFloor = (name: string) =>
  snapshot.floors.find((f) => f.buildingId === main?.id && f.name === name)?.id ?? null;
const names = (filter: Partial<DirectoryFilter>) =>
  directoryLocations(snapshot, index, { ...NO_DIRECTORY_FILTER, ...filter }).map((l) => l.name);

describe('direktori A–Z', () => {
  it('semua lokasi di snapshot berurutan abjad; nonaktif permanen tidak ada', () => {
    expect(names({})).toEqual(['24 Jam Kopi', 'Laboratorium', 'Radiologi', 'Ruang Tunggu Ümum']);
  });

  it('filter gedung dan lantai memakai unit lokasi', () => {
    expect(names({ buildingId: main?.id ?? null })).toEqual(['Radiologi']);
    expect(names({ buildingId: main?.id ?? null, floorId: mainFloor('GF') })).toEqual([
      'Radiologi',
    ]);
    expect(names({ buildingId: main?.id ?? null, floorId: mainFloor('L1') })).toEqual([]);
    expect(names({ buildingId: east?.id ?? null })).toEqual([]);
    expect(names({ buildingId: OUTDOOR_FILTER })).toEqual(['24 Jam Kopi']);
  });

  it('filter lantai tanpa gedung diabaikan', () => {
    expect(names({ floorId: mainFloor('L1') })).toHaveLength(4);
  });

  it('filter tipe, juga bersama filter gedung', () => {
    expect(names({ locationTypeId: OTHER_TYPE })).toEqual(['24 Jam Kopi']);
    expect(names({ locationTypeId: IDS.serviceType })).toEqual([
      'Laboratorium',
      'Radiologi',
      'Ruang Tunggu Ümum',
    ]);
    expect(names({ locationTypeId: OTHER_TYPE, buildingId: main?.id ?? null })).toEqual([]);
  });

  it('huruf kelompok tanpa diakritik; angka dan simbol masuk #', () => {
    expect(directoryLetter('Ümum')).toBe('U');
    expect(directoryLetter('apotek')).toBe('A');
    expect(directoryLetter('24 Jam Kopi')).toBe('#');
    expect(directoryLetter('(Baru) Kafe')).toBe('#');
    expect(directoryLetter('')).toBe('#');
  });

  it('kelompok per huruf dengan # di akhir', () => {
    const groups = directoryGroups(directoryLocations(snapshot, index, NO_DIRECTORY_FILTER));
    expect(groups.map((g) => [g.letter, g.locations.map((l) => l.name)])).toEqual([
      ['L', ['Laboratorium']],
      ['R', ['Radiologi', 'Ruang Tunggu Ümum']],
      ['#', ['24 Jam Kopi']],
    ]);
  });

  it('pilihan filter hanya gedung, Area Luar, dan tipe yang punya lokasi', () => {
    expect(directoryFilterOptions(snapshot, index)).toEqual({
      buildingIds: [main?.id],
      hasOutdoor: true,
      locationTypeIds: [IDS.serviceType, OTHER_TYPE],
    });
    const plain = buildSnapshot(sampleSnapshotSource());
    expect(directoryFilterOptions(plain, indexSnapshot(plain)).hasOutdoor).toBe(false);
  });
});
