import {
  type FeatureKind,
  FeatureKindSchema,
  type FloorId,
  type Geometry,
  type MapFeatureProperties,
  UNIT_STATUSES,
  type UnitStatus,
} from '@indoor/domain';
import type { Feature, FeatureCollection } from 'geojson';
import type { Tables } from '../database.types';
import { toDataError } from '../errors';
import { geometryFromColumn } from '../geometry';
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

export interface FeaturesRepository {
  /** Semua fitur draft satu lantai sebagai GeoJSON siap tampil. */
  listByFloor(floorId: FloorId): Promise<FloorFeatures>;
}

export function createFeaturesRepository(db: Db): FeaturesRepository {
  return {
    async listByFloor(floorId) {
      const { data, error } = await db.from('features').select(COLUMNS).eq('floor_id', floorId);
      if (error) throw toDataError(error);
      return { type: 'FeatureCollection', features: data.map(mapFeatureRow) };
    },
  };
}
