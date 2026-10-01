import type {
  Snapshot,
  SnapshotBuilding,
  SnapshotCategory,
  SnapshotFacilityType,
  SnapshotFeature,
  SnapshotFloor,
  SnapshotLocation,
  SnapshotLocationType,
} from './snapshot';

const collator = new Intl.Collator('id-ID', { numeric: true, sensitivity: 'base' });

/** Urutan nama di daftar pengunjung: tanpa membedakan huruf besar/kecil, angka alami ("L2" < "L10"). */
export function compareNames(a: string, b: string): number {
  return collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}

/** Bagian lokasi di satu lantai. */
export interface LocationPlace {
  floorId: string;
  /** `null` untuk lapisan Area Luar. */
  buildingId: string | null;
  /** Unit utama lebih dulu, lalu urut kode. */
  units: SnapshotFeature[];
}

/** Indeks snapshot untuk Visitor; dibuat sekali per snapshot. */
export interface SnapshotLookup {
  snapshot: Snapshot;
  locations: ReadonlyMap<string, SnapshotLocation>;
  locationTypes: ReadonlyMap<string, SnapshotLocationType>;
  categories: ReadonlyMap<string, SnapshotCategory>;
  facilityTypes: ReadonlyMap<string, SnapshotFacilityType>;
  features: ReadonlyMap<string, SnapshotFeature>;
  floors: ReadonlyMap<string, SnapshotFloor>;
  buildings: ReadonlyMap<string, SnapshotBuilding>;
  /** Posisi lantai di `snapshot.floors` (Area Luar, lalu per gedung dari lantai terendah). */
  floorRank: ReadonlyMap<string, number>;
  /** Lokasi yang menempati unit; snapshot hanya berisi lokasi yang bukan nonaktif permanen. */
  unitLocation: ReadonlyMap<string, SnapshotLocation>;
  /** Lantai lokasi: lantai unit utama lebih dulu, lalu urutan lantai snapshot. */
  locationPlaces: ReadonlyMap<string, readonly LocationPlace[]>;
  /** Lokasi per kategori, urut nama. */
  categoryLocations: ReadonlyMap<string, readonly SnapshotLocation[]>;
  /** Fasilitas per jenis, urut lantai lalu nama. */
  typeFacilities: ReadonlyMap<string, readonly SnapshotFeature[]>;
}

/** Nama gedung dan lantai untuk teks "Gedung · Lantai"; lapisan Area Luar tanpa gedung. */
export function floorPlaceNames(
  lookup: Pick<SnapshotLookup, 'floors' | 'buildings'>,
  floorId: string,
): { building: string | null; floor: string } | null {
  const floor = lookup.floors.get(floorId);
  if (!floor) return null;
  const building = floor.buildingId ? lookup.buildings.get(floor.buildingId) : undefined;
  return { building: building?.name ?? null, floor: floor.name };
}

const byId = <T extends { id: string }>(items: readonly T[]) =>
  new Map(items.map((item) => [item.id, item]));

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function placesOf(
  location: SnapshotLocation,
  features: ReadonlyMap<string, SnapshotFeature>,
  floors: ReadonlyMap<string, SnapshotFloor>,
  floorRank: ReadonlyMap<string, number>,
): LocationPlace[] {
  const byFloor = new Map<string, SnapshotFeature[]>();
  for (const unitId of location.unitIds) {
    const unit = features.get(unitId);
    if (unit?.properties.kind === 'unit') push(byFloor, unit.properties.floorId, unit);
  }
  const primaryFloor = location.primaryUnitId
    ? features.get(location.primaryUnitId)?.properties.floorId
    : undefined;
  const isPrimary = (unit: SnapshotFeature) => unit.id === location.primaryUnitId;
  return [...byFloor]
    .map(([floorId, units]) => ({
      floorId,
      buildingId: floors.get(floorId)?.buildingId ?? null,
      units: units.sort(
        (a, b) =>
          Number(isPrimary(b)) - Number(isPrimary(a)) ||
          compareNames(a.properties.unitCode ?? '', b.properties.unitCode ?? ''),
      ),
    }))
    .sort(
      (a, b) =>
        Number(b.floorId === primaryFloor) - Number(a.floorId === primaryFloor) ||
        (floorRank.get(a.floorId) ?? 0) - (floorRank.get(b.floorId) ?? 0),
    );
}

export function createSnapshotLookup(snapshot: Snapshot): SnapshotLookup {
  const features = byId(snapshot.features.features);
  const floors = byId(snapshot.floors);
  const floorRank = new Map(snapshot.floors.map((floor, index) => [floor.id, index]));
  const locations = byId(snapshot.locations);

  const unitLocation = new Map<string, SnapshotLocation>();
  const categoryLocations = new Map<string, SnapshotLocation[]>();
  const locationPlaces = new Map<string, LocationPlace[]>();
  const byName = (a: SnapshotLocation, b: SnapshotLocation) => compareNames(a.name, b.name);
  for (const location of [...snapshot.locations].sort(byName)) {
    for (const unitId of location.unitIds) {
      if (!unitLocation.has(unitId)) unitLocation.set(unitId, location);
    }
    for (const categoryId of location.categoryIds) push(categoryLocations, categoryId, location);
    locationPlaces.set(location.id, placesOf(location, features, floors, floorRank));
  }

  const typeFacilities = new Map<string, SnapshotFeature[]>();
  for (const feature of snapshot.features.features) {
    const { kind, facilityTypeId } = feature.properties;
    if (kind === 'facility' && facilityTypeId) push(typeFacilities, facilityTypeId, feature);
  }
  for (const list of typeFacilities.values()) {
    list.sort(
      (a, b) =>
        (floorRank.get(a.properties.floorId) ?? 0) - (floorRank.get(b.properties.floorId) ?? 0) ||
        compareNames(a.properties.name ?? '', b.properties.name ?? '') ||
        compareNames(a.id, b.id),
    );
  }

  return {
    snapshot,
    locations,
    locationTypes: byId(snapshot.locationTypes),
    categories: byId(snapshot.categories),
    facilityTypes: byId(snapshot.facilityTypes),
    features,
    floors,
    buildings: byId(snapshot.buildings),
    floorRank,
    unitLocation,
    locationPlaces,
    categoryLocations,
    typeFacilities,
  };
}
