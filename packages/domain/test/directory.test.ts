import { describe, expect, it } from 'vitest';
import {
  buildSnapshot,
  createSnapshotLookup,
  type DirectoryFilter,
  directoryGroups,
  directoryOptions,
  EMPTY_DIRECTORY_FILTER,
  OUTDOOR_BUILDING,
  withDirectoryBuilding,
} from '../src';
import { BROWSE_IDS, browseSnapshotSource } from './fixtures/browse-source';
import { IDS } from './fixtures/snapshot-source';

const snapshot = buildSnapshot(browseSnapshotSource());
const lookup = createSnapshotLookup(snapshot);
const [main, east] = snapshot.buildings;
const floor = (buildingId: string | undefined, name: string) =>
  snapshot.floors.find((f) => f.buildingId === buildingId && f.name === name)?.id ?? '';

const names = (filter: Partial<DirectoryFilter>) =>
  directoryGroups(lookup, { ...EMPTY_DIRECTORY_FILTER, ...filter }).flatMap((group) =>
    group.locations.map((location) => location.name),
  );

describe('direktori A–Z', () => {
  it('semua lokasi snapshot urut abjad, dikelompokkan per huruf awal', () => {
    const groups = directoryGroups(lookup, EMPTY_DIRECTORY_FILTER);
    expect(groups.map((g) => g.letter)).toEqual(['#', 'E', 'L', 'P', 'R']);
    expect(groups.flatMap((g) => g.locations.map((l) => l.name))).toEqual([
      '24 Jam Darurat',
      'Émbung Taman',
      'Laboratorium',
      'Pusat Informasi',
      'Radiologi',
      'Ruang Rapat Timur',
      'Ruang Tunggu Ümum',
    ]);
  });

  it('lokasi nonaktif permanen tidak ada di direktori', () => {
    expect(names({})).not.toContain('Apotek Lama');
  });

  it('filter gedung, lantai, dan tipe bekerja sendiri dan bersamaan', () => {
    expect(names({ building: east?.id ?? null })).toEqual(['Ruang Rapat Timur']);
    expect(names({ building: main?.id ?? null })).toEqual([
      '24 Jam Darurat',
      'Pusat Informasi',
      'Radiologi',
    ]);
    expect(names({ building: OUTDOOR_BUILDING })).toEqual(['Émbung Taman']);
    expect(names({ building: main?.id ?? null, floorId: floor(main?.id, 'L1') })).toEqual([
      'Pusat Informasi',
    ]);
    expect(names({ locationTypeId: BROWSE_IDS.roomType })).toEqual(['Ruang Rapat Timur']);
    expect(names({ building: main?.id ?? null, locationTypeId: BROWSE_IDS.roomType })).toEqual([]);
  });

  it('lokasi tanpa unit hanya tampil tanpa filter gedung/lantai', () => {
    expect(names({ locationTypeId: IDS.serviceType })).toContain('Laboratorium');
    expect(names({ building: main?.id ?? null })).not.toContain('Laboratorium');
  });

  it('mengganti gedung melepas lantai terpilih', () => {
    const filter = { ...EMPTY_DIRECTORY_FILTER, building: main?.id ?? null, floorId: 'x' };
    expect(withDirectoryBuilding(filter, east?.id ?? null)).toEqual({
      ...EMPTY_DIRECTORY_FILTER,
      building: east?.id,
    });
  });
});

describe('pilihan filter direktori', () => {
  it('gedung dan tipe yang punya lokasi, Area Luar di akhir', () => {
    const options = directoryOptions(lookup, EMPTY_DIRECTORY_FILTER);
    expect(options.buildings).toEqual([
      { id: main?.id, name: 'Gedung Utama' },
      { id: east?.id, name: 'Gedung Timur' },
      { id: OUTDOOR_BUILDING, name: 'Area Luar' },
    ]);
    expect(options.locationTypes.map((t) => t.name)).toEqual(['Layanan', 'Ruang']);
    expect(options.floors).toEqual([]);
  });

  it('lantai gedung terpilih yang punya lokasi, dari atas ke bawah', () => {
    const options = directoryOptions(lookup, {
      ...EMPTY_DIRECTORY_FILTER,
      building: main?.id ?? null,
    });
    expect(options.floors).toEqual([
      { id: floor(main?.id, 'L1'), name: 'L1' },
      { id: floor(main?.id, 'GF'), name: 'GF' },
    ]);
    expect(
      directoryOptions(lookup, { ...EMPTY_DIRECTORY_FILTER, building: OUTDOOR_BUILDING }).floors,
    ).toEqual([]);
  });

  it('venue satu gedung: lantai bisa dipilih tanpa memilih gedung', () => {
    const source = browseSnapshotSource();
    const single = buildSnapshot({
      ...source,
      buildings: source.buildings.filter((b) => b.id === main?.id),
      floors: source.floors.filter((f) => f.buildingId !== east?.id),
      features: source.features.filter((f) => f.floorId !== floor(east?.id, 'GF')),
    });
    const options = directoryOptions(createSnapshotLookup(single), EMPTY_DIRECTORY_FILTER);
    expect(options.floors.map((f) => f.name)).toEqual(['L1', 'GF']);
  });
});
