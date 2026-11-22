import { parseVenueDashboard, type VenueDashboard, type VenueId } from '@indoor/domain';
import { toDataError } from '../errors';
import type { Db } from '../supabase';

export interface VenueDashboardRepository {
  /** Ringkasan draft venue dihitung server saat diminta (`venue_dashboard`). */
  get(venueId: VenueId): Promise<VenueDashboard>;
}

export function createVenueDashboardRepository(db: Db): VenueDashboardRepository {
  return {
    async get(venueId) {
      const { data, error } = await db.rpc('venue_dashboard', { p_venue_id: venueId });
      if (error) throw toDataError(error);
      return parseVenueDashboard(data);
    },
  };
}
