# T-319 · Peta dasar opsional — bukti E2E

Spec: `e2e/tests/admin/verify/T-319-basemap.spec.ts` (fixture `publishedVenue`, role Super Admin; pengaturan dikembalikan di akhir test). Hasil: **lulus 3 run beruntun** (2026-10-03).

| Gambar | Langkah |
| --- | --- |
| [01](01-validasi.png) | Pengaturan → Sistem → "Peta dasar (opsional)": URL tanpa `{y}` ditolak "URL tile harus memuat {z}, {x}, dan {y}.", atribusi wajib bila URL diisi |
| [02](02-visitor-dengan-peta-dasar.png) | Setelah publish: Visitor meminta tile `https://tile.peta-uji.test/{z}/{x}/{y}.png` (dilayani tile palsu lewat `page.route`, lingkungan tanpa internet) di bawah lantai; atribusi "© Peta Uji" di kiri bawah |
| [03](03-visitor-tanpa-internet.png) | Server tile tidak terjangkau: peta gedung, label, dan pencarian tetap berjalan; latar polos menggantikan tile |

Kosong (bawaan) = tanpa peta dasar dan tanpa permintaan keluar. Diuji unit: `checkBasemapTileUrl` (domain), validasi formulir (Admin), `setBasemap` (map-core, layer raster di bawah lantai, diganti tanpa menumpuk, `null` melepas), snapshot dengan/tanpa `basemap` (domain).

## Temuan

- Galat sintaks di Edge Function (`settings` dideklarasikan dua kali) lolos `pnpm check` karena kode Deno tidak ikut typecheck; ketahuan dari E2E (worker gagal boot). Usul: tambahkan `deno check` untuk `supabase/functions/` di CI bila Deno tersedia.
- Editor peta belum menampilkan peta dasar: pengaturan sistem hanya bisa dibaca Super Admin. Bisa menyusul lewat RPC baca-saja seperti `public_visitor_url`.
