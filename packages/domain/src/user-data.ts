/**
 * Nama berkas export data akun (hak akses subjek data UU PDP), mis.
 * `data-akun-budi-rs-harapan-id-2026-10-30.json`. Hanya huruf kecil, angka, dan `-` agar aman
 * di semua sistem berkas; tanggal diambil dari waktu export server (ISO 8601).
 */
export function userDataExportFilename(email: string, exportedAt: string): string {
  const name =
    email
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'pengguna';
  const date = /^\d{4}-\d{2}-\d{2}/.exec(exportedAt)?.[0];
  return date ? `data-akun-${name}-${date}.json` : `data-akun-${name}.json`;
}
