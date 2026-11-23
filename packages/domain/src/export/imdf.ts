import type { Snapshot, SnapshotFeature, SnapshotFloor } from '../snapshot.ts';
import type { VenueType } from '../venue.ts';
import {
  OUTDOOR_UNIT_CATEGORY,
  UNIT_CATEGORY_BY_KIND,
  VENUE_CATEGORY_BY_TYPE,
} from './imdf-mapping.ts';
import { writeOccupants, writePoints } from './imdf-places.ts';
import {
  createImdfWriter,
  IMDF_FEATURE_TYPES,
  type ImdfSkipped,
  type ImdfWriter,
  pointOf,
  type WrittenUnit,
} from './imdf-writer.ts';
import { convexHull, orientPolygon, type Polygonal, positionsOf } from './shapes.ts';

export type { ImdfSkipped } from './imdf-writer.ts';

export const IMDF_VERSION = '1.0.0';

/** Alamat venue untuk `address.geojson`; wajib di IMDF dan tidak ada di snapshot. */
export interface ImdfAddress {
  address: string;
  locality: string;
  /** Kode ISO 3166-2, misalnya `ID-JK`. */
  province: string | null;
  /** Kode ISO 3166-1 alpha-2, misalnya `ID`. */
  country: string;
  postalCode: string | null;
}

export interface ImdfExportInput {
  /** Snapshot versi aktif, lengkap dengan grafnya. */
  snapshot: Snapshot;
  venueType: VenueType;
  address: ImdfAddress;
  /** Waktu pembuatan ISO 8601 untuk `manifest.json`. */
  createdAt: string;
}

export interface ImdfExport {
  /** Isi paket per nama berkas (`manifest.json`, `venue.geojson`, …). */
  files: Record<string, unknown>;
  skipped: ImdfSkipped;
}

const isPolygonal = (
  feature: SnapshotFeature,
): feature is SnapshotFeature & { geometry: Polygonal } =>
  feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon';

/** Gedung dan footprint: garis luar gedung, atau selubung semua fitur di lantainya. */
async function writeBuildings(
  w: ImdfWriter,
  floorPositions: (floor: SnapshotFloor) => ReturnType<typeof positionsOf>,
) {
  const ids = new Map<string, string>();
  const footprints = new Map<string, Polygonal>();
  for (const building of w.snapshot.buildings) {
    const floors = w.snapshot.floors.filter((f) => f.buildingId === building.id);
    const shape = building.footprint ?? convexHull(floors.flatMap(floorPositions));
    if (!shape) continue;
    const id = await w.idOf(building.id);
    const footprint = orientPolygon(shape);
    ids.set(building.id, id);
    footprints.set(building.id, footprint);
    w.add('building', id, null, {
      category: 'unspecified',
      restriction: null,
      name: w.label(building.name),
      alt_name: null,
      display_point: pointOf(footprint),
      address_id: null,
    });
    w.add('footprint', await w.derived('footprint', building.id), footprint, {
      category: 'ground',
      name: null,
      building_ids: [id],
    });
  }
  return { ids, footprints };
}

/** Lantai: footprint gedungnya, atau selubung fiturnya (Area Luar, gedung tanpa garis luar). */
async function writeLevels(
  w: ImdfWriter,
  buildings: Awaited<ReturnType<typeof writeBuildings>>,
  floorPositions: (floor: SnapshotFloor) => ReturnType<typeof positionsOf>,
) {
  const ids = new Map<string, string>();
  for (const floor of w.snapshot.floors) {
    const footprint = floor.buildingId ? buildings.footprints.get(floor.buildingId) : undefined;
    const hull = footprint ? null : convexHull(floorPositions(floor));
    const shape = footprint ?? (hull && orientPolygon(hull));
    if (!shape) {
      w.skipped.floorsWithoutGeometry++;
      continue;
    }
    const id = await w.idOf(floor.id);
    ids.set(floor.id, id);
    const building = floor.buildingId ? buildings.ids.get(floor.buildingId) : undefined;
    w.add('level', id, shape, {
      category: 'unspecified',
      restriction: null,
      outdoor: floor.isOutdoor,
      ordinal: floor.level,
      name: w.label(floor.name),
      short_name: w.label(floor.name),
      display_point: pointOf(shape),
      address_id: null,
      building_ids: building ? [building] : null,
    });
  }
  return ids;
}

