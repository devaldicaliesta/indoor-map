import {
  type BuildingId,
  BuildingIdSchema,
  type Floor,
  type FloorId,
  FloorIdSchema,
  type FloorInput,
  sortFloorsTopDown,
  VenueIdSchema,
} from '@indoor/domain';
import { DataError, toDataError } from '../errors';
import { zeroRowsError } from '../mutations';
import type { Db } from '../supabase';

const COLUMNS =
  'id, venue_id, building_id, is_outdoor, name, level, height_m, sort_order, features(count)';

interface FloorRow {
  id: string;
  venue_id: string;
  building_id: string | null;
  is_outdoor: boolean;
  name: string;
  level: number;
  height_m: number;
  sort_order: number;
  features: { count: number }[];
}

export function mapFloorRow(row: FloorRow): Floor {
  return {
    id: FloorIdSchema.parse(row.id),
    venueId: VenueIdSchema.parse(row.venue_id),
    buildingId: row.building_id ? BuildingIdSchema.parse(row.building_id) : null,
    isOutdoor: row.is_outdoor,
    name: row.name,
    level: row.level,
    heightM: Number(row.height_m),
    sortOrder: row.sort_order,
    featureCount: row.features[0]?.count ?? 0,
  };
}

const toColumns = (input: FloorInput) => ({
  name: input.name.trim(),
  level: input.level,
  height_m: input.heightM,
});

export interface FloorsRepository {
  /** Lantai gedung, dari atas ke bawah. Area Luar tidak termasuk. */
  list(buildingId: BuildingId): Promise<Floor[]>;
  create(buildingId: BuildingId, input: FloorInput): Promise<Floor>;
  update(id: FloorId, input: FloorInput): Promise<Floor>;
  /** Menghapus lantai beserta semua fiturnya (cascade); UI wajib mengonfirmasi jumlah fitur. */
  remove(id: FloorId): Promise<void>;
  /** FR-VEN-06: lantai yang tampil pertama untuk gedung ini. */
  setDefault(buildingId: BuildingId, floorId: FloorId): Promise<void>;
}

export function createFloorsRepository(db: Db): FloorsRepository {
  async function isVisible(id: FloorId) {
    const { data } = await db.from('floors').select('id').eq('id', id).maybeSingle();
    return data !== null;
  }

  async function fetchOne(id: FloorId): Promise<Floor> {
    const { data, error } = await db.from('floors').select(COLUMNS).eq('id', id).single();
    if (error) throw toDataError(error);
    return mapFloorRow(data as unknown as FloorRow);
  }

  return {
    async list(buildingId) {
      const { data, error } = await db.from('floors').select(COLUMNS).eq('building_id', buildingId);
      if (error) throw toDataError(error);
      return sortFloorsTopDown((data as unknown as FloorRow[]).map(mapFloorRow));
    },

    async create(buildingId, input) {
      const building = await db
        .from('buildings')
        .select('venue_id')
        .eq('id', buildingId)
        .maybeSingle();
      if (building.error) throw toDataError(building.error);
      if (!building.data) throw new DataError('not_found', { message: 'Gedung tidak ditemukan.' });
      const { data, error } = await db
        .from('floors')
        .insert({ ...toColumns(input), building_id: buildingId, venue_id: building.data.venue_id })
        .select('id')
        .single();
      if (error) throw toDataError(error);
      return fetchOne(FloorIdSchema.parse(data.id));
    },

    async update(id, input) {
      const { data, error } = await db
        .from('floors')
        .update(toColumns(input))
        .eq('id', id)
        .select('id');
      if (error) throw toDataError(error);
      if (!data[0]) throw await zeroRowsError(() => isVisible(id));
      return fetchOne(id);
    },

    async remove(id) {
      const { data, error } = await db.from('floors').delete().eq('id', id).select('id');
      if (error) throw toDataError(error);
      if (!data[0]) throw await zeroRowsError(() => isVisible(id));
    },

    async setDefault(buildingId, floorId) {
      const { data, error } = await db
        .from('buildings')
        .update({ default_floor_id: floorId })
        .eq('id', buildingId)
        .select('id');
      if (error) throw toDataError(error);
      if (!data[0]) throw new DataError('forbidden');
    },
  };
}
