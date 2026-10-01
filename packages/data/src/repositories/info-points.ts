import type { InfoPoint, VenueId } from '@indoor/domain';
import type { Tables } from '../database.types';
import { positionFromColumn } from '../geometry';
import { fetchAllPages } from '../pagination';
import type { Db } from '../supabase';

type InfoPointRow = Pick<
  Tables<'info_points'>,
  'id' | 'code' | 'name' | 'floor_id' | 'geom' | 'heading_deg' | 'node_id'
>;

export interface InfoPointsRepository {
  /** Info Point venue, urut nama. Pengelolaannya di Admin dibuat di T-407. */
  list(venueId: VenueId): Promise<InfoPoint[]>;
}

export function mapInfoPointRow(row: InfoPointRow): InfoPoint {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    floorId: row.floor_id,
    coordinates: positionFromColumn(row.geom),
    headingDeg: Number(row.heading_deg),
    nodeId: row.node_id,
  };
}

export function createInfoPointsRepository(db: Db): InfoPointsRepository {
  return {
    async list(venueId) {
      const rows = await fetchAllPages((from, to) =>
        db
          .from('info_points')
          .select('id, code, name, floor_id, geom, heading_deg, node_id')
          .eq('venue_id', venueId)
          .order('name')
          .order('id')
          .range(from, to),
      );
      return rows.map(mapInfoPointRow);
    },
  };
}