/** Unit dari fitur berbentuk ruang (unit, koridor, konektor, area luar, area tak dilalui). */
async function writeUnits(w: ImdfWriter, levelIds: ReadonlyMap<string, string>) {
  const units = new Map<string, WrittenUnit>();
  for (const f of w.snapshot.features.features) {
    const { kind, subtype, floorId } = f.properties;
    const category =
      kind === 'outdoor_area' && subtype
        ? OUTDOOR_UNIT_CATEGORY[subtype]
        : UNIT_CATEGORY_BY_KIND[kind];
    const levelId = levelIds.get(floorId);
    if (!category || !levelId || !isPolygonal(f)) continue;
    const id = await w.idOf(f.id);
    const shape = orientPolygon(f.geometry);
    units.set(f.id, { id, levelId, shape });
    w.add('unit', id, shape, {
      category,
      restriction: f.properties.unitStatus === 'renovation' ? 'restricted' : null,
      accessibility: null,
      name: w.label(f.properties.name ?? f.properties.unitCode),
      alt_name: null,
      display_point: pointOf(shape),
      level_id: levelId,
    });
  }
  return units;
}

/** Venue dan alamatnya; batas venue = selubung semua footprint dan fitur. */
async function writeVenue(w: ImdfWriter, input: ImdfExportInput, footprints: Polygonal[]) {
  const { snapshot, address } = input;
  const shape = convexHull([
    ...footprints.flatMap(positionsOf),
    ...snapshot.features.features.flatMap((f) => positionsOf(f.geometry)),
  ]);
  if (!shape) throw new Error('Versi aktif belum punya geometri untuk dijadikan batas venue.');
  const addressId = await w.derived('address', snapshot.venue.id);
  w.add('address', addressId, null, {
    address: address.address,
    unit: null,
    locality: address.locality,
    province: address.province,
    country: address.country,
    postal_code: address.postalCode,
    postal_code_ext: null,
    postal_code_vanity: null,
  });
  w.add('venue', await w.idOf(snapshot.venue.id), shape, {
    category: VENUE_CATEGORY_BY_TYPE[input.venueType].venue,
    restriction: null,
    name: w.label(snapshot.venue.branding?.displayName ?? snapshot.venue.name),
    alt_name: null,
    hours: null,
    phone: null,
    website: null,
    display_point: pointOf(shape),
    address_id: addressId,
  });
}

/**
 * Paket IMDF 1.0.0 (satu FeatureCollection per jenis fitur + `manifest.json`) dari snapshot
 * versi aktif. Id asal yang sudah UUID dipakai apa adanya agar cocok dengan export GeoJSON dan API.
 */
export async function snapshotToImdf(input: ImdfExportInput): Promise<ImdfExport> {
  const w = createImdfWriter(input.snapshot);
  const byFloor = new Map<string, SnapshotFeature[]>();
  for (const f of input.snapshot.features.features) {
    const list = byFloor.get(f.properties.floorId);
    if (list) list.push(f);
    else byFloor.set(f.properties.floorId, [f]);
  }
  const floorPositions = (floor: SnapshotFloor) =>
    (byFloor.get(floor.id) ?? []).flatMap((f) => positionsOf(f.geometry));

  const buildings = await writeBuildings(w, floorPositions);
  const levelIds = await writeLevels(w, buildings, floorPositions);
  const units = await writeUnits(w, levelIds);
  await writePoints(w, levelIds, units);
  await writeOccupants(w, units, VENUE_CATEGORY_BY_TYPE[input.venueType].occupant);
  await writeVenue(w, input, [...buildings.footprints.values()]);

  const files: Record<string, unknown> = {
    'manifest.json': {
      version: IMDF_VERSION,
      created: input.createdAt,
      generated_by: 'PanduArah',
      language: input.snapshot.venue.defaultLanguage,
      extensions: null,
    },
  };
  for (const type of IMDF_FEATURE_TYPES) {
    files[`${type}.geojson`] = { type: 'FeatureCollection', features: w.features[type] };
  }
  return { files, skipped: w.skipped };
}
