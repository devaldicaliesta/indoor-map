import { labelPoint } from '../label-point.ts';
import type { SnapshotPosition as Position, Snapshot } from '../snapshot.ts';
import type { Polygonal } from './shapes.ts';
import { isUuid, uuidV5 } from './uuid.ts';

export type ImdfGeometry =
  | Polygonal
  | { type: 'Point'; coordinates: Position }
  | { type: 'LineString'; coordinates: Position[] };

export interface ImdfFeature {
  id: string;
  type: 'Feature';
  feature_type: string;
  geometry: ImdfGeometry | null;
  properties: Record<string, unknown>;
}

/** Data snapshot yang tidak punya padanan IMDF dan karena itu tidak ikut paket. */
export interface ImdfSkipped {
  /** Dinding berupa garis; IMDF hanya mengenal dinding sebagai poligon. */
  walls: number;
  models: number;
  /** Fasilitas atau landmark yang tidak berada di dalam ruang mana pun. */
  pointsOutsideUnits: number;
  locationsWithoutUnit: number;
  floorsWithoutGeometry: number;
}

/** Unit IMDF yang sudah ditulis, per id fitur asal. */
export interface WrittenUnit {
  id: string;
  levelId: string;
  shape: Polygonal;
}

/** Urutan berkas di paket; `address` dan `venue` wajib ada. */
export const IMDF_FEATURE_TYPES = [
  'address',
  'venue',
  'building',
  'footprint',
  'level',
  'unit',
  'opening',
  'amenity',
  'anchor',
  'occupant',
] as const;
export type ImdfFeatureType = (typeof IMDF_FEATURE_TYPES)[number];

export interface ImdfWriter {
  snapshot: Snapshot;
  features: Record<ImdfFeatureType, ImdfFeature[]>;
  skipped: ImdfSkipped;
  /** Label IMDF dalam bahasa default venue; `null` untuk teks kosong. */
  label(text: string | null | undefined): Record<string, string> | null;
  /** Id asal yang sudah UUID dipakai apa adanya; selain itu UUID v5 tetap. */
  idOf(sourceId: string): Promise<string>;
  /** UUID v5 tetap untuk fitur turunan (`kind` membedakan turunan dari asal yang sama). */
  derived(kind: string, sourceId: string): Promise<string>;
  add(
    type: ImdfFeatureType,
    id: string,
    geometry: ImdfGeometry | null,
    properties: Record<string, unknown>,
  ): void;
}

export function createImdfWriter(snapshot: Snapshot): ImdfWriter {
  const lang = snapshot.venue.defaultLanguage;
  const features = Object.fromEntries(IMDF_FEATURE_TYPES.map((t) => [t, []])) as unknown as Record<
    ImdfFeatureType,
    ImdfFeature[]
  >;
  return {
    snapshot,
    features,
    skipped: {
      walls: 0,
      models: 0,
      pointsOutsideUnits: 0,
      locationsWithoutUnit: 0,
      floorsWithoutGeometry: 0,
    },
    label: (text) => (text ? { [lang]: text } : null),
    idOf: async (id) => (isUuid(id) ? id.toLowerCase() : uuidV5(`source:${id}`)),
    derived: (kind, id) => uuidV5(`${kind}:${id}`),
    add(type, id, geometry, properties) {
      features[type].push({ id, type: 'Feature', feature_type: type, geometry, properties });
    },
  };
}

const round = (value: number) => Math.round(value * 1e7) / 1e7;

/** Titik di dalam poligon untuk `display_point` dan anchor. */
export function pointOf(polygon: Polygonal): { type: 'Point'; coordinates: Position } {
  const rings = polygon.type === 'Polygon' ? polygon.coordinates : (polygon.coordinates[0] ?? []);
  const [x, y] = labelPoint(rings);
  return { type: 'Point', coordinates: [round(x), round(y)] };
}
