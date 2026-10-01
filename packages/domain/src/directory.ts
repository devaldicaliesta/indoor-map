import { OUTDOOR_BUILDING } from './location';
import { normalizeSearchText } from './search';
import type { SnapshotLocation } from './snapshot';
import { compareNames, type SnapshotLookup } from './snapshot-lookup';

/** Semua filter berlaku bersamaan; `null` = semua. */
export interface DirectoryFilter {
  building: string | typeof OUTDOOR_BUILDING | null;
  floorId: string | null;
  locationTypeId: string | null;
}

export const EMPTY_DIRECTORY_FILTER: DirectoryFilter = {
  building: null,
  floorId: null,
  locationTypeId: null,
};

/** Ganti gedung: lantai terpilih dilepas karena milik gedung sebelumnya. */
export function withDirectoryBuilding(
  filter: DirectoryFilter,
  building: DirectoryFilter['building'],
): DirectoryFilter {
  return { ...filter, building, floorId: null };
}

/** Gedung dan lantai cocok bila salah satu unit lokasi ada di sana. */
export function matchesDirectoryFilter(
  lookup: SnapshotLookup,
  location: SnapshotLocation,
  filter: DirectoryFilter,
): boolean {
  if (filter.locationTypeId && location.locationTypeId !== filter.locationTypeId) return false;
  if (filter.building === null && filter.floorId === null) return true;
  return (lookup.locationPlaces.get(location.id) ?? []).some(
    (place) =>
      (filter.building === null ||
        (filter.building === OUTDOOR_BUILDING
          ? place.buildingId === null
          : place.buildingId === filter.building)) &&
      (filter.floorId === null || place.floorId === filter.floorId),
  );
}

export interface DirectoryGroup {
  /** Huruf awal A–Z; nama yang tidak diawali huruf latin masuk "#". */
  letter: string;
  locations: SnapshotLocation[];
}

function initial(name: string): string {
  const first = normalizeSearchText(name).charAt(0);
  return /[a-z]/.test(first) ? first.toUpperCase() : '#';
}

/**
 * Direktori A–Z: semua lokasi di snapshot (yang nonaktif permanen tidak pernah ikut) yang
 * lolos filter, urut nama dan dikelompokkan per huruf awal.
 */
export function directoryGroups(lookup: SnapshotLookup, filter: DirectoryFilter): DirectoryGroup[] {
  const groups: DirectoryGroup[] = [];
  const located = lookup.snapshot.locations
    .filter((location) => matchesDirectoryFilter(lookup, location, filter))
    .sort((a, b) => compareNames(a.name, b.name));
  for (const location of located) {
    const letter = initial(location.name);
    const last = groups.at(-1);
    if (last?.letter === letter) last.locations.push(location);
    else groups.push({ letter, locations: [location] });
  }
  return groups;
}

export interface DirectoryOption {
  id: string;
  name: string;
}

export interface DirectoryOptions {
  /** Gedung yang punya lokasi, lalu Area Luar (`OUTDOOR_BUILDING`) bila ada lokasi di sana. */
  buildings: DirectoryOption[];
  /** Lantai gedung terpilih yang punya lokasi, dari atas ke bawah. */
  floors: DirectoryOption[];
  /** Tipe lokasi yang punya lokasi. */
  locationTypes: DirectoryOption[];
}

/**
 * Pilihan filter yang menghasilkan sesuatu. Lantai hanya bisa dipilih setelah gedung (atau bila
 * venue hanya punya satu gedung), agar daftar lantai tidak bercampur antar-gedung.
 */
export function directoryOptions(
  lookup: SnapshotLookup,
  filter: DirectoryFilter,
): DirectoryOptions {
  const usedFloors = new Set<string>();
  const usedTypes = new Set<string>();
  for (const location of lookup.snapshot.locations) {
    usedTypes.add(location.locationTypeId);
    for (const place of lookup.locationPlaces.get(location.id) ?? []) usedFloors.add(place.floorId);
  }
  const usedBuildings = new Set(
    [...usedFloors].map((floorId) => lookup.floors.get(floorId)?.buildingId ?? OUTDOOR_BUILDING),
  );
  const outdoor = lookup.snapshot.floors.find((floor) => floor.isOutdoor);
  const buildings = lookup.snapshot.buildings
    .filter((building) => usedBuildings.has(building.id))
    .map((building) => ({ id: building.id, name: building.name }));
  if (outdoor && usedBuildings.has(OUTDOOR_BUILDING)) {
    buildings.push({ id: OUTDOOR_BUILDING, name: outdoor.name });
  }

  const onlyBuilding = lookup.snapshot.buildings.length === 1 ? lookup.snapshot.buildings[0] : null;
  const buildingId = filter.building ?? onlyBuilding?.id ?? null;
  const floors =
    buildingId && buildingId !== OUTDOOR_BUILDING
      ? lookup.snapshot.floors
          .filter((floor) => floor.buildingId === buildingId && usedFloors.has(floor.id))
          .sort((a, b) => b.level - a.level)
          .map((floor) => ({ id: floor.id, name: floor.name }))
      : [];

  const locationTypes = lookup.snapshot.locationTypes
    .filter((type) => usedTypes.has(type.id))
    .map((type) => ({ id: type.id, name: type.name }));

  return { buildings, floors, locationTypes };
}
