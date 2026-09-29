import type { AppRole } from '@indoor/domain';
import { fromFunctionError } from '../functions';
import type { Db } from '../supabase';

export interface InviteUserInput {
  email: string;
  fullName: string;
  role: AppRole;
  /** Halaman tempat pengguna membuat password dari tautan undangan. */
  redirectTo: string;
}

export interface UsersRepository {
  /** Mengundang pengguna lewat Edge Function `admin-users` (hanya Super Admin). */
  invite(input: InviteUserInput): Promise<void>;
}

export function createUsersRepository(db: Db): UsersRepository {
  return {
    async invite(input) {
      const { error } = await db.functions.invoke('admin-users', { body: input });
      if (error) throw await fromFunctionError(error);
    },
  };
}
