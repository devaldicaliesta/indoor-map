import type { AppRole } from './profile';

export const MEDIA_BUCKETS = ['public-assets', 'floor-plans'] as const;
export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

export const MEDIA_KINDS = ['logo', 'photo', 'icon', 'floor_plan'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  logo: 'Logo',
  photo: 'Foto',
  icon: 'Ikon',
  floor_plan: 'Denah',
};

export const MEDIA_USAGE_KINDS = [
  'venue',
  'location',
  'category',
  'facility_type',
  'event',
  'floor',
] as const;
export type MediaUsageKind = (typeof MEDIA_USAGE_KINDS)[number];

export const MEDIA_USAGE_ROLES = [
  'logo',
  'photo',
  'field',
  'icon',
  'image',
  'plan',
  'plan_history',
] as const;
export type MediaUsageRole = (typeof MEDIA_USAGE_ROLES)[number];

export interface MediaUsage {
  kind: MediaUsageKind;
  id: string;
  name: string;
  role: MediaUsageRole;
}

export interface MediaAsset {
  bucket: MediaBucket;
  path: string;
  kind: MediaKind;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  usages: MediaUsage[];
}

/** Folder pertama path `public-assets` (`{folder}/{venue_id}/…`). */
export type AssetFolder = 'venues' | 'locations' | 'categories' | 'facility-types' | 'events';

export function assetFolder(bucket: MediaBucket, path: string): AssetFolder | null {
  if (bucket !== 'public-assets') return null;
  const folder = path.split('/')[0];
  return folder === 'venues' ||
    folder === 'locations' ||
    folder === 'categories' ||
    folder === 'facility-types' ||
    folder === 'events'
    ? folder
    : null;
}

/** Jenis aset dari letak berkasnya; nama berkas logo lokasi dibuat repository (`…-logo-…`). */
export function mediaKindOf(bucket: MediaBucket, path: string): MediaKind {
  if (bucket === 'floor-plans') return 'floor_plan';
  const folder = assetFolder(bucket, path);
  if (folder === 'venues') return 'logo';
  if (folder === 'categories' || folder === 'facility-types') return 'icon';
  if (folder === 'locations' && /-logo-\d+\.[a-z]+$/.test(path)) return 'logo';
  return 'photo';
}

export function mediaFileName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

export function isImageAsset(asset: Pick<MediaAsset, 'mimeType'>): boolean {
  return asset.mimeType.startsWith('image/') && asset.mimeType !== 'image/vnd.dxf';
}

/** Aset yang bisa dipakai ulang sebagai logo/foto lokasi: gambar di folder lokasi venue. */
export function reusableForLocation(asset: MediaAsset): boolean {
  return (
    assetFolder(asset.bucket, asset.path) === 'locations' &&
    ['image/png', 'image/jpeg', 'image/webp'].includes(asset.mimeType)
  );
}

const MANAGERS: readonly AppRole[] = ['super_admin', 'admin'];
const EDITORS: readonly AppRole[] = ['super_admin', 'admin', 'editor'];

/**
 * Role yang boleh menghapus berkas di letak ini, sama dengan policy hapus Storage: ikon jenis
 * fasilitas, logo venue, dan denah hanya Admin; sisanya Editor ke atas.
 */
export function canDeleteMedia(role: AppRole, asset: Pick<MediaAsset, 'bucket' | 'path'>): boolean {
  const folder = assetFolder(asset.bucket, asset.path);
  const managersOnly =
    asset.bucket === 'floor-plans' || folder === 'venues' || folder === 'facility-types';
  return (managersOnly ? MANAGERS : EDITORS).includes(role);
}

const USAGE_LABELS: Record<MediaUsageRole, string> = {
  logo: 'logo',
  photo: 'foto',
  field: 'field kustom',
  icon: 'ikon',
  image: 'gambar',
  plan: 'denah aktif',
  plan_history: 'riwayat denah',
};

const USAGE_OWNERS: Record<MediaUsageKind, string> = {
  venue: 'Venue',
  location: 'Lokasi',
  category: 'Kategori',
  facility_type: 'Jenis fasilitas',
  event: 'Event',
  floor: 'Lantai',
};

/** Contoh: `Lokasi "Apotek" (logo)`. */
export function describeUsage(usage: MediaUsage): string {
  return `${USAGE_OWNERS[usage.kind]} "${usage.name}" (${USAGE_LABELS[usage.role]})`;
}

/** Pesan saat aset terpakai tidak boleh dihapus; paling banyak 3 pemakai disebut. */
export function inUseMessage(usages: readonly MediaUsage[]): string {
  const shown = usages.slice(0, 3).map(describeUsage).join(', ');
  const more = usages.length > 3 ? ` dan ${usages.length - 3} lainnya` : '';
  return `Aset ini masih dipakai ${shown}${more}. Lepaskan dari pemakainya dulu.`;
}

export type MediaUsageFilter = 'all' | 'used' | 'unused';

export interface MediaQuery {
  q: string;
  kinds: readonly MediaKind[];
  usage: MediaUsageFilter;
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Cari di nama berkas dan nama pemakai; filter jenis dan terpakai/tidak. */
export function filterMedia(assets: readonly MediaAsset[], query: MediaQuery): MediaAsset[] {
  const words = normalize(query.q).split(/\s+/).filter(Boolean);
  return assets.filter((asset) => {
    if (query.kinds.length > 0 && !query.kinds.includes(asset.kind)) return false;
    if (query.usage === 'used' && asset.usages.length === 0) return false;
    if (query.usage === 'unused' && asset.usages.length > 0) return false;
    if (words.length === 0) return true;
    const text = normalize([asset.fileName, ...asset.usages.map((u) => u.name)].join(' '));
    return words.every((word) => text.includes(word));
  });
}
