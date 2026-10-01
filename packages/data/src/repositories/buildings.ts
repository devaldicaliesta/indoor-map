import {
  type Building,
  type BuildingId,
  BuildingIdSchema,
  type BuildingInput,
  type FloorId,
  FloorIdSchema,
  normalizeBuildingCode,
  type Polygon,
  type VenueId,
  VenueIdSchema,
} from '@indoor/domain';
import { DataError, toDataError } from '../errors';
import { geometryToColumn, nullableGeometryFromColumn } from '../geometry';
import { zeroRowsError } from '../mutations';
import type { Db } from '../supabase';

// Petunjuk FK: floors punya dua relasi ke buildings (gedung milik dan lantai default).
const COLUMNS =
  'id, venue_id, name, code, footprint, default_floor_id, sort_order, floors!floors_building_same_venue(count)';

interface BuildingRow {
  id: string;
  venue_id: string;
  name: string;
  code: string;
  footprint: unknown;
  default_floor_id: string | null;
  sort_order: number;
  floors: { count: number }[];
}

export function mapBuildingRow(row: BuildingRow): Building {
  const footprint = nullableGeometryFromColumn(row.footprint);
  if (footprint && footprint.type !== 'Polygon') {
    throw new DataError('invalid', { message: 'Footprint gedung harus berupa poligon.' });
  }
  return {
    id: BuildingIdSchema.parse(row.id),
    venueId: VenueIdSchema.parse(row.venue_id),
    name: row.name,
    code: row.code,
    footprint: footprint as Polygon | null,
    defaultFloorId: row.default_floor_id ? FloorIdSchema.parse(row.default_floor_id) : null,
    sortOrder: row.sort_order,
    floorCount: row.floors[0]?.count ?? 0,
  };
}

function toColumns(input: BuildingInput) {
  return {
    name: input.name.trim(),
    code: normalizeBuildingCode(input.code),
    footprint: input.footprint ? geometryToColumn(input.footprint) : null,
  };
}

function codeConflict(error: unknown, code: string): DataError {
  const mapped = toDataError(error);
  return mapped.code === '23505'
    ? new DataError('conflict', {
        message: `Kode ${normalizeBuildingCode(code)} sudah dipakai gedung lain di venue ini.`,
        code: '23505',
        cause: error,
      })
    : mapped;
}

export interface OutdoorLayer {
  floorId: FloorId;
  name: string;
}

export interface BuildingsRepository {
  list(venueId: VenueId): Promise<Building[]>;
  create(venueId: VenueId, input: BuildingInput): Promise<Building>;
  update(id: BuildingId, input: BuildingInput): Promise<Building>;
  /** Menghapus gedung beserta lantai dan isinya (cascade). */
  remove(id: BuildingId): Promise<void>;
  /** Gedung yang tampil pertama di Visitor. */
  setDefault(venueId: VenueId, buildingId: BuildingId): Promise<void>;
  /** Lapisan Area Luar venue (dibuat trigger, tidak bisa dihapus lewat Admin). */
  outdoorLayer(venueId: VenueId): Promise<OutdoorLayer>;
}

export function createBuildingsRepository(db: Db): BuildingsRepository {
  async function isVisible(id: BuildingId) {
    const { data } = await db.from('buildings').select('id').eq('id', id).maybeSingle();
    return data !== null;
  }

  async function fetchOne(id: BuildingId): Promise<Building> {
    const { data, error } = await db.from('buildings').select(COLUMNS).eq('id', id).single();
    if (error) throw toDataError(error);
    return mapBuildingRow(data as unknown as BuildingRow);
  }

  return {
    async list(venueId) {
      const { data, error } = await db
        .from('buildings')
        .select(COLUMNS)
        .eq('venue_id', venueId)
        .order('sort_order')
        .order('name');
      if (error) throw toDataError(error);
      return (data as unknown as BuildingRow[]).map(mapBuildingRow);
    },

    async create(venueId, input) {
      const { data, error } = await db
        .from('buildings')
        .insert({ venue_id: venueId, ...toColumns(input) })
        .select('id')
        .single();
      if (error) throw codeConflict(error, input.code);
      return fetchOne(BuildingIdSchema.parse(data.id));
    },

    async update(id, input) {
      const { data, error } = await db
        .from('buildings')
        .update(toColumns(input))
        .eq('id', id)
        .select('id');
      if (error) throw codeConflict(error, input.code);
      if (!data[0]) throw await zeroRowsError(() => isVisible(id));
      return fetchOne(id);
    },

    async remove(id) {
      const { data, error } = await db.from('buildings').delete().eq('id', id).select('id');
      if (error) throw toDataError(error);
      if (!data[0]) throw await zeroRowsError(() => isVisible(id));
    },

    async setDefault(venueId, buildingId) {
      const { data, error } = await db
        .from('venues')
        .update({ default_building_id: buildingId })
        .eq('id', venueId)
        .select('id');
      if (error) throw toDataError(error);
      if (!data[0]) throw new DataError('forbidden');
    },

    async outdoorLayer(venueId) {
      const { data, error } = await db
        .from('floors')
        .select('id, name')
        .eq('venue_id', venueId)
        .eq('is_outdoor', true)
        .single();
      if (error) throw toDataError(error);
      return { floorId: FloorIdSchema.parse(data.id), name: data.name };
    },
  };
}
