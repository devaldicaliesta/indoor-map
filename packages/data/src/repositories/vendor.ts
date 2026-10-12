import {
  type BlockKind,
  TRIAL_REQUEST_STATUSES,
  type TrialLead,
  type TrialRequestStatus,
  type VenueId,
  VenueIdSchema,
} from '@indoor/domain';
import type { Database } from '../database.types';
import { DataError, toDataError } from '../errors';
import type { Db } from '../supabase';

/** Langkah layar masuk dasbor vendor (`vendor_access`, migrasi 0053). */
export type VendorAccess = 'ok' | 'mfa' | 'denied';

export interface BlockEntry {
  value: string;
  kind: BlockKind;
  note: string | null;
  createdAt: string;
}

/** Hasil satu putaran Edge Function `trial-lifecycle`. */
export interface LifecycleRun {
  reminded: number;
  locked: number;
  deleted: number;
  activated: number;
  failed: number;
}

/**
 * Dasbor vendor trial ter-hosting. Setiap fungsi di server mensyaratkan staf vendor dengan sesi
 * `aal2`; repository ini tidak menambah pemeriksaan apa pun.
 */
export interface VendorRepository {
  access(): Promise<VendorAccess>;
  capacity(): Promise<number>;
  leads(): Promise<TrialLead[]>;
  blocklist(): Promise<BlockEntry[]>;
  /** Mengembalikan tanggal berakhir yang baru. */
  extend(venueId: VenueId, days: number): Promise<string>;
  /** Trial berakhir sekarang; dikunci oleh `runLifecycle`. */
  lock(venueId: VenueId): Promise<void>;
  /** Jatuh tempo dihapus sekarang; dihapus oleh `runLifecycle`. */
  remove(venueId: VenueId): Promise<void>;
  block(value: string, note: string): Promise<BlockKind>;
  unblock(value: string): Promise<void>;
  /**
   * Menjalankan siklus hidup sekarang alih-alih menunggu jadwal tiap jam. Hanya mengerjakan apa
   * yang sudah jatuh tempo, sehingga aman dipanggil kapan saja.
   */
  runLifecycle(): Promise<LifecycleRun>;
}

type RequestRow = Database['public']['Functions']['vendor_requests']['Returns'][number];

const isStatus = (value: string): value is TrialRequestStatus =>
  (TRIAL_REQUEST_STATUSES as readonly string[]).includes(value);

function toLead(row: RequestRow): TrialLead {
  if (!isStatus(row.status)) {
    throw new DataError('unknown', { message: `Status permintaan tidak dikenal: ${row.status}` });
  }
  const rejectReason =
    row.reject_reason === 'blocked' || row.reject_reason === 'duplicate' ? row.reject_reason : null;
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    institution: row.institution,
    title: row.title,
    email: row.email,
    phone: row.phone,
    buildingType: row.building_type,
    buildingSize: row.building_size,
    language: row.language,
    status: row.status,
    rejectReason,
    verifiedAt: row.verified_at,
    queuedAt: row.queued_at,
    trial:
      row.venue_id && row.started_at && row.ends_at
        ? {
            venueId: VenueIdSchema.parse(row.venue_id),
            slug: row.slug,
            startedAt: row.started_at,
            endsAt: row.ends_at,
            lockedAt: row.locked_at,
            extendedDays: row.extended_days ?? 0,
            publishedVersions: row.published_versions ?? 0,
            lastPublishedAt: row.last_published_at,
          }
        : null,
  };
}

export function createVendorRepository(db: Db): VendorRepository {
  return {
    async access() {
      const { data, error } = await db.rpc('vendor_access');
      if (error) throw toDataError(error);
      return data === 'ok' || data === 'mfa' ? data : 'denied';
    },

    async capacity() {
      const { data, error } = await db.rpc('vendor_capacity');
      if (error) throw toDataError(error);
      return data;
    },

    async leads() {
      const { data, error } = await db.rpc('vendor_requests');
      if (error) throw toDataError(error);
      return (data ?? []).map(toLead);
    },

    async blocklist() {
      const { data, error } = await db.rpc('vendor_blocklist');
      if (error) throw toDataError(error);
      return (data ?? []).map((row) => ({
        value: row.value,
        kind: row.kind === 'email' ? 'email' : 'domain',
        note: row.note,
        createdAt: row.created_at,
      }));
    },

    async extend(venueId, days) {
      const { data, error } = await db.rpc('vendor_trial_extend', {
        p_venue_id: venueId,
        p_days: days,
      });
      if (error) throw toDataError(error);
      return data;
    },

    async lock(venueId) {
      const { error } = await db.rpc('vendor_trial_lock', { p_venue_id: venueId });
      if (error) throw toDataError(error);
    },

    async remove(venueId) {
      const { error } = await db.rpc('vendor_trial_delete', { p_venue_id: venueId });
      if (error) throw toDataError(error);
    },

    async block(value, note) {
      const { data, error } = await db.rpc('vendor_block', { p_value: value, p_note: note });
      if (error) throw toDataError(error);
      return data === 'email' ? 'email' : 'domain';
    },

    async unblock(value) {
      const { error } = await db.rpc('vendor_unblock', { p_value: value });
      if (error) throw toDataError(error);
    },

    async runLifecycle() {
      // Membalas 500 bila ada langkah yang gagal, tetapi tetap dengan hitungan per langkah.
      const { data, error } = await db.functions.invoke<LifecycleRun>('trial-lifecycle', {
        body: {},
      });
      if (data) return data;
      const context = (error as { context?: unknown } | null)?.context;
      if (context instanceof Response) {
        const body = (await context.json().catch(() => null)) as LifecycleRun | null;
        if (body && typeof body.failed === 'number') return body;
      }
      throw toDataError(error);
    },
  };
}
