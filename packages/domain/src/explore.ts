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

/** Entitas snapshot per id, dibangun sekali per snapshot agar daftar panjang tetap cepat. */
export interface SnapshotIndex {
  features: ReadonlyMap<string, SnapshotFeature>;
  floors: ReadonlyMap<string, SnapshotFloor>;
  buildings: ReadonlyMap<string, SnapshotBuilding>;
  locations: ReadonlyMap<string, SnapshotLocation>;
  /** Satu unit ditempati paling banyak satu lokasi (aturan integritas di server). */
  locationByUnit: ReadonlyMap<string, SnapshotLocation>;
  categories: ReadonlyMap<string, SnapshotCategory>;
  facilityTypes: ReadonlyMap<string, SnapshotFacilityType>;
  locationTypes: ReadonlyMap<string, SnapshotLocationType>;
  /** Posisi lantai di `snapshot.floors`: Area Luar, lalu per gedung dari lantai terendah. */
  floorOrder: ReadonlyMap<string, number>;
}

const byId = <T extends { id: string }>(items: readonly T[]) =>
  new Map(items.map((item) => [item.id, item]));

export function indexSnapshot(snapshot: Snapshot): SnapshotIndex {
  const locationByUnit = new Map<string, SnapshotLocation>();
  for (const location of snapshot.locations) {
    for (const unitId of location.unitIds) locationByUnit.set(unitId, location);
  }
  return {
    features: byId(snapshot.features.features),
    floors: byId(snapshot.floors),
    buildings: byId(snapshot.buildings),
    locations: byId(snapshot.locations),
    locationByUnit,
    categories: byId(snapshot.categories),
    facilityTypes: byId(snapshot.facilityTypes),
    locationTypes: byId(snapshot.locationTypes),
    floorOrder: new Map(snapshot.floors.map((floor, i) => [floor.id, i])),
  };
}

/** Gedung dan lantai; lapisan Area Luar tidak punya gedung. */
export interface Place {
  floor: SnapshotFloor;
  building: SnapshotBuilding | null;
}

export function floorPlace(index: SnapshotIndex, floorId: string): Place | null {
  const floor = index.floors.get(floorId);
  if (!floor) return null;
  const building = floor.buildingId ? (index.buildings.get(floor.buildingId) ?? null) : null;
  return { floor, building };
}

export function featurePlace(index: SnapshotIndex, featureId: string): Place | null {
  const feature = index.features.get(featureId);
  return feature ? floorPlace(index, feature.properties.floorId) : null;
}

export interface LocationPlace extends Place {
  /** Unit lokasi di lantai ini, unit utama lebih dulu. */
  units: SnapshotFeature[];
}

const floorRank = (index: SnapshotIndex, floorId: string) =>
  index.floorOrder.get(floorId) ?? Number.MAX_SAFE_INTEGER;

/**
 * Tempat lokasi per lantai: lantai unit utama lebih dulu, lalu urutan lantai snapshot. Kosong
 * bila lokasi belum menempati unit, artinya belum ada di peta.
 */
export function locationPlaces(index: SnapshotIndex, location: SnapshotLocation): LocationPlace[] {
  const byFloor = new Map<string, SnapshotFeature[]>();
  for (const unitId of location.unitIds) {
    const unit = index.features.get(unitId);
    if (!unit) continue;
    byFloor.set(unit.properties.floorId, [...(byFloor.get(unit.properties.floorId) ?? []), unit]);
  }
  const primary = location.primaryUnitId;
  const primaryFloor = primary ? index.features.get(primary)?.properties.floorId : undefined;
  const places: LocationPlace[] = [];
  for (const [floorId, units] of byFloor) {
    const place = floorPlace(index, floorId);
    if (!place) continue;
    units.sort(
      (a, b) =>
        Number(b.id === primary) - Number(a.id === primary) ||
        (a.properties.unitCode ?? '').localeCompare(b.properties.unitCode ?? ''),
    );
    places.push({ ...place, units });
  }
  return places.sort(
    (a, b) =>
      Number(b.floor.id === primaryFloor) - Number(a.floor.id === primaryFloor) ||
      floorRank(index, a.floor.id) - floorRank(index, b.floor.id),
  );
}

/** Urutan nama untuk daftar pengunjung: tanpa membedakan huruf besar/kecil, angka alami. */
export function compareNames(a: string, b: string, locale = 'id'): number {
  return a.localeCompare(b, locale, { sensitivity: 'base', numeric: true });
}

/** Lokasi dalam satu kategori, urut nama. */
export function categoryMembers(
  snapshot: Pick<Snapshot, 'locations'>,
  categoryId: string,
  locale = 'id',
): SnapshotLocation[] {
  return snapshot.locations
    .filter((location) => location.categoryIds.includes(categoryId))
    .sort((a, b) => compareNames(a.name, b.name, locale));
}

/** Fasilitas satu jenis di peta, urut lantai snapshot lalu nama. */
export function facilityMembers(
  snapshot: Pick<Snapshot, 'features'>,
  index: SnapshotIndex,
  facilityTypeId: string,
  locale = 'id',
): SnapshotFeature[] {
  return snapshot.features.features
    .filter(
      (f) => f.properties.kind === 'facility' && f.properties.facilityTypeId === facilityTypeId,
    )
    .sort(
      (a, b) =>
        floorRank(index, a.properties.floorId) - floorRank(index, b.properties.floorId) ||
        compareNames(a.properties.name ?? '', b.properties.name ?? '', locale),
    );
}

export type ExploreChip =
  | { kind: 'category'; category: SnapshotCategory; count: number }
  | { kind: 'facility_type'; facilityType: SnapshotFacilityType; count: number };

/**
 * Chip jelajah dalam urutan Admin: kategori yang punya lokasi, lalu jenis fasilitas yang ada di
 * peta. Chip tanpa anggota tidak ditampilkan agar pengunjung tidak membuka daftar kosong.
 */
export function exploreChips(
  snapshot: Pick<Snapshot, 'categories' | 'facilityTypes' | 'locations' | 'features'>,
): ExploreChip[] {
  const categoryCounts = new Map<string, number>();
  for (const location of snapshot.locations) {
    for (const id of location.categoryIds)
      categoryCounts.set(id, (categoryCounts.get(id) ?? 0) + 1);
  }
  const facilityCounts = new Map<string, number>();
  for (const feature of snapshot.features.features) {
    const typeId =
      feature.properties.kind === 'facility' ? feature.properties.facilityTypeId : null;
    if (typeId) facilityCounts.set(typeId, (facilityCounts.get(typeId) ?? 0) + 1);
  }
  return [
    ...snapshot.categories.flatMap((category) => {
      const count = categoryCounts.get(category.id) ?? 0;
      return count ? [{ kind: 'category' as const, category, count }] : [];
    }),
    ...snapshot.facilityTypes.flatMap((facilityType) => {
      const count = facilityCounts.get(facilityType.id) ?? 0;
      return count ? [{ kind: 'facility_type' as const, facilityType, count }] : [];
    }),
  ];
}
