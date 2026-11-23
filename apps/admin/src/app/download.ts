/** Nama berkas aman dari teks bebas (tanpa diakritik, huruf kecil, tanda hubung). */
export const fileSlug = (text: string, fallback = 'peta') =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || fallback;

/** Mengunduh blob sebagai berkas di browser. */
export function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
