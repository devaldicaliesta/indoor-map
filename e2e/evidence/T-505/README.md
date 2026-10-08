# T-505 · Landing page dan form permintaan trial — bukti

Spec: `e2e/tests/landing/T-505-landing.spec.ts` (proyek Playwright `landing`; hanya server landing
yang dinyalakan bila dijalankan sendiri: `pnpm --filter @indoor/e2e exec playwright test --project=landing`).
Hasil: **5 lulus** (2026-10-08). Integrasi `packages/data/test/integration/trial-request.test.ts`: 3 lulus.

| Gambar | Isi | TC |
| --- | --- | --- |
| [01](01-desktop-id.png), [02](02-desktop-id-penuh.png) | Desktop 1280 × 800 ID: hero dengan video motion graphic, seluruh bagian | TC-LND-01 |
| [03](03-desktop-en.png) | Ganti ke English tanpa muat ulang | TC-LND-01 |
| [04](04-hp-en.png), [05](05-hp-id-penuh.png) | HP 360 px EN (pilihan diingat) dan ID, tanpa geser ke samping | TC-LND-01 |
| [06](06-demo-konser-3d.png), [07](07-demo-konser-l2.png) | Peta 3D interaktif konser stadion dengan orang mini; ganti ke L2 | — |
| [08](08-demo-rumah-sakit.png) | Peta 3D rumah sakit (venue berganti, orang mini dimatikan lalu dinyalakan) | — |
| [09](09-form-galat.png) | Isian wajib kosong, email salah, durasi 31 hari, tanpa persetujuan: pesan per kolom, fokus ke kolom pertama | TC-LND-03 |
| [10](10-form-terisi.png), [11](11-form-terkirim.png) | Form sah terkirim; email vendor dan konfirmasi pemohon diperiksa di Mailpit | TC-LND-02 |
| [12](12-privasi-id.png) | Kebijakan privasi dari tautan form, ID lalu EN | TC-LND-08 |

## Langkah manual

- **TC-LND-06 Lighthouse mobile** (build produksi `vite preview`, Lighthouse 12, Chromium Playwright):
  beranda performa **97**, aksesibilitas **100**, best practices 100, SEO 100 (LCP 2,1 s, TBT 50 ms,
  CLS 0); privasi 99 / 100 / 100 / 100. Laporan: [beranda](lighthouse-mobile-beranda.html),
  [privasi](lighthouse-mobile-privasi.html).
- **TC-LND-07 rahasia SMTP**: `grep -rliE "TRIAL_SMTP|smtp_password|App Password|SUPABASE_SERVICE_ROLE"`
  di `apps/landing/dist` dan `apps/landing/src` kosong; password SMTP hanya di rahasia server vendor
  (`supabase secrets set`, lihat `apps/landing/README.md`). Lokal memakai Mailpit tanpa password.
- **TC-LND-04/05** (honeypot, > 5 kiriman per menit per IP, `\r\nBcc:` dan HTML) diuji di integrasi
  `trial-request.test.ts` terhadap fungsi sungguhan dan Mailpit.
