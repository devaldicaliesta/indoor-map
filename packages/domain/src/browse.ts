import { buildingFloors, groundFloor, type MapView, visibleFloorIds } from './map-view';
import type { SnapshotFeature } from './snapshot';
import type { SnapshotLookup } from './snapshot-lookup';

/** Yang bisa dibuka pengunjung dari pencarian, daftar, atau peta. */
export type BrowseTarget =
  | { kind: 'location'; id: string }
  /** Unit yang tidak ditempati lokasi mana pun di snapshot. */
  | { kind: 'unit'; id: string }
  /** Satu titik fasilitas. */
  | { kind: 'facility'; id: string }
  | { kind: 'category'; id: string }
  | { kind: 'facility_type'; id: string };

/** Hasil ketuk di peta (map-core): label lokasi, atau fitur lantai beserta ikon fasilitasnya. */
export type MapHit = { kind: 'location'; id: string } | { kind: 'feature'; id: string };

function featureOfKind(lookup: SnapshotLookup, id: string, kind: 'unit' | 'facility') {
  const feature = lookup.features.get(id);
  return feature?.properties.kind === kind ? feature : undefined;
}

/** Nama yang ditampilkan: nama lokasi/kategori/jenis, kode unit, atau nama fasilitas (jenisnya bila tanpa nama). */
export function targetTitle(lookup: SnapshotLookup, target: BrowseTarget): string | null {
  switch (target.kind) {
    case 'location':
      return lookup.locations.get(target.id)?.name ?? null;
    case 'category':
      return lookup.categories.get(target.id)?.name ?? null;
    case 'facility_type':
      return lookup.facilityTypes.get(target.id)?.name ?? null;
    case 'unit':
      return featureOfKind(lookup, target.id, 'unit')?.properties.unitCode ?? null;
    case 'facility': {
      const feature = featureOfKind(lookup, target.id, 'facility');
      if (!feature) return null;
      const type = lookup.facilityTypes.get(feature.properties.facilityTypeId ?? '');
      return feature.properties.name ?? type?.name ?? null;
    }
  }
}

/** Unit milik lokasi yang ada di peta. */
export function locationUnitIds(lookup: SnapshotLookup, locationId: string): string[] {
  return (lookup.locationPlaces.get(locationId) ?? []).flatMap((place) =>
    place.units.map((unit) => unit.id),
  );
}

export interface BrowseHighlight {
  /** Unit dan fasilitas yang disorot di peta. */
  featureIds: string[];
  /** Label lokasi dan ikon fasilitas yang didahulukan saat bertumpuk. */
  labelIds: string[];
}

const NOTHING: BrowseHighlight = { featureIds: [], labelIds: [] };

/** Sorotan peta untuk target yang sedang dibuka; kategori dan jenis fasilitas menyorot semua anggotanya. */
export function targetHighlight(lookup: SnapshotLookup, target: BrowseTarget): BrowseHighlight {
  switch (target.kind) {
    case 'location':
      return lookup.locations.has(target.id)
        ? { featureIds: locationUnitIds(lookup, target.id), labelIds: [target.id] }
        : NOTHING;
    case 'unit':
      return featureOfKind(lookup, target.id, 'unit')
        ? { featureIds: [target.id], labelIds: [] }
        : NOTHING;
    case 'facility':
      return featureOfKind(lookup, target.id, 'facility')
        ? { featureIds: [target.id], labelIds: [target.id] }
        : NOTHING;
    case 'category': {
      const members = lookup.categoryLocations.get(target.id) ?? [];
      return {
        featureIds: members.flatMap((location) => locationUnitIds(lookup, location.id)),
        labelIds: members.map((location) => location.id),
      };
    }
    case 'facility_type': {
      const ids = (lookup.typeFacilities.get(target.id) ?? []).map((feature) => feature.id);
      return { featureIds: ids, labelIds: ids };
    }
  }
}

