import {
  areaM2,
  type FeatureKind,
  FeatureKindSchema,
  type FloorId,
  type Geometry,
  type MapFeatureProperties,
  OUTDOOR_SUBTYPES,
  type OutdoorSubtype,
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
  'id, floor_id, kind, geom, name, height_m, color, unit_code, unit_status, area_m2, facility_type_id, props';

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
  | 'area_m2'
  | 'facility_type_id'
  | 'props'
>;

/** Isi `features.props` yang dipakai aplikasi. */
interface FeatureProps {
  subtype?: string;
  /** Luas di `area_m2` adalah koreksi manual, bukan hitungan otomatis. */
  areaManual?: boolean;
}

const propsOf = (value: unknown): FeatureProps =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as FeatureProps)
    : {};

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
  const props = propsOf(row.props);
  if (
    row.kind === 'outdoor_area' &&
    (OUTDOOR_SUBTYPES as readonly string[]).includes(props.subtype ?? '')
  ) {
    properties.subtype = props.subtype as OutdoorSubtype;
  }
  if (props.areaManual && row.area_m2 !== null) properties.areaM2 = Number(row.area_m2);
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
  /** Unit lain di venue yang memakai kode ini (tanpa membedakan huruf besar/kecil). */
  findUnitCode(venueId: VenueId, code: string, excludeId: string): Promise<UnitCodeOwner | null>;
}

export interface UnitCodeOwner {
  id: string;
  unitCode: string;
  floorName: string;
  buildingName: string | null;
}

/** `ilike` tanpa wildcard: `%`, `_`, dan `\` di kode dibaca harfiah. */
const likeLiteral = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

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
    area_m2: p.kind === 'unit' ? roundAreaM2(p.areaM2 ?? areaM2(feature.geometry)) : null,
    facility_type_id: p.facilityTypeId ?? null,
    props: {
      ...(p.kind === 'outdoor_area' && p.subtype ? { subtype: p.subtype } : {}),
      ...(p.kind === 'unit' && p.areaM2 !== undefined ? { areaManual: true } : {}),
    },
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

    async findUnitCode(venueId, code, excludeId) {
      const { data, error } = await db
        .from('features')
        .select('id, unit_code, floors(name, buildings!floors_building_same_venue(name))')
        .eq('venue_id', venueId)
        .ilike('unit_code', likeLiteral(code.trim()))
        .neq('id', excludeId)
        .limit(1);
      if (error) throw toDataError(error);
      const row = data[0];
      if (!row) return null;
      const floor = row.floors as unknown as { name: string; buildings: { name: string } | null };
      return {
        id: row.id,
        unitCode: row.unit_code ?? code,
        floorName: floor.name,
        buildingName: floor.buildings?.name ?? null,
      };
    },

    async remove(id) {
      // Fitur yang belum pernah tersimpan juga sah dihapus: hasil nol baris bukan galat.
      const { error } = await db.from('features').delete().eq('id', id);
      if (error) throw toDataError(error);
    },
  };
}
