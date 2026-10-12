import { type HostedTrialStatus, VenueIdSchema } from '@indoor/domain';
import { toDataError } from '../errors';
import type { Db } from '../supabase';

export interface TrialRepository {
  /**
   * Trial ter-hosting pengguna yang masuk (banner sisa hari, layar "Trial berakhir"); `null`
   * untuk pengguna on-premise dan staf vendor. Tetap terbaca setelah venue terkunci.
   */
  status(): Promise<HostedTrialStatus | null>;
}

export function createTrialRepository(db: Db): TrialRepository {
  return {
    async status() {
      const { data, error } = await db.rpc('trial_status');
      if (error) throw toDataError(error);
      const [row] = data ?? [];
      return row
        ? { venueId: VenueIdSchema.parse(row.venue_id), endsAt: row.ends_at, locked: row.locked }
        : null;
    },
  };
}
