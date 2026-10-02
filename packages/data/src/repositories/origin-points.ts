import type { OriginPoint, OriginPointInput, VenueId } from '@indoor/domain';
import type { Tables } from '../database.types';
import { toDataError } from '../errors';
import { geometryToColumn, positionFromColumn } from '../geometry';
import { fetchAllPages } from '../pagination';
import type { Db } from '../supabase';

type OriginPointRow = Pick<
  Tables<'origin_points'>,
  'id' | 'floor_id' | 'name' | 'geom' | 'heading_deg' | 'node_id' | 'public_code'
>;

export interface OriginPointsRepository {
  /** QR titik asal venue, urut nama. */
  list(venueId: VenueId): Promise<OriginPoint[]>;
  create(venueId: VenueId, input: OriginPointInput): Promise<OriginPoint>;
  update(id: string, input: OriginPointInput): Promise<OriginPoint>;
  remove(id: string): Promise<void>;
}

const COLUMNS = 'id, floor_id, name, geom, heading_deg, node_id, public_code';

export function toOriginPointRow(input: OriginPointInput) {
  return {
    floor_id: input.floorId,
    name: input.name.trim(),
    geom: geometryToColumn({ type: 'Point', coordinates: input.coordinates }),
    heading_deg: input.headingDeg,
    node_id: input.nodeId,
  };
}

export function mapOriginPointRow(row: OriginPointRow): OriginPoint {
  return {
    id: row.id,
    floorId: row.floor_id,
    name: row.name,
    coordinates: positionFromColumn(row.geom),
    headingDeg: Number(row.heading_deg),
    nodeId: row.node_id,
    code: row.public_code,
  };
}

export function createOriginPointsRepository(db: Db): OriginPointsRepository {
  return {
    async list(venueId) {
      const rows = await fetchAllPages((from, to) =>
        db
          .from('origin_points')
          .select(COLUMNS)
          .eq('venue_id', venueId)
          .order('name')
          .order('id')
          .range(from, to),
      );
      return rows.map(mapOriginPointRow);
    },
    async create(venueId, input) {
      const { data, error } = await db
        .from('origin_points')
        .insert({ venue_id: venueId, ...toOriginPointRow(input) })
        .select(COLUMNS)
        .single();
      if (error) throw toDataError(error);
      return mapOriginPointRow(data);
    },
    async update(id, input) {
      const { data, error } = await db
        .from('origin_points')
        .update(toOriginPointRow(input))
        .eq('id', id)
        .select(COLUMNS)
        .single();
      if (error) throw toDataError(error);
      return mapOriginPointRow(data);
    },
    async remove(id) {
      const { error } = await db.from('origin_points').delete().eq('id', id);
      if (error) throw toDataError(error);
    },
  };
}
