// Dipakai juga Edge Function `publish` (Deno): tanpa impor, tanpa zod.

export type BasemapUrlProblem = 'invalid' | 'not_https' | 'missing_placeholders';

interface ParsedUrl {
  protocol: string;
  hostname: string;
}

// URL ada di semua runtime target, tetapi tipenya di lib DOM yang tidak dipakai paket domain.
const UrlConstructor = (globalThis as unknown as { URL: new (value: string) => ParsedUrl }).URL;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** URL tile peta dasar: https (http hanya localhost) dengan placeholder `{z}`, `{x}`, dan `{y}`. */
export function checkBasemapTileUrl(value: string): BasemapUrlProblem | null {
  let url: ParsedUrl;
  try {
    url = new UrlConstructor(value);
  } catch {
    return 'invalid';
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname))) {
    return url.protocol === 'http:' ? 'not_https' : 'invalid';
  }
  return ['{z}', '{x}', '{y}'].every((p) => value.includes(p)) ? null : 'missing_placeholders';
}

/**
 * Atribusi ditampilkan MapLibre sebagai HTML di Visitor publik: karakter HTML di-escape agar
 * isian Pengaturan Sistem tidak bisa menyisipkan markup atau skrip.
 */
export function escapeAttribution(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
