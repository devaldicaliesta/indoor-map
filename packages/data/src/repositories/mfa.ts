import { DataError, toDataError } from '../errors';
import type { Db } from '../supabase';

/** Tingkat sesi Supabase Auth: `aal2` = sudah lolos verifikasi dua langkah. */
export interface MfaStatus {
  level: 'aal1' | 'aal2' | null;
  /** Faktor TOTP terverifikasi; `null` bila pengguna belum pernah mendaftarkan aplikasi autentikator. */
  factorId: string | null;
}

export interface TotpEnrollment {
  factorId: string;
  /** Gambar QR sebagai data URL SVG, untuk `<img src>`. */
  qrCode: string;
  /** Kunci rahasia untuk diketik manual bila QR tidak bisa dipindai. */
  secret: string;
}

export interface MfaRepository {
  status(): Promise<MfaStatus>;
  /**
   * Mendaftarkan aplikasi autentikator (TOTP). Pendaftaran sebelumnya yang belum diverifikasi
   * dihapus lebih dulu. Supabase menolak pendaftaran baru tanpa aal2 bila sudah ada faktor
   * terverifikasi, jadi password saja tidak bisa mengganti aplikasi autentikator pemiliknya.
   */
  enrollTotp(issuer: string): Promise<TotpEnrollment>;
  /** Memeriksa kode 6 digit; bila benar sesi naik ke `aal2`. */
  verifyTotp(factorId: string, code: string): Promise<void>;
}

function mfaError(error: { code?: string | undefined; status?: number | undefined }): DataError {
  if (error.code === 'mfa_verification_failed' || error.code === 'mfa_challenge_expired') {
    return new DataError('invalid', {
      code: error.code,
      message: 'Kode salah atau sudah kedaluwarsa. Masukkan kode terbaru dari aplikasi.',
      cause: error,
    });
  }
  if (error.code === 'over_request_rate_limit' || error.status === 429) {
    return new DataError('forbidden', {
      code: 'rate_limited',
      message: 'Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.',
      cause: error,
    });
  }
  if (
    error.code === 'mfa_totp_enroll_not_enabled' ||
    error.code === 'mfa_totp_verify_not_enabled'
  ) {
    return new DataError('forbidden', {
      code: error.code,
      message: 'Verifikasi dua langkah (TOTP) belum diaktifkan di Supabase Auth.',
      cause: error,
    });
  }
  return toDataError(error);
}

export function createMfaRepository(db: Db): MfaRepository {
  return {
    async status() {
      const [level, factors] = await Promise.all([
        db.auth.mfa.getAuthenticatorAssuranceLevel(),
        db.auth.mfa.listFactors(),
      ]);
      if (level.error) throw mfaError(level.error);
      if (factors.error) throw mfaError(factors.error);
      const current = level.data.currentLevel;
      return {
        level: current === 'aal2' ? 'aal2' : current === 'aal1' ? 'aal1' : null,
        factorId: factors.data.totp[0]?.id ?? null,
      };
    },

    async enrollTotp(issuer) {
      const factors = await db.auth.mfa.listFactors();
      if (factors.error) throw mfaError(factors.error);
      for (const factor of factors.data.all) {
        if (factor.factor_type === 'totp' && factor.status === 'unverified') {
          const removed = await db.auth.mfa.unenroll({ factorId: factor.id });
          if (removed.error) throw mfaError(removed.error);
        }
      }
      const { data, error } = await db.auth.mfa.enroll({
        factorType: 'totp',
        issuer,
        // Nama faktor harus unik per pengguna; pendaftaran lama yang belum diverifikasi sudah dihapus.
        friendlyName: `${issuer} ${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw mfaError(error);
      return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
    },

    async verifyTotp(factorId, code) {
      const { error } = await db.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (error) throw mfaError(error);
    },
  };
}
