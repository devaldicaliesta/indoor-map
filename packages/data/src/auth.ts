import type { Profile } from '@indoor/domain';
import { UserIdSchema } from '@indoor/domain';
import { DataError, toDataError } from './errors';
import type { ProfilesRepository } from './repositories/profiles';
import type { Db } from './supabase';

// Pesan dari Auth Hook penguncian (migrasi 0021); harus sama persis (dijaga test integrasi).
// Akun terkunci sengaja tidak punya pesan sendiri: hook membalas seperti kredensial salah
// agar email terdaftar tidak bisa ditebak, dan pemilik akun diberi tahu lewat email.
export const ACCOUNT_INACTIVE_MESSAGE = 'Akun Anda dinonaktifkan. Hubungi Super Admin.';

// Awal pesan dari Edge Function auth-email (Auth Hook send email) saat email Auth tidak
// bisa dikirim lewat SMTP Pengaturan Sistem; pesannya ditujukan ke pengguna apa adanya.
export const EMAIL_UNAVAILABLE_PREFIXES = ['Server email belum diatur', 'Email tidak terkirim'];

/** Kode pada `DataError.code` untuk kegagalan autentikasi. */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_inactive'
  | 'rate_limited'
  | 'weak_password'
  | 'same_password'
  | 'session_missing'
  | 'email_unavailable';

export type AuthEvent =
  | 'initial_session'
  | 'signed_in'
  | 'signed_out'
  | 'password_recovery'
  | 'token_refreshed'
  | 'user_updated';

const AUTH_EVENTS: Record<string, AuthEvent> = {
  INITIAL_SESSION: 'initial_session',
  SIGNED_IN: 'signed_in',
  SIGNED_OUT: 'signed_out',
  PASSWORD_RECOVERY: 'password_recovery',
  TOKEN_REFRESHED: 'token_refreshed',
  USER_UPDATED: 'user_updated',
};

function authError(code: AuthErrorCode, message: string, cause: unknown): DataError {
  const kind = code === 'weak_password' || code === 'same_password' ? 'invalid' : 'forbidden';
  return new DataError(kind, { code, message, cause });
}

interface AuthErrorLike {
  code?: string | undefined;
  status?: number | undefined;
  message: string;
}

/** Menerjemahkan error Supabase Auth; pesan untuk kredensial salah sengaja umum. */
export function toAuthError(error: AuthErrorLike): DataError {
  if (error.message === ACCOUNT_INACTIVE_MESSAGE) {
    return authError('account_inactive', ACCOUNT_INACTIVE_MESSAGE, error);
  }
  if (EMAIL_UNAVAILABLE_PREFIXES.some((prefix) => error.message.startsWith(prefix))) {
    return new DataError('unknown', {
      code: 'email_unavailable',
      message: error.message,
      cause: error,
    });
  }
  switch (error.code) {
    case 'invalid_credentials':
      return authError('invalid_credentials', 'Email atau password salah.', error);
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return authError(
        'rate_limited',
        'Terlalu banyak permintaan dari perangkat ini. Tunggu beberapa menit, lalu coba lagi.',
        error,
      );
    case 'weak_password':
      return authError(
        'weak_password',
        'Password terlalu lemah. Gunakan minimal 8 karakter.',
        error,
      );
    case 'same_password':
      return authError('same_password', 'Password baru harus berbeda dari password lama.', error);
    case 'session_not_found':
    case 'session_expired':
      return authError(
        'session_missing',
        'Sesi pengaturan ulang tidak berlaku. Minta tautan reset baru.',
        error,
      );
    default:
      return error.status === 429
        ? authError('rate_limited', 'Terlalu banyak permintaan. Tunggu beberapa menit.', error)
        : toDataError(error);
  }
}

export interface AuthRepository {
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  hasSession(): Promise<boolean>;
  /** Profil pengguna yang sedang masuk, atau `null` jika belum ada sesi. Akun nonaktif langsung dikeluarkan. */
  getCurrentProfile(): Promise<Profile | null>;
  /** Mengirim tautan reset; hasilnya sama untuk email terdaftar maupun tidak. */
  requestPasswordReset(email: string, redirectTo: string): Promise<void>;
  /** Mengganti password pengguna yang sedang dalam sesi (termasuk sesi dari tautan reset). */
  updatePassword(password: string): Promise<void>;
  onChange(listener: (event: AuthEvent) => void): () => void;
}

export function createAuthRepository(db: Db, profiles: ProfilesRepository): AuthRepository {
  async function signOut() {
    const { error } = await db.auth.signOut();
    if (error) throw toDataError(error);
  }

  return {
    async signIn(email, password) {
      const { error } = await db.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw toAuthError(error);
    },

    signOut,

    async hasSession() {
      const { data, error } = await db.auth.getSession();
      if (error) throw toAuthError(error);
      return data.session !== null;
    },

    async getCurrentProfile() {
      const { data, error } = await db.auth.getSession();
      if (error) throw toAuthError(error);
      if (!data.session) return null;

      let profile: Profile;
      try {
        profile = await profiles.getById(UserIdSchema.parse(data.session.user.id));
      } catch (cause) {
        if (cause instanceof DataError && cause.kind === 'not_found') {
          throw new DataError('forbidden', {
            message: 'Akun ini belum terdaftar sebagai pengguna Admin. Hubungi Super Admin.',
            cause,
          });
        }
        throw cause;
      }

      if (!profile.isActive) {
        await signOut();
        throw authError('account_inactive', ACCOUNT_INACTIVE_MESSAGE, null);
      }
      return profile;
    },

    async requestPasswordReset(email, redirectTo) {
      const { error } = await db.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw toAuthError(error);
    },

    async updatePassword(password) {
      const { error } = await db.auth.updateUser({ password });
      if (error) throw toAuthError(error);
    },

    onChange(listener) {
      const { data } = db.auth.onAuthStateChange((event) => {
        const mapped = AUTH_EVENTS[event];
        if (mapped) listener(mapped);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
