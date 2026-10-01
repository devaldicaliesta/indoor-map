import type { OriginPoint, VenueId } from '@indoor/domain';
import type { Tables } from '../database.types';
import { positionFromColumn } from '../geometry';
import { fetchAllPages } from '../pagination';
import type { Db } from '../supabase';

type OriginPointRow = Pick<
  Tables<'origin_points'>,
  'id' | 'floor_id' | 'name' | 'geom' | 'heading_deg' | 'node_id' | 'public_code'
>;

export interface OriginPointsRepository {
  /** QR titik asal venue, urut nama. Tambah dan ubah dibuat di T-212. */
  list(venueId: VenueId): Promise<OriginPoint[]>;
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
          .select('id, floor_id, name, geom, heading_deg, node_id, public_code')
          .eq('venue_id', venueId)
          .order('name')
          .order('id')
          .range(from, to),
      );
      return rows.map(mapOriginPointRow);
    },
  };
}
