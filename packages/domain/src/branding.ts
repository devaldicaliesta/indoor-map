/**
 * Branding venue untuk Visitor dan Info Point: nama tampilan, warna utama (pengganti --signal),
 * dan warna rute (pengganti --route). Logonya memakai logo venue.
 *
 * Dimuat juga oleh builder snapshot di Edge Function `publish` (Deno), jadi tidak boleh
 * mengimpor apa pun (lihat `snapshot.ts`).
 */

/** Header HP hanya muat sekitar ini sebelum terpotong. */
export const MAX_DISPLAY_NAME_LENGTH = 60;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export interface Branding {
  /** `null` = nama venue. */
  displayName: string | null;
  /** `#rrggbb` huruf kecil; `null` = warna bawaan. */
  primaryColor: string | null;
  routeColor: string | null;
}

export const EMPTY_BRANDING: Branding = Object.freeze({
  displayName: null,
  primaryColor: null,
  routeColor: null,
});

const BRANDING_KEYS = ['displayName', 'primaryColor', 'routeColor'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const tidyName = (value: string) => value.trim().replace(/\s+/g, ' ');
// Dihitung per code point agar huruf di luar BMP tidak terbelah.
const nameLength = (value: string) => Array.from(value).length;

function toColor(value: unknown): string | null {
  return typeof value === 'string' && HEX_COLOR.test(value.trim())
    ? value.trim().toLowerCase()
    : null;
}

/**
 * Membaca jsonb `display_settings.branding` dengan aman: entri yang rusak dibuang per kunci, dan
 * nama yang terlalu panjang (hanya mungkin lewat API langsung) dipotong.
 */
export function parseBranding(value: unknown): Branding {
  if (!isRecord(value)) return EMPTY_BRANDING;
  const name = typeof value.displayName === 'string' ? tidyName(value.displayName) : '';
  return {
    displayName: name
      ? Array.from(name).slice(0, MAX_DISPLAY_NAME_LENGTH).join('').trimEnd()
      : null,
    primaryColor: toColor(value.primaryColor),
    routeColor: toColor(value.routeColor),
  };
}

export type BrandingProblem = 'too_long' | 'invalid_color';

export interface BrandingInput {
  displayName: string;
  primaryColor: string;
  routeColor: string;
}

/** Isian formulir Branding; kosong berarti memakai bawaan. */
export function checkBranding(
  input: BrandingInput,
):
  | { ok: true; value: Branding }
  | { ok: false; problems: Partial<Record<keyof Branding, BrandingProblem>> } {
  const problems: Partial<Record<keyof Branding, BrandingProblem>> = {};
  const name = tidyName(input.displayName);
  if (nameLength(name) > MAX_DISPLAY_NAME_LENGTH) problems.displayName = 'too_long';
  for (const key of ['primaryColor', 'routeColor'] as const) {
    const text = input[key].trim();
    if (text && !toColor(text)) problems[key] = 'invalid_color';
  }
  if (Object.keys(problems).length > 0) return { ok: false, problems };
  return {
    ok: true,
    value: {
      displayName: name || null,
      primaryColor: toColor(input.primaryColor),
      routeColor: toColor(input.routeColor),
    },
  };
}

/** Isi kolom jsonb: kunci kosong tidak disimpan sehingga memakai bawaan. */
export function brandingJson(branding: Branding): Partial<Record<keyof Branding, string>> {
  const json: Partial<Record<keyof Branding, string>> = {};
  for (const key of BRANDING_KEYS) {
    const value = branding[key];
    if (value) json[key] = value;
  }
  return json;
}

/** Nama di header Visitor dan Info Point. */
export function brandDisplayName(
  venueName: string,
  branding: Pick<Branding, 'displayName'> | null | undefined,
): string {
  return branding?.displayName || venueName;
}
