import { categoryMembers, facilityMembers, type SnapshotIndex } from './explore';
import {
  buildingFloors,
  groundFloor,
  initialMapView,
  type MapView,
  visibleFloorIds,
} from './map-view';
import type { Snapshot, SnapshotFloor } from './snapshot';

const floorRank = (index: SnapshotIndex, floorId: string) =>
  index.floorOrder.get(floorId) ?? Number.MAX_SAFE_INTEGER;

/** Lokasi, unit tanpa lokasi, atau fasilitas yang detailnya dibuka. */
export type ExploreTarget =
  | { kind: 'location'; id: string }
  | { kind: 'unit'; id: string }
  | { kind: 'facility'; id: string };

/** Pilihan pengunjung: kategori atau jenis fasilitas (daftar anggota), atau satu sasaran. */
export type ExploreSelection =
  | { kind: 'category'; id: string }
  | { kind: 'facility_type'; id: string }
  | ExploreTarget;

/** Sasaran ketukan pada fitur peta: unit yang ditempati lokasi membuka lokasinya. */
export function targetOfFeature(index: SnapshotIndex, featureId: string): ExploreTarget | null {
  const feature = index.features.get(featureId);
  if (feature?.properties.kind === 'facility') return { kind: 'facility', id: feature.id };
  if (feature?.properties.kind !== 'unit') return null;
  const location = index.locationByUnit.get(feature.id);
  return location ? { kind: 'location', id: location.id } : { kind: 'unit', id: feature.id };
}

export interface SelectionHighlight {
  /** Unit dan fasilitas yang disorot di peta. */
  featureIds: string[];
  /** Label yang didahulukan saat bertabrakan: id lokasi dan id fitur fasilitas. */
  labelIds: string[];
  /** Lantai yang dibuka bila lantai sekarang tidak menampilkan satu pun fitur. */
  preferredFloorId: string | null;
}

const NO_HIGHLIGHT: SelectionHighlight = { featureIds: [], labelIds: [], preferredFloorId: null };

/** Apa yang disorot di peta untuk pilihan pengunjung. */
export function selectionHighlight(
  snapshot: Pick<Snapshot, 'locations' | 'features'>,
  index: SnapshotIndex,
  selection: ExploreSelection | null,
): SelectionHighlight {
  const existing = (ids: readonly string[]) => ids.filter((id) => index.features.has(id));
  const floorOf = (id: string | null) => (id && index.features.get(id)?.properties.floorId) || null;
  switch (selection?.kind) {
    case 'category': {
      const members = categoryMembers(snapshot, selection.id);
      return {
        featureIds: existing(members.flatMap((l) => l.unitIds)),
        labelIds: members.map((l) => l.id),
        preferredFloorId: null,
      };
    }
    case 'facility_type': {
      const ids = facilityMembers(snapshot, index, selection.id).map((f) => f.id);
      return { featureIds: ids, labelIds: ids, preferredFloorId: null };
    }
    case 'location': {
      const location = index.locations.get(selection.id);
      if (!location) return NO_HIGHLIGHT;
      const featureIds = existing(location.unitIds);
      return {
        featureIds,
        labelIds: [location.id],
        preferredFloorId: floorOf(location.primaryUnitId) ?? floorOf(featureIds[0] ?? null),
      };
    }
    case 'unit':
    case 'facility': {
      if (!index.features.has(selection.id)) return NO_HIGHLIGHT;
      return {
        featureIds: [selection.id],
        labelIds: selection.kind === 'facility' ? [selection.id] : [],
        preferredFloorId: floorOf(selection.id),
      };
    }
    default:
      return NO_HIGHLIGHT;
  }
}

/** Lantai gedung yang menampilkan salah satu fitur (Area Luar tampil di lantai dasar). */
export function floorsShowing(
  snapshot: Pick<Snapshot, 'floors'>,
  index: SnapshotIndex,
  buildingId: string,
  featureIds: readonly string[],
): string[] {
  const featureFloors = new Set(
    featureIds.flatMap((id) => index.features.get(id)?.properties.floorId ?? []),
  );
  return buildingFloors(snapshot, buildingId)
    .filter((floor) => visibleFloorIds(snapshot, floor.id).some((id) => featureFloors.has(id)))
    .map((floor) => floor.id);
}

/** Tampilan yang menggambar sebuah lantai; Area Luar dibuka lewat lantai dasar gedung. */
function viewOfFloor(
  snapshot: Pick<Snapshot, 'venue' | 'buildings' | 'floors'>,
  floor: SnapshotFloor,
  currentBuildingId: string | null,
): MapView {
  if (floor.buildingId) return { buildingId: floor.buildingId, floorId: floor.id };
  const buildingId = currentBuildingId ?? initialMapView(snapshot).buildingId;
  const ground = buildingId ? groundFloor(buildingFloors(snapshot, buildingId)) : undefined;
  return ground && buildingId
    ? { buildingId, floorId: ground.id }
    : { buildingId: null, floorId: floor.id };
}

/**
 * Tampilan peta yang memperlihatkan fitur-fitur: lantai sekarang dipertahankan bila salah
 * satunya tampil di sana; bila tidak, `preferredFloorId`, atau lantai dengan fitur terbanyak
 * (gedung sekarang didahulukan). `null` bila tidak satu pun fitur ada di peta.
 */
export function viewShowing(
  snapshot: Pick<Snapshot, 'venue' | 'buildings' | 'floors'>,
  index: SnapshotIndex,
  current: MapView,
  featureIds: readonly string[],
  preferredFloorId: string | null = null,
): MapView | null {
  const counts = new Map<string, number>();
  for (const id of featureIds) {
    const floorId = index.features.get(id)?.properties.floorId;
    if (floorId) counts.set(floorId, (counts.get(floorId) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  const visible = current.floorId ? visibleFloorIds(snapshot, current.floorId) : [];
  if (visible.some((id) => counts.has(id))) return current;
  const inCurrentBuilding = (floorId: string) =>
    Number(index.floors.get(floorId)?.buildingId === current.buildingId);
  const [best] = [...counts.keys()].sort(
    (a, b) =>
      Number(b === preferredFloorId) - Number(a === preferredFloorId) ||
      (counts.get(b) ?? 0) - (counts.get(a) ?? 0) ||
      inCurrentBuilding(b) - inCurrentBuilding(a) ||
      floorRank(index, a) - floorRank(index, b),
  );
  const floor = best ? index.floors.get(best) : undefined;
  return floor ? viewOfFloor(snapshot, floor, current.buildingId) : null;
}
