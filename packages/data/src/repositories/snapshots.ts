import { parseSnapshot, type Snapshot, type VenueId } from '@indoor/domain';
import { DataError } from '../errors';
import type { Db } from '../supabase';

const SNAPSHOTS_BUCKET = 'snapshots';
const ASSETS_BUCKET = 'public-assets';

/** Bacaan Visitor: snapshot published dan aset publik, tanpa login. */
export interface SnapshotsRepository {
  /** URL publik `latest.json` venue; service worker Visitor meng-cache URL ini. */
  latestUrl(venueId: VenueId): string;
  /** Snapshot versi published terbaru, sudah diperiksa terhadap skemanya. */
  latest(venueId: VenueId): Promise<Snapshot>;
  /** URL publik logo, foto, atau ikon dari path yang tercatat di snapshot. */
  assetUrl(path: string): string;
}

/** Kode `DataError` saat layanan Visitor dihentikan karena lisensi. */
export const SERVICE_INACTIVE = 'service_inactive';

export function createSnapshotsRepository(db: Db): SnapshotsRepository {
  const latestUrl = (venueId: VenueId) =>
    db.storage.from(SNAPSHOTS_BUCKET).getPublicUrl(`${venueId}/latest.json`).data.publicUrl;

  return {
    latestUrl,

    async latest(venueId) {
      let response: Response;
      try {
        // Selalu ditanyakan ulang ke server (ETag): proxy on-premise bisa membuang header
        // `no-cache` dari Storage dan membuat browser memakai versi lama setelah publish.
        response = await fetch(latestUrl(venueId), { cache: 'no-cache' });
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
        return parseSnapshot(body);
      } catch (cause) {
        throw new DataError('invalid', {
          message: 'Data peta tidak bisa dibaca. Muat ulang halaman.',
          cause,
        });
      }
    },

    assetUrl(path) {
      return db.storage.from(ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;
    },
  };
}
