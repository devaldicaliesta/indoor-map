import {
  decodeDeepLink,
  type ExploreTarget,
  labelPoint,
  type Snapshot,
  type SnapshotFeature,
  type SnapshotIndex,
  type SnapshotPosition,
} from '@indoor/domain';
import type { RoutePlace } from '@indoor/routing';

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

function featurePosition(feature: SnapshotFeature): SnapshotPosition | null {
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
 * Titik asal dari URL QR (`?o=kode`). Kode yang tidak ada di snapshot (QR dihapus, atau belum
 * dipublish) diabaikan, sehingga Visitor tetap terbuka tanpa titik asal.
 */
export function originFromUrl(
  snapshot: Pick<Snapshot, 'originPoints'>,
  pathAndQuery: string,
): RoutePlace | null {
  const code = decodeDeepLink(pathAndQuery)?.originCode;
  if (!code || !snapshot.originPoints.some((p) => p.code === code)) return null;
  return { kind: 'origin_point', code };
}
