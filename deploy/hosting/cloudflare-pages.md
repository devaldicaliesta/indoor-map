# Publish PanduArah ter-hosting di Cloudflare Pages

Bagian dari `deploy/hosting/README.md` (langkah 5–6), dirinci per klik. Prasyarat: project
Supabase sudah berjalan — skema, Edge Functions, rahasia, Auth, Super Admin, lisensi, dan data demo
(langkah 1–4 dan 7 panduan itu).

| Situs | Domain | Project Pages | Status |
| --- | --- | --- | --- |
| Landing | `panduarah.my.id` | yang sudah ada | **perbarui** (env baru + build ulang) |
| Admin | `admin.panduarah.my.id` | baru | **buat** |
| Visitor | `app.panduarah.my.id` | baru | **buat** |
| Vendor (dasbor) | `vendor.panduarah.my.id` | baru | **buat** (langkah 4) |

Keempatnya dibangun dari repo yang sama (`devaldicaliesta/indoor-map`) dan branch **`production`**.
Biaya Rp0 di paket Free: 500 build per bulan, berkas statis tanpa batas bandwidth.

## 0. Bawa kode ke `production`

Cloudflare hanya membangun `production` (`docs/07-aturan-branch.md`). Fitur trial ter-hosting masih
di `feature/trial-hosting`:

1. GitHub → **Pull requests → New**: `develop` ← `feature/trial-hosting`; tunggu CI hijau, merge.
2. PR `main` ← `develop`; CI hijau, merge.
3. Majukan `production`:
   ```sh
   git fetch origin
   git checkout production
   git merge --ff-only origin/main
   git push origin production
   ```
   Push ini memicu build otomatis semua project Pages yang terhubung.

> Sebelum langkah 3, pastikan env di langkah 1–4 di bawah sudah diisi; variabel `VITE_*`
> ditanam saat build, jadi build tanpa env menghasilkan situs yang tidak bisa menghubungi server.

## Nilai yang dipakai semua situs

| Variabel | Nilai | Keterangan |
| --- | --- | --- |
| `NODE_VERSION` | `22` | Sama dengan `.nvmrc` |
| `PNPM_VERSION` | `10.33.0` | Sama dengan `packageManager` di `package.json` |
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_…` | Supabase → Settings → API Keys → *Publishable key*. Aman berada di browser; jangan pernah memakai kunci `sb_secret_…` |

Isi di **Settings → Environment variables → Production**. Tidak perlu `VITE_CAD_CONVERTER_URL`
(kosong = unggah DXF nonaktif; paket hosting tanpa impor CAD).

## 1. Landing — perbarui project yang sudah ada

1. Cloudflare → **Workers & Pages** → project landing → **Settings → Build**: pastikan
   - *Build command*: `pnpm --filter @indoor/landing build`
   - *Build output directory*: `apps/landing/dist`
   - *Root directory*: kosong (root repo)
   - *Production branch*: `production`
2. **Settings → Environment variables → Production** → tambahkan:
   - `VITE_SUPABASE_URL` — form trial mengirim ke Edge Function project ini
   - `VITE_VISITOR_URL` = `https://app.panduarah.my.id` — tombol "Lihat demo"
   - `NODE_VERSION`, `PNPM_VERSION` bila belum ada
3. Build ulang setelah kode baru ada di `production` (langkah 0) atau lewat **Deployments → … →
   Retry deployment**.
4. Periksa:
   - `https://panduarah.my.id/?lang=id` → bagian **Coba gratis 17 hari** tampil.
   - `https://panduarah.my.id/trial/verifikasi/` → "Tautan tidak berlaku" (tanpa token).
   - Form hanya diterima dari `https://panduarah.my.id` (rahasia `TRIAL_ALLOWED_ORIGIN`). Bila
     landing juga dibuka dari `www.` atau `*.pages.dev`, arahkan alamat itu ke
     `panduarah.my.id` (Rules → Redirect Rules) alih-alih melonggarkan rahasianya.

## 2. Admin — project baru

1. **Workers & Pages → Create → Pages → Connect to Git** → pilih `devaldicaliesta/indoor-map`.
2. *Project name* `panduarah-admin`; *Production branch* `production`;
   *Framework preset* **None**; *Build command* `pnpm --filter @indoor/admin build`;
   *Build output directory* `apps/admin/dist`; *Root directory* kosong.
3. *Environment variables*: `NODE_VERSION`, `PNPM_VERSION`, `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` (tabel di atas) → **Save and Deploy**.
4. **Custom domains → Set up a custom domain** → `admin.panduarah.my.id` (DNS di Cloudflare,
   CNAME dibuat otomatis; sertifikat aktif dalam beberapa menit).
5. Periksa: buka `https://admin.panduarah.my.id` → masuk sebagai Super Admin vendor → menu lengkap
   (Lisensi tampil, paket `hosting`). Muat ulang di halaman dalam (mis. `/venues`) tidak 404:
   Admin adalah SPA tanpa `404.html`, jadi Pages menyajikan `index.html`.

> Aman dipublikasikan karena Super Admin sudah ada (README langkah 3): halaman aktivasi tidak
> lagi menerima pembuatan Super Admin pertama.

