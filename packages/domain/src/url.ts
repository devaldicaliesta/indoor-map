/**
 * Buang semua garis miring di akhir URL dasar ("https://a.id//" → "https://a.id").
 * Ditulis tanpa regex agar waktunya linear, juga untuk masukan yang sangat panjang (ReDoS).
 */
export function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 47) end -= 1;
  return value.slice(0, end);
}
