import { labelPoint, type RouteEnd, type Snapshot, type SnapshotFeature } from '@indoor/domain';
import type { RoutePoint } from './types';

type SnapshotParts = Pick<Snapshot, 'graph' | 'features' | 'locations'>;

/** Titik wakil fitur tanpa titik masuk: titik fasilitas, atau titik terdalam poligon unit. */
function representativePoint(feature: SnapshotFeature): RoutePoint | null {
  const { geometry } = feature;
  const floorId = feature.properties.floorId;
  let position: readonly number[] | null = null;
  if (geometry.type === 'Point') position = geometry.coordinates;
  else if (geometry.type === 'Polygon') position = labelPoint(geometry.coordinates);
  else if (geometry.type === 'MultiPolygon' && geometry.coordinates[0]) {
    position = labelPoint(geometry.coordinates[0]);
  }
  if (!position) return null;
  return { kind: 'point', lng: position[0] ?? 0, lat: position[1] ?? 0, floorId };
}

/**
 * Tujuan berupa fitur (unit atau fasilitas): semua titik masuknya sekaligus, sehingga rute
 * otomatis ke yang terdekat. Fitur tanpa titik masuk memakai titik wakil fitur pertama, yang
 * ditempelkan ke jalur terdekat; `null` bila fitur tidak ada.
 */
export function featureTarget(
  snapshot: Pick<Snapshot, 'graph' | 'features'>,
  featureIds: readonly string[],
): RoutePoint | null {
  const wanted = new Set(featureIds);
  const nodeIds = snapshot.graph.nodes
    .filter((node) => node.featureId !== null && wanted.has(node.featureId))
    .map((node) => node.id);
  if (nodeIds.length) return { kind: 'nodes', nodeIds };
  for (const id of featureIds) {
    const feature = snapshot.features.features.find((f) => f.id === id);
    const point = feature ? representativePoint(feature) : null;
    if (point) return point;
  }
  return null;
}

/** Tujuan berupa lokasi: titik masuk semua unit yang ditempatinya (unit utama lebih dulu). */
export function locationTarget(snapshot: SnapshotParts, locationId: string): RoutePoint | null {
  const location = snapshot.locations.find((l) => l.id === locationId);
  if (!location) return null;
  const units = [
    ...(location.primaryUnitId ? [location.primaryUnitId] : []),
    ...location.unitIds.filter((id) => id !== location.primaryUnitId),
  ];
  return featureTarget(snapshot, units);
}

/** Asal dari QR titik asal (kode publik): node-nya, atau titiknya bila belum menempel ke jalur. */
export function originPointTarget(
  snapshot: Pick<Snapshot, 'originPoints'>,
  code: string,
): RoutePoint | null {
  const origin = snapshot.originPoints.find((o) => o.code === code);
  if (!origin) return null;
  if (origin.nodeId) return { kind: 'node', nodeId: origin.nodeId };
  const [lng, lat] = origin.coordinates;
  return { kind: 'point', lng, lat, floorId: origin.floorId };
}

/** Asal dari posisi Info Point (kodenya). */
export function infoPointTarget(
  snapshot: Pick<Snapshot, 'infoPoints'>,
  code: string,
): RoutePoint | null {
  const infoPoint = snapshot.infoPoints.find((p) => p.code === code);
  if (!infoPoint) return null;
  if (infoPoint.nodeId) return { kind: 'node', nodeId: infoPoint.nodeId };
  const [lng, lat] = infoPoint.coordinates;
  return { kind: 'point', lng, lat, floorId: infoPoint.floorId };
}

/** Ujung rute dari deep link (`from`/`to`): lokasi, atau titik bebas di lantai. */
export function routeEndTarget(snapshot: SnapshotParts, end: RouteEnd): RoutePoint | null {
  return end.kind === 'location'
    ? locationTarget(snapshot, end.locationId)
    : { kind: 'point', lng: end.lng, lat: end.lat, floorId: end.floorId };
}
