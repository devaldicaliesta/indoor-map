/**
 * Teks untuk pencarian yang tidak peka huruf besar/kecil dan diakritik: huruf kecil,
 * tanpa diakritik, spasi dirapikan. Satu aturan untuk Admin dan indeks pencarian Visitor.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
