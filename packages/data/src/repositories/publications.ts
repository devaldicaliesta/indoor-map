import type { PublishFinding, SnapshotDiff, VenueId } from '@indoor/domain';
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

export interface PublicationsRepository {
  /** Versi yang sedang dibaca Visitor; `null` bila venue belum pernah menerbitkan peta. */
  active(venueId: VenueId): Promise<ActivePublication | null>;
  /**
   * Menerbitkan draft venue lewat Edge Function `publish` (hanya Admin dan Super Admin;
   * server menolak role lain).
   */
  publish(venueId: VenueId): Promise<PublishResult>;
  /**
   * Temuan validasi publish atas draft saat ini (Error memblokir publish, Peringatan tidak).
   * Aturan dijalankan di Edge Function `publish` yang sama dengan `@indoor/domain`.
   */
  validate(venueId: VenueId): Promise<PublishFinding[]>;
  /** Fitur, jalur, lokasi, dan titik asal yang berubah di draft sejak versi aktif. */
  changes(venueId: VenueId): Promise<SnapshotDiff>;
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

    async publish(venueId) {
      const { data, error } = await db.functions.invoke<PublishResult>('publish', {
        body: { venueId },
      });
      if (error) throw await fromFunctionError(error);
      if (!data) throw toDataError(new Error('Balasan publish kosong.'));
      return data;
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
  };
}
