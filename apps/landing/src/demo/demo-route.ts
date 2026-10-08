import {
  buildingFloors,
  type ExploreTarget,
  groundFloor,
  type Snapshot,
  type SnapshotIndex,
  type SnapshotLanguage,
  targetOfFeature,
} from '@indoor/domain';
import type { MapPick, RouteView } from '@indoor/map-core';
import {
  instructionText,
  planRoute,
  type RouteGraph,
  type RoutePlace,
  type RoutePlan,
  type RouteSuccess,
  routeOnFloor,
} from '@indoor/routing';

/** Titik asal demo: QR titik asal pertama venue (gerbang utama konser, lobi rumah sakit). */
export interface DemoOrigin {
  place: RoutePlace;
  name: string;
  floorId: string;
}

export function demoOrigin(snapshot: Pick<Snapshot, 'originPoints'>): DemoOrigin | null {
  const point = snapshot.originPoints[0];
  return point
    ? {
        place: { kind: 'origin_point', code: point.code },
        name: point.name,
        floorId: point.floorId,
      }
    : null;
}

/** Sasaran ketukan seperti di Visitor: label lokasi atau fasilitas, atau unit di bawah titik. */
export function targetOfPick(index: SnapshotIndex, pick: MapPick): ExploreTarget | null {
  if (pick.layer === 'floor') return targetOfFeature(index, pick.id);
  if (pick.kind === 'location') {
    return index.locations.has(pick.id) ? { kind: 'location', id: pick.id } : null;
  }
  return index.features.has(pick.id) ? { kind: 'facility', id: pick.id } : null;
}

/** Nama sasaran: nama lokasi, nama atau jenis fasilitas, atau kode unit. */
export function targetName(index: SnapshotIndex, target: ExploreTarget): string {
  if (target.kind === 'location') return index.locations.get(target.id)?.name ?? '';
  const feature = index.features.get(target.id);
  if (target.kind === 'unit') return feature?.properties.unitCode ?? '';
  const typeId = feature?.properties.facilityTypeId;
  return feature?.properties.name ?? (typeId ? index.facilityTypes.get(typeId)?.name : '') ?? '';
}

/**
 * Lokasi yang bisa dipilih sebagai tujuan tanpa mengklik peta, dikelompokkan per lantai (nama
 * ruang bisa sama di lantai berbeda) dari lantai terendah, lalu urut nama.
 */
export function destinationGroups(snapshot: Pick<Snapshot, 'locations' | 'features' | 'floors'>) {
  const floorOfUnit = new Map(
    snapshot.features.features.map((f) => [f.properties.id, f.properties.floorId]),
  );
  const floors = [...snapshot.floors].sort(
    (a, b) => Number(!a.buildingId) - Number(!b.buildingId) || a.level - b.level,
  );
  return floors
    .map((floor) => ({
      floorId: floor.id,
      label: floor.name,
      options: snapshot.locations
        .filter((location) => {
          const unitId = location.primaryUnitId ?? location.unitIds[0];
          return unitId !== undefined && floorOfUnit.get(unitId) === floor.id;
        })
        .map((location) => ({ id: location.id, name: location.name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'id')),
    }))
    .filter((group) => group.options.length > 0);
}

/** Rute tercepat dari titik asal demo ke sasaran, tanpa penutupan. */
export function demoRoute(
  graph: RouteGraph,
  snapshot: Snapshot,
  origin: RoutePlace,
  target: ExploreTarget,
): RoutePlan {
  const destination: RoutePlace =
    target.kind === 'location'
      ? { kind: 'location', locationId: target.id }
      : { kind: 'feature', featureId: target.id };
  return planRoute(graph, snapshot, origin, destination, { accessible: false, closures: [] });
}

/** Garis rute di lantai-lantai yang sedang digambar. */
export function routeViewOn(route: Pick<RouteSuccess, 'legs'>, floorIds: readonly string[]) {
  const parts = floorIds.map((floorId) => routeOnFloor(route, floorId));
  const view: RouteView = {
    lines: parts.flatMap((p) => p.lines),
    origin: parts.find((p) => p.origin)?.origin ?? null,
    destination: parts.find((p) => p.destination)?.destination ?? null,
    transfers: parts.flatMap((p) => p.transfers),
    active: null,
  };
  return view;
}

/**
 * Lantai gedung yang menggambar sebuah lantai rute: Area Luar tampil di lantai dasar gedung,
 * karena pilihan lantai demo hanya berisi lantai gedung.
 */
export function shownFloorOf(
  snapshot: Pick<Snapshot, 'floors'>,
  buildingId: string | null,
  floorId: string,
): string {
  const floor = snapshot.floors.find((f) => f.id === floorId);
  if (floor?.buildingId || !buildingId) return floorId;
  return groundFloor(buildingFloors(snapshot, buildingId))?.id ?? floorId;
}

/** Lantai gedung yang dilewati rute, berurutan tanpa pengulangan berturut-turut. */
export function routeFloorIds(
  snapshot: Pick<Snapshot, 'floors'>,
  buildingId: string | null,
  plan: Extract<RoutePlan, { ok: true }>,
): string[] {
  const floors: string[] = [];
  for (const step of plan.steps) {
    const shown = shownFloorOf(snapshot, buildingId, step.floorId);
    if (floors.at(-1) !== shown) floors.push(shown);
  }
  return floors;
}

/** Teks langkah dari template instruksi venue dalam bahasa tampilan. */
export function stepTexts(
  plan: Extract<RoutePlan, { ok: true }>,
  snapshot: Snapshot,
  language: SnapshotLanguage,
  names: { origin: string; destination: string },
): string[] {
  const context = {
    templates: snapshot.instructionTemplates,
    language,
    floors: snapshot.floors,
    buildings: snapshot.buildings,
    ...names,
  };
  return plan.steps.map((step) => instructionText(step, context));
}
