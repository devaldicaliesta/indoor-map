import type { AppRole, UserId } from '@indoor/domain';
import { DataError, toDataError } from '../errors';
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
  /** Mengundang pengguna lewat Edge Function `admin-users` (Super Admin, atau Admin venue ke venue-nya). */
  invite(input: InviteUserInput): Promise<void>;
  /**
   * Seluruh data pribadi satu akun (`user_data_export`, Super Admin) sebagai dokumen JSON
   * siap unduh; export tercatat di log audit.
   */
  exportData(userId: UserId): Promise<UserDataExport>;
  /** Menghapus akun beserta data pribadinya (`user_data_delete`, Super Admin); tercatat di audit. */
  remove(userId: UserId): Promise<void>;
}

/** Isi berkas export; bentuk lengkapnya ditentukan server (`format` = versi). */
export interface UserDataExport {
  format: string;
  exportedAt: string;
  document: Record<string, unknown>;
}

export function toUserDataExport(value: unknown): UserDataExport {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new DataError('unknown', { message: 'Berkas export dari server tidak terbaca.' });
  }
  const document = value as Record<string, unknown>;
  const { format, exported_at: exportedAt } = document;
  if (typeof format !== 'string' || typeof exportedAt !== 'string') {
    throw new DataError('unknown', { message: 'Berkas export dari server tidak terbaca.' });
  }
  return { format, exportedAt, document };
}

export function createUsersRepository(db: Db): UsersRepository {
  return {
    async invite(input) {
      const { error } = await db.functions.invoke('admin-users', { body: input });
      if (error) throw await fromFunctionError(error);
    },

    async exportData(userId) {
      const { data, error } = await db.rpc('user_data_export', { p_user_id: userId });
      if (error) throw toDataError(error);
      return toUserDataExport(data);
    },

    async remove(userId) {
      const { error } = await db.rpc('user_data_delete', { p_user_id: userId });
      if (error) throw toDataError(error);
    },
  };
}
