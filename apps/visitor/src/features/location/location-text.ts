import {
  locationPlaces,
  type Place,
  type SnapshotIndex,
  type SnapshotLocation,
} from '@indoor/domain';

/** "Gedung Utama · L1"; lapisan Area Luar cukup dengan namanya. */
export function placeText(place: Place | null | undefined): string | null {
  if (!place) return null;
  return [place.building?.name, place.floor.name].filter(Boolean).join(' · ');
}

/** Kategori lokasi, atau tipenya bila lokasi belum berkategori. */
export function locationKindText(index: SnapshotIndex, location: SnapshotLocation): string | null {
  const categories = location.categoryIds.flatMap((id) => index.categories.get(id)?.name ?? []);
  if (categories.length) return categories.join(', ');
  return index.locationTypes.get(location.locationTypeId)?.name ?? null;
}

/**
 * Keterangan lokasi di daftar: kategori · gedung · lantai unit utama, atau `notOnMap` bila
 * lokasi belum menempati unit.
 */
export function locationSubtitle(
  index: SnapshotIndex,
  location: SnapshotLocation,
  notOnMap: string,
): string {
  const [first] = locationPlaces(index, location);
  return [locationKindText(index, location), placeText(first) ?? notOnMap]
    .filter(Boolean)
    .join(' · ');
}
