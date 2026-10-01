import { floorPlaceNames, type SnapshotLocation, type SnapshotLookup } from '@indoor/domain';

const SEPARATOR = ' · ';

/** "Gedung · Lantai", atau nama lapisan Area Luar saja. */
export function floorText(lookup: SnapshotLookup, floorId: string): string {
  const names = floorPlaceNames(lookup, floorId);
  if (!names) return '';
  return names.building ? `${names.building}${SEPARATOR}${names.floor}` : names.floor;
}

/**
 * Lantai lokasi dalam satu baris, lantai unit utama lebih dulu: "Gedung Utama · L1, GF".
 * Lantai di gedung lain dipisah titik koma. `null` bila lokasi belum ada di peta.
 */
export function locationPlaceText(lookup: SnapshotLookup, locationId: string): string | null {
  const groups = new Map<string, string[]>();
  for (const place of lookup.locationPlaces.get(locationId) ?? []) {
    const names = floorPlaceNames(lookup, place.floorId);
    if (!names) continue;
    const building = names.building ?? '';
    groups.set(building, [...(groups.get(building) ?? []), names.floor]);
  }
  if (groups.size === 0) return null;
  return [...groups]
    .map(([building, floors]) =>
      building ? `${building}${SEPARATOR}${floors.join(', ')}` : floors.join(', '),
    )
    .join('; ');
}

/** "Tipe · Kategori, Kategori" seperti wireframe profil lokasi. */
export function locationKindText(lookup: SnapshotLookup, location: SnapshotLocation): string {
  const type = lookup.locationTypes.get(location.locationTypeId)?.name;
  const categories = location.categoryIds
    .map((id) => lookup.categories.get(id)?.name)
    .filter((name): name is string => Boolean(name));
  return [type, categories.join(', ')].filter(Boolean).join(SEPARATOR);
}

/** Baris kedua lokasi di daftar: kategori (atau tipe) lalu tempatnya. */
export function locationSummary(lookup: SnapshotLookup, location: SnapshotLocation): string {
  const category = location.categoryIds.map((id) => lookup.categories.get(id)?.name).find(Boolean);
  const kind = category ?? lookup.locationTypes.get(location.locationTypeId)?.name;
  return [kind, locationPlaceText(lookup, location.id)].filter(Boolean).join(SEPARATOR);
}
