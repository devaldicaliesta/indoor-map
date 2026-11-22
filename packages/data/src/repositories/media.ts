import {
  inUseMessage,
  isImageAsset,
  libraryFileName,
  MAX_IMAGE_BYTES,
  MEDIA_BUCKETS,
  MEDIA_USAGE_KINDS,
  MEDIA_USAGE_ROLES,
  type MediaAsset,
  type MediaBucket,
  type MediaUsage,
  mediaFileName,
  mediaKindOf,
  type VenueId,
} from '@indoor/domain';
import { DataError, toDataError } from '../errors';
import type { Db } from '../supabase';

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const SIGNED_URL_SECONDS = 60 * 60;

interface MediaRow {
  bucket: string;
  path: string;
  size_bytes: number;
  mime_type: string;
  created_at: string;
  usages: unknown;
}

const isBucket = (value: string): value is MediaBucket =>
  (MEDIA_BUCKETS as readonly string[]).includes(value);

function usagesOf(value: unknown): MediaUsage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const { kind, id, name, role } = item as Record<string, unknown>;
    if (
      typeof kind !== 'string' ||
      typeof role !== 'string' ||
      typeof id !== 'string' ||
      !(MEDIA_USAGE_KINDS as readonly string[]).includes(kind) ||
      !(MEDIA_USAGE_ROLES as readonly string[]).includes(role)
    ) {
      return [];
    }
    return [
      {
        kind: kind as MediaUsage['kind'],
        id,
        name: typeof name === 'string' ? name : '',
        role: role as MediaUsage['role'],
      },
    ];
  });
}

export function mapMediaRow(row: MediaRow): MediaAsset | null {
  if (!isBucket(row.bucket)) return null;
  return {
    bucket: row.bucket,
    path: row.path,
    kind: mediaKindOf(row.bucket, row.path),
    fileName: mediaFileName(row.path),
    sizeBytes: Number(row.size_bytes) || 0,
    mimeType: row.mime_type,
    createdAt: row.created_at,
    usages: usagesOf(row.usages),
  };
}

export interface MediaRepository {
  /** Semua berkas venue di pustaka media beserta pemakaiannya (`media_assets`). */
  list(venueId: VenueId): Promise<MediaAsset[]>;
  /**
   * Mengunggah gambar ke pustaka (folder lokasi venue, agar bisa dipakai sebagai logo atau foto
   * lokasi). Mengembalikan path berkas.
   */
  upload(venueId: VenueId, file: Blob): Promise<string>;
  /**
   * Menghapus aset yang tidak terpakai. Server menolak aset terpakai lewat policy Storage;
   * galatnya menyebut pemakainya.
   */
  remove(venueId: VenueId, asset: Pick<MediaAsset, 'bucket' | 'path'>): Promise<void>;
  /** URL pratinjau gambar: publik untuk `public-assets`, bertanda untuk denah (bucket privat). */
  previewUrls(assets: readonly MediaAsset[]): Promise<Map<string, string>>;
}

export function createMediaRepository(db: Db): MediaRepository {
  async function list(venueId: VenueId) {
    const { data, error } = await db.rpc('media_assets', { p_venue_id: venueId });
    if (error) throw toDataError(error);
    return (data as MediaRow[]).flatMap((row) => mapMediaRow(row) ?? []);
  }

  return {
    list,

    async upload(venueId, file) {
      const extension = IMAGE_EXTENSIONS[file.type];
      if (!extension) {
        throw new DataError('invalid', { message: 'Gambar harus berupa PNG, JPG, atau WebP.' });
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new DataError('invalid', { message: 'Gambar terlalu besar. Maksimal 5 MB.' });
      }
      const name = file instanceof File ? file.name : '';
      const path = `locations/${venueId}/${libraryFileName(name, globalThis.crypto.randomUUID(), extension)}`;
      const { error } = await db.storage
        .from('public-assets')
        .upload(path, file, { contentType: file.type });
      if (error) throw toDataError(error);
      return path;
    },

    async remove(venueId, asset) {
      const { data, error } = await db.storage.from(asset.bucket).remove([asset.path]);
      if (error) throw toDataError(error);
      if (data?.length) return;
      // Storage tidak memberi galat saat policy menolak; baris yang terhapus kosong.
      const current = (await list(venueId)).find(
        (a) => a.bucket === asset.bucket && a.path === asset.path,
      );
      if (!current) throw new DataError('not_found', { message: 'Aset sudah tidak ada.' });
      if (current.usages.length) {
        throw new DataError('conflict', { message: inUseMessage(current.usages) });
      }
      throw new DataError('forbidden', {
        message: 'Role Anda tidak boleh menghapus aset jenis ini.',
      });
    },

    async previewUrls(assets) {
      const urls = new Map<string, string>();
      const plans: string[] = [];
      for (const asset of assets) {
        if (!isImageAsset(asset)) continue;
        if (asset.bucket === 'public-assets') {
          urls.set(
            asset.path,
            db.storage.from('public-assets').getPublicUrl(asset.path).data.publicUrl,
          );
        } else {
          plans.push(asset.path);
        }
      }
      if (plans.length) {
        const { data } = await db.storage
          .from('floor-plans')
          .createSignedUrls(plans, SIGNED_URL_SECONDS);
        for (const item of data ?? []) {
          if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
        }
      }
      return urls;
    },
  };
}