/** Ketuk di peta: label lokasi, ikon fasilitas, atau unit; unit yang ditempati membuka lokasinya. */
export function hitTarget(lookup: SnapshotLookup, hit: MapHit): BrowseTarget | null {
  if (hit.kind === 'location') {
    return lookup.locations.has(hit.id) ? { kind: 'location', id: hit.id } : null;
  }
  const feature = lookup.features.get(hit.id);
  if (feature?.properties.kind === 'facility') return { kind: 'facility', id: feature.id };
  if (feature?.properties.kind !== 'unit') return null;
  const location = lookup.unitLocation.get(feature.id);
  return location ? { kind: 'location', id: location.id } : { kind: 'unit', id: feature.id };
}

/** Lantai yang memuat fitur, urut seperti `snapshot.floors`; untuk penanda di pemilih lantai. */
export function featureFloorIds(lookup: SnapshotLookup, featureIds: readonly string[]): string[] {
  const floors = new Set<string>();
  for (const id of featureIds) {
    const floorId = lookup.features.get(id)?.properties.floorId;
    if (floorId) floors.add(floorId);
  }
  return [...floors].sort(
    (a, b) => (lookup.floorRank.get(a) ?? 0) - (lookup.floorRank.get(b) ?? 0),
  );
}

/** Fitur yang ada di lantai yang sedang digambar, untuk membingkai kamera. */
export function featuresOnFloors(
  lookup: SnapshotLookup,
  featureIds: readonly string[],
  floorIds: readonly string[],
): SnapshotFeature[] {
  const floors = new Set(floorIds);
  return featureIds.flatMap((id) => {
    const feature = lookup.features.get(id);
    return feature && floors.has(feature.properties.floorId) ? [feature] : [];
  });
}

/** Tampilan yang menggambar sebuah lantai; Area Luar digambar bersama lantai dasar gedung. */
export function floorView(lookup: SnapshotLookup, floorId: string, current: MapView): MapView {
  const floor = lookup.floors.get(floorId);
  if (floor?.buildingId) return { buildingId: floor.buildingId, floorId };
  const buildingId = current.buildingId ?? lookup.snapshot.buildings[0]?.id ?? null;
  const ground = buildingId ? groundFloor(buildingFloors(lookup.snapshot, buildingId)) : undefined;
  return buildingId && ground ? { buildingId, floorId: ground.id } : { buildingId: null, floorId };
}

/**
 * Gedung dan lantai untuk menunjukkan target, atau `null` bila salah satu fiturnya sudah
 * terlihat (atau target tidak ada di peta). Lokasi menuju lantai unit utamanya; kategori dan
 * jenis fasilitas menuju lantai dengan anggota terbanyak, gedung yang sedang dilihat didahulukan.
 */
export function targetView(
  lookup: SnapshotLookup,
  target: BrowseTarget,
  current: MapView,
): MapView | null {
  const { featureIds } = targetHighlight(lookup, target);
  const visible = new Set(current.floorId ? visibleFloorIds(lookup.snapshot, current.floorId) : []);
  const counts = new Map<string, number>();
  for (const id of featureIds) {
    const floorId = lookup.features.get(id)?.properties.floorId;
    if (!floorId) continue;
    if (visible.has(floorId)) return null;
    counts.set(floorId, (counts.get(floorId) ?? 0) + 1);
  }
  const nearby = (floorId: string) => {
    const buildingId = lookup.floors.get(floorId)?.buildingId ?? null;
    return buildingId === null || buildingId === current.buildingId;
  };
  const rank = (floorId: string) => lookup.floorRank.get(floorId) ?? 0;
  const floorId =
    target.kind === 'location'
      ? lookup.locationPlaces.get(target.id)?.[0]?.floorId
      : [...counts.keys()].sort(
          (a, b) =>
            Number(nearby(b)) - Number(nearby(a)) ||
            (counts.get(b) ?? 0) - (counts.get(a) ?? 0) ||
            rank(a) - rank(b),
        )[0];
  return floorId ? floorView(lookup, floorId, current) : null;
}
