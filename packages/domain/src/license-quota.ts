/**
 * Jenis kuota paket yang punya pemakaian berjalan; nama sama dengan kunci `quota` di berkas
 * lisensi. Empat yang pertama selalu ada; sisanya batas tambahan T-504 (kosong = tidak dibatasi).
 * `features` dihitung per lantai dan `publishPerDay` per venue per hari: pemakaiannya adalah
 * yang terbanyak.
 */
export const QUOTA_KINDS = [
  'venues',
  'buildings',
  'floors',
  'infoPoints',
  'locations',
  'originPoints',
  'users',
  'features',
  'storageMb',
  'publishPerDay',
] as const;
export type QuotaKind = (typeof QUOTA_KINDS)[number];

/** Batas per tindakan tanpa pemakaian berjalan: ukuran satu unggahan dan baris satu impor. */
export const LIMIT_KINDS = ['maxUploadMb', 'importRows'] as const;
export type LimitKind = (typeof LIMIT_KINDS)[number];

export const QUOTA_LABELS: Record<QuotaKind, string> = {
  venues: 'Venue',
  buildings: 'Gedung',
  floors: 'Lantai',
  infoPoints: 'Info Point',
  locations: 'Lokasi',
  originPoints: 'Titik asal (QR)',
  users: 'Pengguna Admin',
  features: 'Fitur peta per lantai',
  storageMb: 'Storage (MB)',
  publishPerDay: 'Publish per hari',
};

export const LIMIT_LABELS: Record<LimitKind, string> = {
  maxUploadMb: 'Ukuran satu berkas (MB)',
  importRows: 'Baris per impor',
};

export interface QuotaUsage {
  kind: QuotaKind;
  used: number;
  /** `null` tanpa lisensi berlaku atau bila lisensi tidak membatasinya. */
  quota: number | null;
}

/** Batas per tindakan dari lisensi berlaku; `null` = tidak dibatasi. */
export type LicenseLimits = Record<LimitKind, number | null>;

/** Penambahan berikutnya akan ditolak server. Tanpa lisensi, server menolak lewat aturan lain. */
export const isQuotaFull = (usage: QuotaUsage | undefined): boolean =>
  usage?.quota != null && usage.used >= usage.quota;

/** Awal pesan penolakan; sama dengan pesan server (`app.quota_message`). */
export const quotaReachedPrefix = (trial: boolean) =>
  trial ? 'Batas trial tercapai' : 'Kuota paket tercapai';

/** Pesan pada tombol tambah yang dinonaktifkan karena kuota penuh. */
export function quotaBlockMessage(usage: QuotaUsage, trial: boolean): string {
  return `${quotaReachedPrefix(trial)} (${QUOTA_LABELS[usage.kind]} ${usage.used}/${usage.quota}).`;
}

/** Ukuran berkas melebihi batas unggah lisensi; `null` bila boleh. */
export function uploadTooLarge(
  bytes: number,
  limits: LicenseLimits,
  trial: boolean,
): string | null {
  const limit = limits.maxUploadMb;
  if (limit === null || bytes <= limit * 1024 * 1024) return null;
  const size = (bytes / 1024 / 1024).toFixed(1).replace('.', ',');
  return `${quotaReachedPrefix(trial)}: berkas ${size} MB, paling besar ${limit} MB.`;
}

/** Jumlah baris impor melebihi batas lisensi; `null` bila boleh. */
export function importTooLarge(rows: number, limits: LicenseLimits, trial: boolean): string | null {
  const limit = limits.importRows;
  if (limit === null || rows <= limit) return null;
  return `${quotaReachedPrefix(trial)}: impor ${rows} baris, paling banyak ${limit} baris sekali impor.`;
}

const DAY_MS = 86_400_000;

/** Sisa hari sampai berakhir, dibulatkan ke atas; 0 bila sudah berakhir. */
export function daysRemaining(validUntil: string, now: Date): number {
  return Math.max(0, Math.ceil((Date.parse(validUntil) - now.getTime()) / DAY_MS));
}

/** Lama masa tenggang setelah lisensi berakhir; Admin hanya-baca, Visitor tetap berjalan. */
export const GRACE_DAYS = 14;

export type LicenseNotice =
  | { kind: 'reminder'; days: number }
  | { kind: 'trial'; days: number }
  | { kind: 'grace'; graceEndsAt: string };

/**
 * Banner lisensi di seluruh Admin: pengingat mulai H-30 (makin mendesak di H-7 dan H-1),
 * lalu masa tenggang 14 hari setelah berakhir. Lisensi trial selalu menampilkan sisa harinya.
 * `null` di luar rentang itu.
 */
export function licenseNotice(
  validUntil: string,
  now: Date,
  options: { trial?: boolean } = {},
): LicenseNotice | null {
  const end = Date.parse(validUntil);
  if (now.getTime() < end) {
    const days = daysRemaining(validUntil, now);
    if (options.trial) return { kind: 'trial', days };
    return days <= 30 ? { kind: 'reminder', days } : null;
  }
  const graceEnd = end + GRACE_DAYS * DAY_MS;
  return now.getTime() < graceEnd
    ? { kind: 'grace', graceEndsAt: new Date(graceEnd).toISOString() }
    : null;
}
