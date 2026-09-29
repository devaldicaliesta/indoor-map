import {
  areaM2,
  type FeatureKind,
  FeatureKindSchema,
  type FloorId,
  type Geometry,
  type MapFeatureProperties,
  roundAreaM2,
  UNIT_STATUSES,
  type UnitStatus,
  type VenueId,
} from '@indoor/domain';
import type { Feature, FeatureCollection } from 'geojson';
import type { Tables } from '../database.types';
import { toDataError } from '../errors';
import { geometryFromColumn, geometryToColumn } from '../geometry';
import type { Db } from '../supabase';

const COLUMNS =
  'id, floor_id, kind, geom, name, height_m, color, unit_code, unit_status, facility_type_id';

type FeatureRow = Pick<
  Tables<'features'>,
  | 'id'
  | 'floor_id'
  | 'kind'
  | 'geom'
  | 'name'
  | 'height_m'
  | 'color'
  | 'unit_code'
  | 'unit_status'
  | 'facility_type_id'
>;

export type FloorFeatures = FeatureCollection<Geometry, MapFeatureProperties>;

/** Properti opsional hanya diisi bila ada nilainya (`exactOptionalPropertyTypes`). */
export function mapFeatureRow(row: FeatureRow): Feature<Geometry, MapFeatureProperties> {
  const properties: MapFeatureProperties = {
    id: row.id,
    kind: FeatureKindSchema.parse(row.kind) as FeatureKind,
    floorId: row.floor_id,
  };
  if (row.name) properties.name = row.name;
  if (row.unit_code) properties.unitCode = row.unit_code;
  if (row.unit_status && (UNIT_STATUSES as readonly string[]).includes(row.unit_status)) {
    properties.unitStatus = row.unit_status as UnitStatus;
  }
  if (row.height_m !== null) properties.height = Number(row.height_m);
  if (row.color) properties.color = row.color;
  if (row.facility_type_id) properties.facilityTypeId = row.facility_type_id;
  return { type: 'Feature', id: row.id, geometry: geometryFromColumn(row.geom), properties };
}

export type FloorFeature = Feature<Geometry, MapFeatureProperties>;

export interface FeaturesRepository {
  /** Semua fitur draft satu lantai sebagai GeoJSON siap tampil. */
  listByFloor(floorId: FloorId): Promise<FloorFeatures>;
  /**
   * Menyimpan fitur ke draft (buat atau timpa berdasarkan id dari klien). Luas unit
   * dihitung dari geometri. Tidak menyentuh snapshot publish (FR-MAP-10).
   */
  save(venueId: VenueId, feature: FloorFeature): Promise<void>;
  remove(id: string): Promise<void>;
}

export function toFeatureColumns(venueId: VenueId, feature: FloorFeature) {
  const p = feature.properties;
  return {
    id: p.id,
    venue_id: venueId,
    floor_id: p.floorId,
    kind: p.kind,
    geom: geometryToColumn(feature.geometry),
    name: p.name ?? null,
    height_m: p.height ?? null,
    color: p.color ?? null,
    unit_code: p.kind === 'unit' ? (p.unitCode ?? null) : null,
    unit_status: p.kind === 'unit' ? (p.unitStatus ?? null) : null,
    area_m2: p.kind === 'unit' ? roundAreaM2(areaM2(feature.geometry)) : null,
    facility_type_id: p.facilityTypeId ?? null,
  };
}

export function createFeaturesRepository(db: Db): FeaturesRepository {
  return {
    async listByFloor(floorId) {
      const { data, error } = await db.from('features').select(COLUMNS).eq('floor_id', floorId);
      if (error) throw toDataError(error);
      return { type: 'FeatureCollection', features: data.map(mapFeatureRow) };
    },

    async save(venueId, feature) {
      const { error } = await db
        .from('features')
        .upsert(toFeatureColumns(venueId, feature), { onConflict: 'id' });
      if (error) throw toDataError(error);
    },

    async remove(id) {
      // Fitur yang belum pernah tersimpan juga sah dihapus: hasil nol baris bukan galat.
      const { error } = await db.from('features').delete().eq('id', id);
      if (error) throw toDataError(error);
    },
  };
}
