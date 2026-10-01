import type { Closure, VenueId } from '@indoor/domain';
import type { Tables } from '../database.types';
import { fetchAllPages } from '../pagination';
import type { Db } from '../supabase';

type ClosureRow = Pick<
  Tables<'closures'>,
  'id' | 'feature_id' | 'edge_id' | 'connector_id' | 'reason' | 'starts_at' | 'ends_at'
>;

export interface ClosuresRepository {
  /** Penutupan venue yang belum berakhir pada `now`: yang sedang berlaku dan yang terjadwal. */
  listCurrent(venueId: VenueId, now: Date): Promise<Closure[]>;
}

export function mapClosureRow(row: ClosureRow): Closure {
  return {
    id: row.id,
    featureId: row.feature_id,
    edgeId: row.edge_id,
    connectorId: row.connector_id,
    reason: row.reason,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export function createClosuresRepository(db: Db): ClosuresRepository {
  return {
    async listCurrent(venueId, now) {
      const rows = await fetchAllPages((from, to) =>
        db
          .from('closures')
          .select('id, feature_id, edge_id, connector_id, reason, starts_at, ends_at')
          .eq('venue_id', venueId)
          .or(`ends_at.is.null,ends_at.gt."${now.toISOString()}"`)
          .order('starts_at')
          .order('id')
          .range(from, to),
      );
      return rows.map(mapClosureRow);
    },
  };
}
