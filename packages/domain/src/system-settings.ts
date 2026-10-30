import type { LanguageCode } from './language';

/** Password SMTP tidak pernah disimpan di sini. */
export interface SystemSettings {
  publicVisitorUrl: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUsername: string | null;
  smtpFrom: string | null;
  defaultTimezone: string;
  defaultLanguage: LanguageCode;
  /** URL tile XYZ peta dasar (`{z}/{x}/{y}`); `null` = tanpa peta dasar, Visitor tetap offline. */
  basemapTileUrl: string | null;
  /** Atribusi wajib penyedia tile, misalnya "© OpenStreetMap contributors". */
  basemapAttribution: string | null;
  /** Masa simpan log audit dalam hari; peristiwa yang lebih tua dihapus server tiap hari. */
  auditRetentionDays: number;
  updatedAt: string;
}

export type SystemSettingsPatch = Partial<Omit<SystemSettings, 'updatedAt'>>;

export type VisitorUrlProblem = 'invalid' | 'not_https' | 'trailing_slash' | 'has_query';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

interface ParsedUrl {
  protocol: string;
  hostname: string;
  search: string;
  hash: string;
}

// URL ada di semua runtime target (browser, Node, Deno), tetapi tipenya di lib DOM yang
// sengaja tidak dipakai paket domain; cukup anggota yang dibutuhkan.
const UrlConstructor = (globalThis as unknown as { URL: new (value: string) => ParsedUrl }).URL;

/**
 * URL publik Visitor dipakai di semua QR dan tautan bagikan: harus https dan tanpa `/`
 * di akhir. http hanya diizinkan untuk localhost (pengujian lokal).
 */
export function checkPublicVisitorUrl(value: string): VisitorUrlProblem | null {
  let url: ParsedUrl;
  try {
    url = new UrlConstructor(value);
  } catch {
    return 'invalid';
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname))) {
    return url.protocol === 'http:' ? 'not_https' : 'invalid';
  }
  if (value.endsWith('/')) return 'trailing_slash';
  if (url.search || url.hash) return 'has_query';
  return null;
}

export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** Zona waktu Indonesia tampil lebih dulu di pilihan zona waktu. */
export const PREFERRED_TIMEZONES = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'] as const;

/** Batas masa simpan log audit; sama dengan CHECK di database (migrasi 0057). */
export const AUDIT_RETENTION_DAYS = { min: 30, max: 3650, default: 365 } as const;

export function isValidAuditRetentionDays(days: number): boolean {
  return (
    Number.isInteger(days) && days >= AUDIT_RETENTION_DAYS.min && days <= AUDIT_RETENTION_DAYS.max
  );
}
