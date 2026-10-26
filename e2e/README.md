# Test E2E (Playwright)

Test end-to-end untuk lima alur utama (`docs/06-alur-kerja.md` "Strategi test"). Panduan menulis dan menjalankan test ada di `.claude/agents/e2e-runner.md`.

## Persiapan

1. `.env.local` di root berisi `SEED_ADMIN_PASSWORD`, `VITE_SUPABASE_URL`, dan `VITE_SUPABASE_ANON_KEY` (salin dari `.env.example`).
2. `supabase start`, lalu `pnpm db:reset` agar akun seed per role dibuat dengan password `SEED_ADMIN_PASSWORD`: `admin@local.test` (Super Admin), `pengelola@local.test` (Admin), `editor@local.test`, `operator@local.test`, `viewer@local.test`.
3. Browser: di lingkungan cloud Chromium sudah terpasang (`PLAYWRIGHT_BROWSERS_PATH`). Di mesin lain jalankan `pnpm --filter @indoor/e2e exec playwright install chromium`. Versi `@playwright/test` dikunci sama dengan browser di lingkungan cloud; naikkan keduanya bersamaan.

## Menjalankan

```bash
pnpm test:e2e                                        # dari root; server Admin (5173) dan Visitor (5174) dijalankan otomatis
pnpm --filter @indoor/e2e exec playwright show-report
```

Artefak test yang gagal (screenshot, video, trace) ada di `e2e/test-results/`, laporan HTML di `e2e/playwright-report/`.

## Isi

| Test | Yang dibuktikan |
| --- | --- |
| `tests/admin/login.spec.ts` | Tiap role masuk ke berandanya lalu keluar; password salah ditolak; halaman Admin tanpa sesi diarahkan ke login dan kembali setelah masuk |
| `tests/admin/draw-unit.spec.ts` | Editor menggambar poligon: unit tersimpan di server dengan kode otomatis dan tetap ada setelah muat ulang; Viewer tidak bisa menggambar |
| `tests/visitor/search.spec.ts` | Di HP 360 px: "radilogi" menemukan Radiologi, detail dibuka, kode lokasi dan kode unit bisa dicari; kategori menampilkan anggotanya; direktori A–Z membuka detail; mengetuk unit di peta membuka detailnya (unit tanpa lokasi hanya kodenya). Venue uji diterbitkan lewat Edge Function `publish` |
| `tests/visitor/language.spec.ts` | Perangkat berbahasa Inggris membuka Visitor dalam bahasa Inggris (`<html lang>`, label, jumlah hasil); memilih Bahasa Indonesia langsung berlaku dan tetap setelah muat ulang |
| `tests/visitor-nowebgl/T-512-no-webgl.spec.ts` | Proyek `visitor-nowebgl` (Chromium `--disable-webgl --disable-3d-apis`): Visitor HP dan Info Point tanpa peta menampilkan "Perangkat ini tidak mendukung peta"; cari Radiologi, rute dari QR titik asal atau "Saya di sini", mode langkah, dan QR "Lanjutkan di HP" tetap jalan; tanpa layar galat dan tanpa pilihan "Ketuk di peta" |
| `tests/vendor/T-617-vendor-dashboard.spec.ts` | Dasbor vendor (`pnpm --filter @indoor/vendor dev`, port 5176): staf vendor memasang 2FA TOTP sungguhan, lalu perpanjang, kunci, hapus (lewat Edge Function `trial-lifecycle`), ekspor leads CSV, daftar blokir, masuk ulang dengan kode, keluar otomatis; akun bukan staf ditolak |

Setiap test membuat venue uji sendiri (`E2E …`) lewat fixture dan menghapusnya di akhir.
