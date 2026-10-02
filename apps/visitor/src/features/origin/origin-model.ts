import {
  type ExploreTarget,
  labelPoint,
  type Snapshot,
  type SnapshotFeature,
  type SnapshotIndex,
  type SnapshotPosition,
  visibleFloorIds,
} from '@indoor/domain';
import { insidePolygon, type RoutePlace } from '@indoor/routing';

/** Yang ditampilkan untuk titik asal: posisi penanda, lantai, arah hadap, dan nama. */
export interface OriginView {
  floorId: string;
  position: SnapshotPosition;
  /** Hanya QR titik asal yang tahu arah hadap pemindai. */
  headingDeg: number | null;
  /** `null` untuk titik yang diketuk di peta (teks "Titik di peta" dari i18n). */
  name: string | null;
}

/** Tempat rute dari sasaran yang dibuka di detail. */
export function placeOfTarget(target: ExploreTarget): RoutePlace {
  return target.kind === 'location'
    ? { kind: 'location', locationId: target.id }
    : { kind: 'feature', featureId: target.id };
}

export function featurePosition(feature: SnapshotFeature): SnapshotPosition | null {
  const { geometry } = feature;
  if (geometry.type === 'Point') return geometry.coordinates;
  if (geometry.type === 'Polygon') return labelPoint(geometry.coordinates) as SnapshotPosition;
  if (geometry.type === 'MultiPolygon' && geometry.coordinates[0]) {
    return labelPoint(geometry.coordinates[0]) as SnapshotPosition;
  }
  return null;
}

function featureView(index: SnapshotIndex, featureId: string, name: string | null) {
  const feature = index.features.get(featureId);
  const position = feature ? featurePosition(feature) : null;
  if (!feature || !position) return null;
  return { floorId: feature.properties.floorId, position, headingDeg: null, name };
}

/** Nama fitur seperti di detail: nama lokasi yang menempatinya, nama fasilitas, atau kode unit. */
function featureName(index: SnapshotIndex, featureId: string): string | null {
  const feature = index.features.get(featureId);
  if (!feature) return null;
  const location = index.locationByUnit.get(featureId);
  if (location) return location.name;
  const typeId = feature.properties.facilityTypeId;
  return (
    feature.properties.name ??
    feature.properties.unitCode ??
    (typeId ? (index.facilityTypes.get(typeId)?.name ?? null) : null)
  );
}

/** Tampilan titik asal; `null` bila tempatnya tidak ada lagi di snapshot. */
export function originView(
  snapshot: Pick<Snapshot, 'originPoints' | 'infoPoints'>,
  index: SnapshotIndex,
  place: RoutePlace,
): OriginView | null {
  switch (place.kind) {
    case 'origin_point':
    case 'info_point': {
      const list = place.kind === 'origin_point' ? snapshot.originPoints : snapshot.infoPoints;
      const point = list.find((p) => p.code === place.code);
      return point
        ? {
            floorId: point.floorId,
            position: point.coordinates,
            headingDeg: point.headingDeg,
            name: point.name,
          }
        : null;
    }
    case 'location': {
      const location = index.locations.get(place.locationId);
      const unitId = location?.primaryUnitId ?? location?.unitIds[0];
      return location && unitId ? featureView(index, unitId, location.name) : null;
    }
    case 'feature':
      return featureView(index, place.featureId, featureName(index, place.featureId));
    case 'point':
      return index.floors.has(place.floorId)
        ? { floorId: place.floorId, position: [place.lng, place.lat], headingDeg: null, name: null }
        : null;
  }
}

/**
 * Lantai titik yang diketuk. Lantai dasar ikut menggambar Area Luar, jadi ketukan di luar
 * footprint gedung adalah titik di Area Luar, bukan di lantai gedung.
 */
export function tapFloorId(
  snapshot: Pick<Snapshot, 'floors' | 'buildings'>,
  floorId: string,
  [lng, lat]: SnapshotPosition,
): string {
  const floor = snapshot.floors.find((f) => f.id === floorId);
  const footprint = snapshot.buildings.find((b) => b.id === floor?.buildingId)?.footprint;
  const outdoor = visibleFloorIds(snapshot, floorId).find((id) => id !== floorId);
  if (!footprint || !outdoor) return floorId;
  return insidePolygon(footprint.coordinates, lng, lat) ? floorId : outdoor;
}
