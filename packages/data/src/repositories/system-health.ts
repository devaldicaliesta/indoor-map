import { type SystemHealth, SystemHealthRowSchema } from '@indoor/domain';
import { DataError, toDataError } from '../errors';
import type { Db } from '../supabase';

export interface SystemHealthRepository {
  /** Hanya Super Admin; selain itu `forbidden`. */
  get(): Promise<SystemHealth>;
}

export function createSystemHealthRepository(db: Db): SystemHealthRepository {
  return {
    async get() {
      const { data, error } = await db.rpc('system_health');
      if (error) throw toDataError(error);
      const parsed = SystemHealthRowSchema.safeParse(data);
      if (!parsed.success) {
        throw new DataError('unknown', {
          message: 'Jawaban server tentang kesehatan sistem tidak dikenali.',
          cause: parsed.error,
        });
      }
      return parsed.data;
    },
  };
}