## 3. Visitor — project baru

Sama dengan Admin, dengan:

- *Project name* `panduarah-visitor`
- *Build command* `pnpm --filter @indoor/visitor build`
- *Build output directory* `apps/visitor/dist`
- Custom domain `app.panduarah.my.id`

Periksa:

- `https://app.panduarah.my.id/v/demo` → peta rumah sakit demo, bisa cari dan rute.
- Pasang ke layar utama HP (PWA), matikan data, buka lagi → peta tetap tampil (offline).
- `https://app.panduarah.my.id/v/slug-tidak-ada` → "Peta belum tersedia".

## 4. Vendor (dasbor) — project baru

Dasbor staf vendor: kapasitas, daftar trial, perpanjang/kunci/hapus, ekspor leads CSV, daftar
blokir. Sama dengan Admin, dengan:

- *Project name* `panduarah-vendor`
- *Build command* `pnpm --filter @indoor/vendor build`
- *Build output directory* `apps/vendor/dist`
- *Environment variables*: `NODE_VERSION`, `PNPM_VERSION`, `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `VITE_VISITOR_URL=https://app.panduarah.my.id` (tautan **Visitor** per trial)
- Custom domain `vendor.panduarah.my.id`

Sebelum dibuka: akun sudah didaftarkan sebagai staf vendor dan TOTP Supabase Auth menyala
(README langkah 3.6 dan 4). Periksa:

- Masuk dengan email + password vendor → **Pasang verifikasi dua langkah** → pindai QR dengan
  aplikasi autentikator → kode → dasbor tampil dengan ringkasan "Slot trial terpakai n/15".
- Keluar, masuk lagi → diminta **kode 6 digit** (bukan QR lagi).
- Masuk dengan akun yang bukan staf vendor → "Akun ini bukan akun staf vendor."
- `apps/vendor/public/_headers` membuat dasbor tidak diindeks dan tidak bisa dibingkai situs lain;
  periksa di DevTools → Network → header `X-Robots-Tag: noindex, nofollow`.

## 5. Hemat kuota build (opsional, disarankan)

Setiap push ke `production` membangun ulang semua project. Batasi lewat **Settings → Build →
Build watch paths** per project:

| Project | Include paths |
| --- | --- |
| Landing | `apps/landing/*`, `packages/*`, `package.json`, `pnpm-lock.yaml` |
| Admin | `apps/admin/*`, `packages/*`, `package.json`, `pnpm-lock.yaml` |
| Visitor | `apps/visitor/*`, `packages/*`, `package.json`, `pnpm-lock.yaml` |
| Vendor | `apps/vendor/*`, `packages/*`, `package.json`, `pnpm-lock.yaml` |

Dan **Settings → Build → Branch control → Preview branches: None**, agar branch lain tidak ikut
dibangun dengan env produksi.

## 6. Setelah semua tayang

1. Uji asap penuh (README langkah 8): minta trial dari landing dengan email sendiri → email
   verifikasi → "Ruang kerja Anda siap" → email "Trial siap" → buat password → Admin trial
   (banner "Trial — sisa 17 hari") → Visitor `/v/<slug>`.
2. Buka dasbor vendor: trial uji tampil di tab **Aktif** → **Hapus** → lead tetap di **Semua leads**
   berstatus "Dihapus" (pengganti README langkah 8.4).

## Masalah umum

| Gejala | Penyebab dan solusi |
| --- | --- |
| Situs tampil tetapi tidak bisa masuk / data kosong | Env `VITE_*` belum diisi saat build. Isi, lalu **Retry deployment** (env tidak berlaku tanpa build ulang) |
| Build gagal `ERR_PNPM_…` / versi pnpm | Isi `PNPM_VERSION=10.33.0` dan `NODE_VERSION=22` |
| Build Visitor gagal "won't be precached" | Bundel melewati batas precache; sudah dinaikkan ke 3 MiB di `apps/visitor/vite.config.ts` — naikkan lagi bila bundel tumbuh |
| Muat ulang halaman dalam → 404 | Ada `404.html` di output; Admin/Visitor tidak boleh punya berkas itu (fallback SPA Pages) |
| Form trial: "Permintaan belum terkirim" | `VITE_SUPABASE_URL` landing salah, atau landing dibuka dari alamat selain `https://panduarah.my.id` (CORS `TRIAL_ALLOWED_ORIGIN`) |
| Tautan "buat password" ditolak | Supabase → Authentication → URL Configuration belum memuat `https://admin.panduarah.my.id/**` |
| Peta baru terbit belum tampil | Cache CDN Storage Supabase ±1–2 menit |
| Dasbor vendor: "Verifikasi dua langkah (TOTP) belum diaktifkan" | Supabase → Authentication → Multi-Factor → TOTP *Enabled* |
| Dasbor vendor: "Akun ini bukan akun staf vendor" | Akun belum ada di `hosting.vendor_staff` atau profilnya nonaktif (README langkah 3.6) |
| Ponsel autentikator hilang | Supabase → Authentication → Users → akun → hapus faktor MFA, lalu daftarkan ulang lewat dasbor |
