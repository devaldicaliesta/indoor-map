import type { PublishFinding, Snapshot, SnapshotDiff, VenueId } from '@indoor/domain';
import { toDataError } from '../errors';
import { fromFunctionError } from '../functions';
import type { Db } from '../supabase';

export interface PublishResult {
  version: number;
  publishedAt: string;
  /** Ukuran snapshot sebelum dikompresi. */
  sizeBytes: number;
}

export interface ActivePublication {
  version: number;
  publishedAt: string;
  publisherName: string | null;
}

export interface PublicationEntry extends ActivePublication {
  notes: string | null;
  origin: 'publish' | 'rollback';
  /** Versi yang diaktifkan kembali oleh rollback. */
  sourceVersion: number | null;
  isActive: boolean;
}

export interface PublicationsRepository {
  /** Versi yang sedang dibaca Visitor; `null` bila venue belum pernah menerbitkan peta. */
  active(venueId: VenueId): Promise<ActivePublication | null>;
  /**
   * Menerbitkan draft venue lewat Edge Function `publish` (hanya Admin dan Super Admin;
   * server menolak role lain).
   */
  publish(venueId: VenueId, notes?: string): Promise<PublishResult>;
  /** Isi versi lama diterbitkan ulang sebagai versi baru (hanya Admin dan Super Admin). */
  rollback(venueId: VenueId, sourceVersion: number, notes?: string): Promise<PublishResult>;
  /** Riwayat versi yang pernah terbit, terbaru lebih dulu. */
  history(venueId: VenueId): Promise<PublicationEntry[]>;
  /**
   * Temuan validasi publish atas draft saat ini (Error memblokir publish, Peringatan tidak).
   * Aturan dijalankan di Edge Function `publish` yang sama dengan `@indoor/domain`.
   */
  validate(venueId: VenueId): Promise<PublishFinding[]>;
  /** Fitur, jalur, lokasi, dan titik asal yang berubah di draft sejak versi aktif. */
  changes(venueId: VenueId): Promise<SnapshotDiff>;
  /** Snapshot draft yang dibangun server di memori untuk preview; tidak disimpan. */
  preview(venueId: VenueId): Promise<Snapshot>;
}

async function release(db: Db, body: Record<string, unknown>): Promise<PublishResult> {
  const { data, error } = await db.functions.invoke<PublishResult>('publish', { body });
  if (error) throw await fromFunctionError(error);
  if (!data) throw toDataError(new Error('Balasan publish kosong.'));
  return data;
}

export function createPublicationsRepository(db: Db): PublicationsRepository {
  return {
    async active(venueId) {
      const { data, error } = await db
        .from('publications')
        .select('version, published_at, publisher:profiles(full_name)')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw toDataError(error);
      if (!data) return null;
      return {
        version: data.version,
        publishedAt: data.published_at,
        publisherName: data.publisher?.full_name ?? null,
      };
    },

    publish(venueId, notes) {
      return release(db, { venueId, notes });
    },

    rollback(venueId, sourceVersion, notes) {
      return release(db, { venueId, mode: 'rollback', sourceVersion, notes });
    },

    async history(venueId) {
      const { data, error } = await db
        .from('publications')
        .select(
          'version, published_at, notes, origin, source_version, is_active, publisher:profiles(full_name)',
        )
        .eq('venue_id', venueId)
        .order('version', { ascending: false });
      if (error) throw toDataError(error);
      // Pesanan yang belum aktif dan lebih baru dari versi aktif belum pernah terbit.
      const active = data.find((row) => row.is_active)?.version ?? 0;
      return data
        .filter((row) => row.is_active || row.version < active)
        .map((row) => ({
          version: row.version,
          publishedAt: row.published_at,
          publisherName: row.publisher?.full_name ?? null,
          notes: row.notes,
          origin: row.origin,
          sourceVersion: row.source_version,
          isActive: row.is_active,
        }));
    },

    async validate(venueId) {
      const { data, error } = await db.functions.invoke<{ findings: PublishFinding[] }>('publish', {
        body: { venueId, mode: 'validate' },
      });
      if (error) throw await fromFunctionError(error);
      if (!data) throw toDataError(new Error('Balasan validasi kosong.'));
      return data.findings;
    },

    async changes(venueId) {
      const { data, error } = await db.functions.invoke<{ changes: SnapshotDiff }>('publish', {
        body: { venueId, mode: 'diff' },
      });
      if (error) throw await fromFunctionError(error);
      if (!data) throw toDataError(new Error('Balasan ringkasan perubahan kosong.'));
      return data.changes;
    },

    async preview(venueId) {
      const { data, error } = await db.functions.invoke<{ snapshot: Snapshot }>('publish', {
        body: { venueId, mode: 'preview' },
      });
      if (error) throw await fromFunctionError(error);
      if (!data) throw toDataError(new Error('Balasan preview kosong.'));
      return data.snapshot;
    },
  };
}
