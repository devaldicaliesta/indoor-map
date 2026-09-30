import { z } from 'zod';

export const LANGUAGE_CODES = ['id', 'en'] as const;
export const LanguageCodeSchema = z.enum(LANGUAGE_CODES);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

function toLanguageCode(tag: string | null | undefined): LanguageCode | null {
  const base = tag?.trim().toLowerCase().split(/[-_]/)[0];
  const parsed = LanguageCodeSchema.safeParse(base);
  return parsed.success ? parsed.data : null;
}

/**
 * Pilihan pengunjung yang tersimpan, lalu bahasa perangkat (urut preferensi),
 * lalu bahasa default venue/instalasi.
 */
export function resolveLanguage(
  stored: string | null,
  deviceLanguages: readonly string[],
  fallback: LanguageCode,
): LanguageCode {
  return (
    toLanguageCode(stored) ??
    deviceLanguages.map(toLanguageCode).find((code) => code !== null) ??
    fallback
  );
}
