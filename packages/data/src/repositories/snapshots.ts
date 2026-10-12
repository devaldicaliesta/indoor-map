import {
  parsePublishedGraph,
  parsePublishedSnapshot,
  SlugPointerSchema,
  type Snapshot,
  type SnapshotGraph,
  type VenueId,
  type VenueSlug,
  withGraph,
} from '@indoor/domain';
import { DataError } from '../errors';
import type { Db } from '../supabase';

const SNAPSHOTS_BUCKET = 'snapshots';
const ASSETS_BUCKET = 'public-assets';

/** Bacaan Visitor: snapshot published dan aset publik, tanpa login. */
export interface SnapshotsRepository {
  /** URL publik `latest.json` venue; service worker Visitor meng-cache URL ini. */
  latestUrl(venueId: VenueId): string;
  /**
   * Snapshot versi published terbaru, sudah diperiksa terhadap skemanya. `prefetched`: respons
   * `latestUrl` yang sudah diminta lebih awal (mis. dari HTML Visitor), dipakai alih-alih fetch baru.
   */
  latest(venueId: VenueId, prefetched?: Promise<Response>): Promise<Snapshot>;
  /**
   * Graf jalur yang dirujuk `snapshot.graphPath`. Berkasnya tetap per versi, jadi cache browser
   * dan service worker boleh memakainya tanpa bertanya ulang.
   */
  graph(venueId: VenueId, graphPath: string): Promise<SnapshotGraph>;
  /** Snapshot terbaru beserta grafnya (untuk alat dan test yang memeriksa jalur). */
  latestWithGraph(venueId: VenueId): Promise<Snapshot>;
  /** URL publik logo, foto, atau ikon dari path yang tercatat di snapshot. */
  assetUrl(path: string): string;
  /** URL publik penunjuk `slugs/{slug}.json`; service worker Visitor meng-cache URL ini. */
  slugPointerUrl(slug: VenueSlug): string;
  /**
   * Id venue pemilik slug, dari penunjuk yang ditulis setiap publish (`/v/<slug>`).
   * `prefetched`: respons `slugPointerUrl` yang sudah diminta dari HTML Visitor.
   */
  venueIdForSlug(slug: VenueSlug, prefetched?: Promise<Response>): Promise<VenueId>;
}

/** Kode `DataError` saat layanan Visitor dihentikan karena lisensi. */
export const SERVICE_INACTIVE = 'service_inactive';

export function createSnapshotsRepository(db: Db): SnapshotsRepository {
  const latestUrl = (venueId: VenueId) =>
    db.storage.from(SNAPSHOTS_BUCKET).getPublicUrl(`${venueId}/latest.json`).data.publicUrl;

  const slugPointerUrl = (slug: VenueSlug) =>
    db.storage.from(SNAPSHOTS_BUCKET).getPublicUrl(`slugs/${slug}.json`).data.publicUrl;

  return {
    latestUrl,
    slugPointerUrl,

    async latest(venueId, prefetched) {
      let response: Response;
      try {
        // Selalu ditanyakan ulang ke server (ETag): proxy on-premise bisa membuang header
        // `no-cache` dari Storage dan membuat browser memakai versi lama setelah publish.
        response = await (prefetched ?? fetch(latestUrl(venueId), { cache: 'no-cache' }));
      } catch (cause) {
        throw new DataError('network', { cause });
      }
      // Storage membalas 400 atau 404 untuk objek yang belum ada, tergantung versinya.
      if (response.status === 400 || response.status === 404) {
        throw new DataError('not_found', { message: 'Venue ini belum menerbitkan peta.' });
      }
      if (!response.ok) {
        throw new DataError('unknown', { message: `Peta tidak bisa dimuat (${response.status}).` });
      }
      const body: unknown = await response.json().catch(() => null);
      // Lisensi kedaluwarsa atau dicabut: server mengganti latest.json dengan penanda ini (T-406).
      if (typeof body === 'object' && body !== null && 'serviceInactive' in body) {
        throw new DataError('forbidden', {
          code: SERVICE_INACTIVE,
          message: 'Layanan peta tidak aktif.',
        });
      }
      try {
        return parsePublishedSnapshot(body);
      } catch (cause) {
        throw new DataError('invalid', {
          message: 'Data peta tidak bisa dibaca. Muat ulang halaman.',
          cause,
        });
      }
    },

    async graph(venueId, graphPath) {
      const graphUrl = db.storage.from(SNAPSHOTS_BUCKET).getPublicUrl(`${venueId}/${graphPath}`)
        .data.publicUrl;
      let response: Response;
      try {
        response = await fetch(graphUrl);
      } catch (cause) {
        throw new DataError('network', { cause });
      }
      if (!response.ok) {
        throw new DataError('unknown', {
          message: `Jalur rute tidak bisa dimuat (${response.status}).`,
        });
      }
      try {
        return parsePublishedGraph(await response.json());
      } catch (cause) {
        throw new DataError('invalid', { message: 'Data jalur rute tidak bisa dibaca.', cause });
      }
    },

    async latestWithGraph(venueId) {
      const snapshot = await this.latest(venueId);
      return snapshot.graphPath
        ? withGraph(snapshot, await this.graph(venueId, snapshot.graphPath))
        : snapshot;
    },

    assetUrl(path) {
      return db.storage.from(ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;
    },

    async venueIdForSlug(slug, prefetched) {
      let response: Response;
      try {
        // Diperiksa ulang ke server: slug bisa berpindah venue setelah publish berikutnya.
        response = await (prefetched ?? fetch(slugPointerUrl(slug), { cache: 'no-cache' }));
      } catch (cause) {
        throw new DataError('network', { cause });
      }
      if (response.status === 400 || response.status === 404) {
        throw new DataError('not_found', { message: 'Alamat peta ini tidak ditemukan.' });
      }
      if (!response.ok) {
        throw new DataError('unknown', { message: `Peta tidak bisa dimuat (${response.status}).` });
      }
      const pointer = SlugPointerSchema.safeParse(await response.json().catch(() => null));
      if (!pointer.success) {
        throw new DataError('invalid', { message: 'Alamat peta ini tidak bisa dibaca.' });
      }
      return pointer.data.venueId;
    },
  };
}
