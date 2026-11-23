import { labelPoint } from '../label-point.ts';
import type { Snapshot, SnapshotFeature, SnapshotGeometry, SnapshotPosition } from '../snapshot.ts';
import { toOsmHours } from './osm-hours.ts';

/** GeoJSON RFC 7946 yang ditulis export: geometri snapshot ditambah MultiPoint untuk konektor. */
export type ExportGeometry =
  | SnapshotGeometry
  | { type: 'MultiPoint'; coordinates: SnapshotPosition[] };

export interface ExportFeature {
  type: 'Feature';
  id: string;
  geometry: ExportGeometry | null;
  properties: Record<string, unknown>;
}

export interface ExportFeatureCollection {
  type: 'FeatureCollection';
  features: ExportFeature[];
}

/** Penanda format agar pembaca berkas tahu asal dan versi strukturnya. */
export const GEOJSON_EXPORT_FORMAT = 'panduarah-geojson';
export const GEOJSON_EXPORT_VERSION = 1;

const collection = (features: ExportFeature[]): ExportFeatureCollection => ({
  type: 'FeatureCollection',
  features,
});

/** Titik label unit di dalam poligonnya; dipakai sebagai posisi lokasi. */
function unitAnchor(unit: SnapshotFeature | undefined): SnapshotPosition | null {
  if (!unit) return null;
  const { geometry } = unit;
  if (geometry.type === 'Polygon') return labelPoint(geometry.coordinates);
  if (geometry.type === 'MultiPolygon') return labelPoint(geometry.coordinates[0] ?? []);
  return null;
}

function locationFeatures(snapshot: Snapshot): ExportFeature[] {
  const units = new Map(snapshot.features.features.map((f) => [f.id, f]));
  const types = new Map(snapshot.locationTypes.map((t) => [t.id, t.name]));
  const categories = new Map(snapshot.categories.map((c) => [c.id, c.name]));
  return snapshot.locations.map((location) => {
    const unit = units.get(location.primaryUnitId ?? location.unitIds[0] ?? '');
    const anchor = unitAnchor(unit);
    return {
      type: 'Feature',
      id: location.id,
      geometry: anchor ? { type: 'Point', coordinates: anchor } : null,
      properties: {
        ...location,
        locationType: types.get(location.locationTypeId) ?? null,
        categories: location.categoryIds.map((id) => categories.get(id) ?? id),
        floorId: unit?.properties.floorId ?? null,
        openingHours: toOsmHours(location.hours),
      },
    };
  });
}

function graphFeatures({ graph }: Snapshot): ExportFeature[] {
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));
  const at = (id: string) => nodes.get(id)?.coordinates;
  return [
    ...graph.nodes.map(
      ({ coordinates, ...node }): ExportFeature => ({
        type: 'Feature',
        id: node.id,
        geometry: { type: 'Point', coordinates },
        properties: { element: 'node', ...node },
      }),
    ),
    ...graph.edges.map((edge): ExportFeature => {
      const from = at(edge.from);
      const to = at(edge.to);
      return {
        type: 'Feature',
        id: edge.id,
        geometry: from && to ? { type: 'LineString', coordinates: [from, to] } : null,
        properties: { element: 'edge', ...edge },
      };
    }),
    ...graph.connectors.map((connector): ExportFeature => {
      const coordinates = connector.stops.flatMap((s) => {
        const position = at(s.nodeId);
        return position ? [position] : [];
      });
      return {
        type: 'Feature',
        id: connector.id,
        geometry: coordinates.length ? { type: 'MultiPoint', coordinates } : null,
        properties: { element: 'connector', ...connector },
      };
    }),
  ];
}

/**
 * Isi paket export GeoJSON dari snapshot versi aktif (harus lengkap dengan grafnya), per nama
 * berkas. Geometri fitur ditulis persis seperti di snapshot (WGS84, EPSG:4326).
 */
export function snapshotToGeoJson(snapshot: Snapshot): Record<string, unknown> {
  return {
    'venue.json': {
      format: GEOJSON_EXPORT_FORMAT,
      formatVersion: GEOJSON_EXPORT_VERSION,
      crs: 'EPSG:4326',
      version: snapshot.version,
      publishedAt: snapshot.publishedAt,
      venue: snapshot.venue,
      floors: snapshot.floors,
      locationTypes: snapshot.locationTypes,
      categories: snapshot.categories,
      facilityTypes: snapshot.facilityTypes,
    },
    'buildings.geojson': collection(
      snapshot.buildings.map(({ footprint, ...building }) => ({
        type: 'Feature',
        id: building.id,
        geometry: footprint,
        properties: building,
      })),
    ),
    'features.geojson': snapshot.features,
    'locations.geojson': collection(locationFeatures(snapshot)),
    'graph.geojson': collection(graphFeatures(snapshot)),
  };
}
