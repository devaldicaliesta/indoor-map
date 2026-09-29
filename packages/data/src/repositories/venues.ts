import { VenueIdSchema, type VenueSummary } from '@indoor/domain';
import { toDataError } from '../errors';
import type { Db } from '../supabase';

export interface VenuesRepository {
  list(): Promise<VenueSummary[]>;
}

export function createVenuesRepository(db: Db): VenuesRepository {
  return {
    async list() {
      const { data, error } = await db.from('venues').select('id, name').order('name');
      if (error) throw toDataError(error);
      return data.map((row) => ({ id: VenueIdSchema.parse(row.id), name: row.name }));
    },
  };
}
