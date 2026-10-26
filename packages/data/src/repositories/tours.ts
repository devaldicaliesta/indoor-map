import { toDataError } from '../errors';
import type { Db } from '../supabase';

/** Status tur panduan Admin milik pengguna yang sedang masuk (RLS: hanya pemiliknya). */
export interface TourProgressRepository {
  /** Kunci tur (`id@versi`) yang sudah dilihat atau dilewati. */
  seen(): Promise<string[]>;
  markSeen(tourKey: string): Promise<void>;
}

export function createTourProgressRepository(db: Db): TourProgressRepository {
  return {
    async seen() {
      const { data, error } = await db.from('tour_progress').select('tour_key');
      if (error) throw toDataError(error);
      return data.map((row) => row.tour_key);
    },
    async markSeen(tourKey) {
      // user_id diisi server dari sesi (default auth.uid()), tidak pernah dari klien.
      const { error } = await db
        .from('tour_progress')
        .upsert(
          { tour_key: tourKey, seen_at: new Date().toISOString() },
          { onConflict: 'user_id,tour_key' },
        );
      if (error) throw toDataError(error);
    },
  };
}
