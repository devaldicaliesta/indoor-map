import { toDataError } from '../errors';
import { fromFunctionError } from '../functions';
import type { Db } from '../supabase';

/** `clock_behind`: jam server mundur lebih dari 24 jam dari waktu yang pernah tercatat. */
export type LicenseState =
  | 'missing'
  | 'active'
  | 'not_yet_valid'
  | 'expired'
  | 'revoked'
  | 'clock_behind';

export interface LicenseStatus {
  state: LicenseState;
  /** Sidik instalasi yang dikirim ke vendor saat aktivasi. */
  instanceId: string;
  /** Instalasi baru: Super Admin pertama belum dibuat. */
  needsAdmin: boolean;
}

/** Ringkasan lisensi yang baru dipasang. */
export interface ActivatedLicense {
  licenseId: string;
  client: string;
  plan: string;
  validUntil: string;
}

/** Hasil check-in manual: lisensi diperbarui, tetap, dicabut, atau vendor tidak terjangkau. */
export interface CheckinResult {
  result: 'renewed' | 'unchanged' | 'revoked' | 'failed';
  /** Alasan bila gagal. */
  message?: string;
}

export interface FirstAdminInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LicenseRepository {
  /** Bisa dibaca sebelum login; dipakai untuk mengarahkan Admin ke halaman aktivasi. */
  status(): Promise<LicenseStatus>;
  /** Kunci lisensi diteruskan ke server vendor; tidak disimpan di instalasi. */
  activateOnline(licenseKey: string): Promise<ActivatedLicense>;
  /** Berkas lisensi (JSON) dari vendor, diverifikasi server sebelum dipasang. */
  activateManual(license: unknown): Promise<ActivatedLicense>;
  /** Hanya untuk instalasi baru yang sudah berlisensi dan belum punya Super Admin. */
  createFirstAdmin(input: FirstAdminInput): Promise<void>;
  /** Sejak kapan tidak ada check-in berhasil, bila sudah lebih dari 7 hari; selain itu `null`. */
  checkinOverdueSince(): Promise<string | null>;
  /** Check-in ke vendor sekarang (Super Admin); jadwal otomatis berjalan di server. */
  checkIn(): Promise<CheckinResult>;
}

const STATES: readonly LicenseState[] = [
  'missing',
  'active',
  'not_yet_valid',
  'expired',
  'revoked',
  'clock_behind',
];

export function createLicenseRepository(db: Db): LicenseRepository {
  async function invoke<T>(body: Record<string, unknown>, name = 'license-activate'): Promise<T> {
    const { data, error } = await db.functions.invoke<T>(name, { body });
    if (error) throw await fromFunctionError(error);
    if (!data) throw toDataError(new Error('Balasan lisensi kosong.'));
    return data;
  }

  return {
    async status() {
      const { data, error } = await db.rpc('license_status');
      if (error) throw toDataError(error);
      const [row] = data;
      if (!row) throw toDataError(new Error('Status lisensi kosong.'));
      const state = STATES.find((s) => s === row.state) ?? 'missing';
      return { state, instanceId: row.instance_id, needsAdmin: row.needs_admin };
    },

    async activateOnline(licenseKey) {
      const { license } = await invoke<{ license: ActivatedLicense }>({
        mode: 'online',
        licenseKey,
      });
      return license;
    },

    async activateManual(license) {
      const result = await invoke<{ license: ActivatedLicense }>({ mode: 'manual', license });
      return result.license;
    },

    async createFirstAdmin(input) {
      await invoke({ mode: 'first_admin', ...input });
    },

    async checkinOverdueSince() {
      const { data, error } = await db.rpc('license_checkin_overdue_since');
      if (error) throw toDataError(error);
      return data ?? null;
    },

    checkIn() {
      return invoke<CheckinResult>({}, 'license-checkin');
    },
  };
}
