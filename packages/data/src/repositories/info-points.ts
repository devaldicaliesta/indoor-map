import type { InfoPoint, InfoPointInput, VenueId } from '@indoor/domain';
import type { Tables } from '../database.types';
import { toDataError } from '../errors';
import { geometryToColumn, positionFromColumn } from '../geometry';
import { fetchAllPages } from '../pagination';
import type { Db } from '../supabase';

type InfoPointRow = Pick<
  Tables<'info_points'>,
  | 'id'
  | 'code'
  | 'name'
  | 'floor_id'
  | 'geom'
  | 'heading_deg'
  | 'node_id'
  | 'default_mode'
  | 'force_2d'
  | 'default_language'
  | 'idle_seconds'
>;

export interface InfoPointsRepository {
  /** Info Point venue, urut nama. */
  list(venueId: VenueId): Promise<InfoPoint[]>;
  /** Server menolak bila kuota atau fitur Info Point paket tidak mengizinkan. */
  create(venueId: VenueId, input: InfoPointInput): Promise<InfoPoint>;
  update(id: string, input: InfoPointInput): Promise<InfoPoint>;
  remove(id: string): Promise<void>;
}

const COLUMNS =
  'id, code, name, floor_id, geom, heading_deg, node_id, default_mode, force_2d, default_language, idle_seconds';

export function mapInfoPointRow(row: InfoPointRow): InfoPoint {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    floorId: row.floor_id,
    coordinates: positionFromColumn(row.geom),
    headingDeg: Number(row.heading_deg),
    nodeId: row.node_id,
    defaultMode: row.default_mode,
    force2d: row.force_2d,
    defaultLanguage: row.default_language,
    idleSeconds: row.idle_seconds,
  };
}

function toRow(input: InfoPointInput) {
  return {
    code: input.code.trim(),
    name: input.name.trim(),
    floor_id: input.floorId,
    geom: geometryToColumn({ type: 'Point', coordinates: input.coordinates }),
    heading_deg: input.headingDeg,
    node_id: input.nodeId,
    default_mode: input.defaultMode,
    force_2d: input.force2d,
    default_language: input.defaultLanguage,
    idle_seconds: input.idleSeconds,
  };
}

export function createInfoPointsRepository(db: Db): InfoPointsRepository {
  return {
    async list(venueId) {
      const rows = await fetchAllPages((from, to) =>
        db
          .from('info_points')
          .select(COLUMNS)
          .eq('venue_id', venueId)
          .order('name')
          .order('id')
          .range(from, to),
      );
      return rows.map(mapInfoPointRow);
    },
    async create(venueId, input) {
      const { data, error } = await db
        .from('info_points')
        .insert({ venue_id: venueId, ...toRow(input) })
        .select(COLUMNS)
        .single();
      if (error) throw toDataError(error);
      return mapInfoPointRow(data);
    },
    async update(id, input) {
      const { data, error } = await db
        .from('info_points')
        .update(toRow(input))
        .eq('id', id)
        .select(COLUMNS)
        .single();
      if (error) throw toDataError(error);
      return mapInfoPointRow(data);
    },
    async remove(id) {
      const { error } = await db.from('info_points').delete().eq('id', id);
      if (error) throw toDataError(error);
    },
  };
}
