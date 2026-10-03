import { toDataError } from '../errors';
import { fromFunctionError } from '../functions';
import type { Db } from '../supabase';

export type LicenseState = 'missing' | 'active' | 'not_yet_valid' | 'expired' | 'revoked';

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
}

const STATES: readonly LicenseState[] = [
  'missing',
  'active',
  'not_yet_valid',
  'expired',
  'revoked',
];

export function createLicenseRepository(db: Db): LicenseRepository {
  async function invoke<T>(body: Record<string, unknown>): Promise<T> {
    const { data, error } = await db.functions.invoke<T>('license-activate', { body });
    if (error) throw await fromFunctionError(error);
    if (!data) throw toDataError(new Error('Balasan aktivasi kosong.'));
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
  };
}
