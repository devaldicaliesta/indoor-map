/** Jenis kuota paket; nama sama dengan kunci `quota` di berkas lisensi. */
export const QUOTA_KINDS = ['venues', 'buildings', 'floors', 'infoPoints'] as const;
export type QuotaKind = (typeof QUOTA_KINDS)[number];

export const QUOTA_LABELS: Record<QuotaKind, string> = {
  venues: 'Venue',
  buildings: 'Gedung',
  floors: 'Lantai',
  infoPoints: 'Info Point',
};

export interface QuotaUsage {
  kind: QuotaKind;
  used: number;
  /** `null` tanpa lisensi berlaku. */
  quota: number | null;
}

/** Penambahan berikutnya akan ditolak server. Tanpa lisensi, server menolak lewat aturan lain. */
export const isQuotaFull = (usage: QuotaUsage | undefined): boolean =>
  usage?.quota != null && usage.used >= usage.quota;

const DAY_MS = 86_400_000;

/** Sisa hari sampai berakhir, dibulatkan ke atas; 0 bila sudah berakhir. */
export function daysRemaining(validUntil: string, now: Date): number {
  return Math.max(0, Math.ceil((Date.parse(validUntil) - now.getTime()) / DAY_MS));
}
