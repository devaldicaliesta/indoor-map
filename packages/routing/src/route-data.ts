import {
  type Connector,
  type Geometry,
  type InfoPointPlace,
  type LocationStatus,
  type MapFeatureProperties,
  type NavGraph,
  type OriginPoint,
  type SnapshotFeature,
  type SnapshotFloor,
  type SnapshotGraph,
  type SnapshotInfoPoint,
  type SnapshotLocation,
  type SnapshotOriginPoint,
  snapshotGeometry,
  snapshotGraph,
  snapshotOriginPoint,
  snapshotPosition,
} from '@indoor/domain';
import { buildGraph, type RouteGraph } from './graph';

/**
 * Data yang dipakai routing. Snapshot publish memenuhinya apa adanya (Visitor); uji rute Admin
 * membentuknya dari draft lewat `routeDataFromDraft`.
 */
export interface RouteData {
  floors: readonly Pick<SnapshotFloor, 'id' | 'buildingId' | 'level'>[];
  graph: SnapshotGraph;
  /** Fitur peta: titik wakil unit/fasilitas tanpa titik masuk, dan poligon penutupan area. */
  features: { features: readonly Pick<SnapshotFeature, 'id' | 'geometry' | 'properties'>[] };
  locations: readonly Pick<SnapshotLocation, 'id' | 'unitIds' | 'primaryUnitId'>[];
  originPoints: readonly Pick<SnapshotOriginPoint, 'code' | 'floorId' | 'coordinates' | 'nodeId'>[];
  infoPoints: readonly Pick<SnapshotInfoPoint, 'code' | 'floorId' | 'coordinates' | 'nodeId'>[];
}

/**
 * Data draft di editor Admin: graf semua lantai (termasuk perubahan yang belum tersimpan),
 * konektor, fitur, lokasi beserta unitnya, QR titik asal, dan Info Point.
 */
export interface RouteDraft {
  floors: RouteData['floors'];
  graph: NavGraph;
  connectors: readonly Connector[];
  features: readonly {
    geometry: Geometry;
    properties: Pick<MapFeatureProperties, 'id' | 'kind' | 'floorId'>;
  }[];
  locations: readonly {
    id: string;
    status: LocationStatus;
    units: readonly { featureId: string; isPrimary: boolean }[];
  }[];
  originPoints: readonly OriginPoint[];
  infoPoints: readonly InfoPointPlace[];
}

/**
 * Data rute dari draft dengan aturan builder snapshot: urutan id, koordinat 7 desimal, unit lokasi
 * terurut, dan lokasi nonaktif permanen dibuang. Rute uji di Admin karena itu sama dengan rute
 * pengunjung setelah draft yang sama dipublish.
 */
export function routeDataFromDraft(draft: RouteDraft): RouteData {
  return {
    floors: draft.floors,
    graph: snapshotGraph({
      nodes: Object.values(draft.graph.nodes),
      edges: Object.values(draft.graph.edges),
      connectors: draft.connectors,
    }),
    features: {
      features: draft.features.map(({ geometry, properties: { id, kind, floorId } }) => ({
        id,
        geometry: snapshotGeometry(geometry),
        properties: { id, kind, floorId },
      })),
    },
    locations: draft.locations
      .filter((location) => location.status !== 'inactive_permanent')
      .map((location) => ({
        id: location.id,
        unitIds: location.units.map((unit) => unit.featureId).sort(),
        primaryUnitId: location.units.find((unit) => unit.isPrimary)?.featureId ?? null,
      })),
    originPoints: draft.originPoints.map(snapshotOriginPoint),
    infoPoints: draft.infoPoints.map((point) => ({
      code: point.code,
      floorId: point.floorId,
      coordinates: snapshotPosition(point.coordinates),
      nodeId: point.nodeId,
    })),
  };
}

/** Graf rute dari data rute, dengan poligon fitur untuk penutupan area. */
export function buildRouteGraph(
  data: Pick<RouteData, 'floors' | 'graph' | 'features'>,
): RouteGraph {
  return buildGraph(data.graph, { floors: data.floors, features: data.features.features });
}
