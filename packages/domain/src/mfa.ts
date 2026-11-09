/** Keadaan 2FA sesi saat ini menurut server (`mfa_status()`, migrasi 0059). */
export interface MfaState {
  /** Sesi ini wajib lolos 2FA: role-nya diwajibkan, atau pengguna mengaktifkannya sendiri. */
  required: boolean;
  /** Role pengguna diwajibkan 2FA oleh Super Admin. */
  roleRequired: boolean;
  hasTotp: boolean;
  /** Sesi sudah memenuhi kewajiban (aal2, atau memang tidak wajib). */
  satisfied: boolean;
}

export type MfaGateStep = 'ok' | 'verify' | 'enroll';

/** Layar yang dibutuhkan sebelum Admin terbuka. Server tetap menolak data sampai terpenuhi. */
export function mfaGateStep(state: MfaState): MfaGateStep {
  if (state.satisfied) return 'ok';
  return state.hasTotp ? 'verify' : 'enroll';
}

/** 2FA yang diwajibkan role tidak bisa dimatikan sendiri; hanya direset Super Admin. */
export function canDisableMfa(state: MfaState): boolean {
  return state.hasTotp && !state.roleRequired;
}

export const RECOVERY_CODE_COUNT = 10;

// Sama dengan alfabet `mfa_recovery_codes_generate()`: tanpa 0/O/1/I.
const RECOVERY_CODE_PATTERN = /^[2-9A-HJ-NP-Z]{10}$/;

/** Kode cadangan tanpa spasi/tanda hubung, huruf besar; `null` bila bentuknya pasti salah. */
export function normalizeRecoveryCode(input: string): string | null {
  const code = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return RECOVERY_CODE_PATTERN.test(code) ? code : null;
}

/** Kode TOTP 6 digit; spasi di tengah (salinan dari aplikasi) dibuang. */
export function normalizeTotpCode(input: string): string | null {
  const code = input.replace(/\s/g, '');
  return /^\d{6}$/.test(code) ? code : null;
}
