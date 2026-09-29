import type { Profile } from '@indoor/domain';
import { UserIdSchema } from '@indoor/domain';
import { DataError, toDataError } from './errors';
import type { ProfilesRepository } from './repositories/profiles';
import type { Db } from './supabase';

export interface AuthRepository {
  /** Profil pengguna yang sedang masuk, atau `null` jika belum ada sesi. */
  getCurrentProfile(): Promise<Profile | null>;
  /** Dipanggil setiap sesi berubah (masuk, keluar, token diperbarui). Mengembalikan fungsi berhenti. */
  onChange(listener: () => void): () => void;
  signOut(): Promise<void>;
}

export function createAuthRepository(db: Db, profiles: ProfilesRepository): AuthRepository {
  return {
    async getCurrentProfile() {
      const { data, error } = await db.auth.getSession();
      if (error) throw toDataError(error);
      if (!data.session) return null;
      try {
        return await profiles.getById(UserIdSchema.parse(data.session.user.id));
      } catch (cause) {
        if (cause instanceof DataError && cause.kind === 'not_found') {
          throw new DataError('forbidden', {
            message: 'Akun ini belum terdaftar sebagai pengguna Admin. Hubungi Super Admin.',
            cause,
          });
        }
        throw cause;
      }
    },

    onChange(listener) {
      const { data } = db.auth.onAuthStateChange(() => listener());
      return () => data.subscription.unsubscribe();
    },

    async signOut() {
      const { error } = await db.auth.signOut();
      if (error) throw toDataError(error);
    },
  };
}
