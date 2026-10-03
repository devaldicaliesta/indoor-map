import { enabledFeatures, type PaidFeature, QUOTA_KINDS, type QuotaUsage } from '@indoor/domain';
import { type LicensePayload, readLicensePayload } from '@indoor/domain/license';
import { DataError, toDataError } from '../errors';
import { fromFunctionError } from '../functions';
import type { Db } from '../supabase';

/** `clock_behind`: jam server mundur lebih dari 24 jam dari waktu yang pernah tercatat. */
export type LicenseState =
  | 'missing'
  | 'active'
  | 'not_yet_valid'
  | 'expired'
  | 'revoked'
  | 'clock_behind'
  /** 14 hari setelah berakhir: Admin hanya-baca, Visitor tetap berjalan. */
  | 'grace';

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

/** Rincian lisensi berlaku untuk halaman Lisensi (Super Admin). */
export interface LicenseDetails {
  license: LicensePayload;
  status: 'active' | 'grace' | 'expired' | 'revoked';
  source: 'online' | 'manual' | 'checkin';
  activatedAt: string;
  lastCheckinAt: string | null;
  checkinError: string | null;
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
  /** Pemakaian per jenis kuota; server menolak penambahan melebihi kuota. */
  usage(): Promise<QuotaUsage[]>;
  /** Lisensi berlaku beserta keadaan check-in; `null` tanpa lisensi. Hanya Super Admin. */
  details(): Promise<LicenseDetails | null>;
  /** Fitur berbayar yang dibuka lisensi berlaku. */
  features(): Promise<PaidFeature[]>;
  /** Tanggal berakhir lisensi berlaku untuk banner pengingat; `null` tanpa lisensi. */
  validUntil(): Promise<string | null>;
}

const STATES: readonly LicenseState[] = [
  'missing',
  'active',
  'not_yet_valid',
  'expired',
  'revoked',
  'clock_behind',
  'grace',
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

    async usage() {
      const { data, error } = await db.rpc('license_usage');
      if (error) throw toDataError(error);
      return QUOTA_KINDS.map((kind) => {
        const row = data.find((r) => r.kind === kind);
        return { kind, used: row?.used ?? 0, quota: row?.quota ?? null };
      });
    },

    async validUntil() {
      const { data, error } = await db.rpc('license_valid_until');
      if (error) throw toDataError(error);
      return data ?? null;
    },

    async features() {
      const { data, error } = await db.rpc('license_features');
      if (error) throw toDataError(error);
      return enabledFeatures(data ?? []);
    },

    async details() {
      const [license, installation] = await Promise.all([
        db
          .from('licenses')
          .select('payload, status, source, activated_at')
          .eq('is_current', true)
          .maybeSingle(),
        db.from('installation').select('last_checkin_at, checkin_error').single(),
      ]);
      if (license.error) throw toDataError(license.error);
      if (installation.error) throw toDataError(installation.error);
      if (!license.data) return null;
      const payload = readLicensePayload(license.data.payload);
      if (!payload) throw toDataError(new Error('Isi lisensi tersimpan tidak terbaca.'));
      return {
        license: payload,
        status: license.data.status,
        source: license.data.source,
        activatedAt: license.data.activated_at,
        lastCheckinAt: installation.data.last_checkin_at,
        checkinError: installation.data.checkin_error,
      };
    },

    async checkIn() {
      // Selain Super Admin, Edge Function membalas seragam tanpa menghubungi vendor.
      const reply = await invoke<CheckinResult | { result: 'accepted' }>({}, 'license-checkin');
      if (reply.result === 'accepted') {
        throw new DataError('forbidden', {
          message: 'Hanya Super Admin yang bisa memeriksa lisensi sekarang.',
        });
      }
      return reply;
    },
  };
}
