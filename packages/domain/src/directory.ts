import { compareNames, type SnapshotIndex } from './explore';
import { normalizeSearchText } from './search';
import type { Snapshot, SnapshotLocation } from './snapshot';

/** Nilai filter gedung untuk lokasi di lapisan Area Luar (id gedung selalu UUID). */
export const OUTDOOR_FILTER = 'outdoor';

export interface DirectoryFilter {
  /** Id gedung, `OUTDOOR_FILTER`, atau `null` untuk semua. */
  buildingId: string | null;
  /** Lantai di gedung terpilih; diabaikan bila gedung tidak dipilih. */
  floorId: string | null;
  locationTypeId: string | null;
}

export const NO_DIRECTORY_FILTER: DirectoryFilter = {
  buildingId: null,
  floorId: null,
  locationTypeId: null,
};

function matchesPlace(location: SnapshotLocation, index: SnapshotIndex, filter: DirectoryFilter) {
  if (!filter.buildingId) return true;
  return location.unitIds.some((unitId) => {
    const floorId = index.features.get(unitId)?.properties.floorId;
    const floor = floorId ? index.floors.get(floorId) : undefined;
    if (!floor) return false;
    if (filter.buildingId === OUTDOOR_FILTER) return floor.isOutdoor;
    return (
      floor.buildingId === filter.buildingId && (!filter.floorId || floor.id === filter.floorId)
    );
  });
}

/**
 * Direktori A–Z: lokasi di snapshot (nonaktif permanen sudah dibuang saat publish) urut nama,
 * disaring gedung, lantai, dan tipe. Lokasi yang belum menempati unit hanya muncul tanpa filter
 * gedung.
 */
export function directoryLocations(
  snapshot: Pick<Snapshot, 'locations'>,
  index: SnapshotIndex,
  filter: DirectoryFilter,
  locale = 'id',
): SnapshotLocation[] {
  return snapshot.locations
    .filter(
      (location) =>
        (!filter.locationTypeId || location.locationTypeId === filter.locationTypeId) &&
        matchesPlace(location, index, filter),
    )
    .sort((a, b) => compareNames(a.name, b.name, locale));
}

/** Huruf kelompok: huruf awal tanpa diakritik, atau `#` untuk angka dan simbol. */
export function directoryLetter(name: string): string {
  const first = normalizeSearchText(name).charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
}

export interface DirectoryGroup {
  letter: string;
  locations: SnapshotLocation[];
}

/** Lokasi yang sudah urut dikelompokkan per huruf; kelompok `#` di akhir. */
export function directoryGroups(locations: readonly SnapshotLocation[]): DirectoryGroup[] {
  const groups = new Map<string, SnapshotLocation[]>();
  for (const location of locations) {
    const letter = directoryLetter(location.name);
    groups.set(letter, [...(groups.get(letter) ?? []), location]);
  }
  return [...groups]
    .map(([letter, members]) => ({ letter, locations: members }))
    .sort((a, b) => Number(a.letter === '#') - Number(b.letter === '#'));
}

export interface DirectoryFilterOptions {
  /** Gedung yang punya lokasi, urutan snapshot. */
  buildingIds: string[];
  /** Ada lokasi di lapisan Area Luar. */
  hasOutdoor: boolean;
  /** Tipe lokasi yang dipakai; filter tipe hanya berguna bila lebih dari satu. */
  locationTypeIds: string[];
}

/** Pilihan filter yang tidak pernah menghasilkan daftar kosong. */
export function directoryFilterOptions(
  snapshot: Pick<Snapshot, 'locations' | 'buildings' | 'locationTypes'>,
  index: SnapshotIndex,
): DirectoryFilterOptions {
  const buildings = new Set<string>();
  const types = new Set<string>();
  let hasOutdoor = false;
  for (const location of snapshot.locations) {
    types.add(location.locationTypeId);
    for (const unitId of location.unitIds) {
      const floorId = index.features.get(unitId)?.properties.floorId;
      const floor = floorId ? index.floors.get(floorId) : undefined;
      if (floor?.buildingId) buildings.add(floor.buildingId);
      else if (floor?.isOutdoor) hasOutdoor = true;
    }
  }
  return {
    buildingIds: snapshot.buildings.filter((b) => buildings.has(b.id)).map((b) => b.id),
    hasOutdoor,
    locationTypeIds: snapshot.locationTypes.filter((t) => types.has(t.id)).map((t) => t.id),
  };
}
