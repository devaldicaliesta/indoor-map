import type { Snapshot, SnapshotDisplayMode, SnapshotFloor } from './snapshot';

/**
 * Lantai dasar sebuah gedung: level 0, atau yang paling dekat ke 0 dengan lantai di atas tanah
 * didahulukan (sama dengan pilihan cadangan `initialFloorView`).
 */
export function groundFloor<T extends Pick<SnapshotFloor, 'level'>>(
  floors: readonly T[],
): T | undefined {
  return [...floors].sort((a, b) => Math.abs(a.level) - Math.abs(b.level) || b.level - a.level)[0];
}

/** Lantai gedung dari atas ke bawah, urutan `FloorSwitcher`. */
export function buildingFloors(snapshot: Pick<Snapshot, 'floors'>, buildingId: string) {
  return snapshot.floors
    .filter((f) => f.buildingId === buildingId)
    .sort((a, b) => b.level - a.level);
}

/** Lantai yang digambar: lantai terpilih, ditambah Area Luar bila lantai itu lantai dasar gedung. */
export function visibleFloorIds(snapshot: Pick<Snapshot, 'floors'>, floorId: string): string[] {
  const floor = snapshot.floors.find((f) => f.id === floorId);
  if (!floor || floor.isOutdoor || !floor.buildingId) return floor ? [floor.id] : [];
  const isGround = groundFloor(buildingFloors(snapshot, floor.buildingId))?.id === floor.id;
  const outdoor = isGround ? snapshot.floors.filter((f) => f.isOutdoor).map((f) => f.id) : [];
  return [...outdoor, floor.id];
}

export interface MapView {
  /** `null` bila venue hanya punya Area Luar. */
  buildingId: string | null;
  floorId: string | null;
}

/** Lantai yang dibuka saat pengunjung memilih gedung: lantai default gedung, lalu lantai dasar. */
export function buildingView(snapshot: Pick<Snapshot, 'buildings' | 'floors'>, buildingId: string) {
  const building = snapshot.buildings.find((b) => b.id === buildingId);
  const floors = buildingFloors(snapshot, buildingId);
  const floor = floors.find((f) => f.id === building?.defaultFloorId) ?? groundFloor(floors);
  return { buildingId, floorId: floor?.id ?? null };
}

/** Tampilan awal: gedung default venue (atau yang pertama); tanpa gedung, lapisan Area Luar. */
export function initialMapView(
  snapshot: Pick<Snapshot, 'venue' | 'buildings' | 'floors'>,
): MapView {
  const building =
    snapshot.buildings.find((b) => b.id === snapshot.venue.defaultBuildingId) ??
    snapshot.buildings[0];
  if (building) return buildingView(snapshot, building.id);
  return { buildingId: null, floorId: snapshot.floors.find((f) => f.isOutdoor)?.id ?? null };
}

/**
 * Tampilan dari parameter `b`/`f` tautan bagikan. Lantai yang ada menang (gedungnya ikut lantai
 * itu); tanpa lantai yang valid dipakai gedung. `null` bila keduanya tidak ada di snapshot.
 */
export function linkedMapView(
  snapshot: Pick<Snapshot, 'buildings' | 'floors'>,
  link: { buildingId?: string | undefined; floorId?: string | undefined },
): MapView | null {
  const floor = snapshot.floors.find((f) => f.id === link.floorId);
  if (floor) return { buildingId: floor.buildingId, floorId: floor.id };
  if (snapshot.buildings.some((b) => b.id === link.buildingId) && link.buildingId) {
    return buildingView(snapshot, link.buildingId);
  }
  return null;
}

/** Mode 3D hanya tersedia bila fitur `3d` aktif di lisensi. */
export function allows3d(snapshot: Pick<Snapshot, 'enabledFeatures'>): boolean {
  return snapshot.enabledFeatures.includes('3d');
}

/** Mode awal venue; 3D jatuh ke 2D bila lisensi tidak membukanya. */
export function initialViewMode(
  snapshot: Pick<Snapshot, 'venue' | 'enabledFeatures'>,
): SnapshotDisplayMode {
  return snapshot.venue.display.defaultMode === '3d' && allows3d(snapshot) ? '3d' : '2d';
}
