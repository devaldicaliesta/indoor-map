# PROGRESS

Papan status proyek. Agen membaca file ini di awal sesi dan memperbaruinya di akhir sesi (lihat `06-alur-kerja.md`).

Status: `siap` · `menunggu` · `dikerjakan` · `review` · `selesai` · `diblokir`

**Rilis aktif:** R0 Fondasi
**Task berikutnya:** T-114

## R0 · Fondasi (`10-R0-fondasi.md`)

| Task | Judul | Bergantung pada | Status | Catatan |
| --- | --- | --- | --- | --- |
| T-001 | Monorepo dan tooling | – | review | pnpm + Turborepo + Biome + Vitest + TS 7; CI & template PR. Kriteria "CI hijau di PR" menunggu PR pertama |
| T-002 | Scaffold aplikasi Admin dan Visitor | T-001 | review | Vite 8 + React 19 + React Router 8; Admin 5173, Visitor 5174 |
| T-003 | Kerangka paket bersama | T-001 | review | 5 paket `@indoor/*` (exports ke src); batas impor di Biome |
| T-004 | Supabase lokal dan skema inti | T-001 | review | Migrasi 0001, seed, 14 uji pgTAP lulus; diverifikasi dengan Docker di lingkungan cloud |
| T-005 | Lapisan data | T-003, T-004 | review | Repository profiles & systemSettings, DataError, helper GeoJSON; 25 unit + 7 integrasi lulus |
| T-006 | Sistem desain | T-003 | review | Tailwind 4 + token, font lokal, 15 komponen, galeri `/_ui` (dev); 19 uji kontras lulus |
| T-007 | Kerangka Admin | T-002, T-005, T-006 | review | Layout, menu per role dari `permissions.ts`, pemilih venue (Zustand), guard sesi; diuji di browser dengan 5 akun seed |
| T-008 | Login, logout, reset password | T-007 | review | Auth Hook penguncian (migrasi 0002), sesi idle 60 menit, reset lewat email; diuji di browser + Mailpit |
| T-009a | Peta aksi per role dan pgTAP per role | T-008 | review | `can(role, action)` + 20 uji pgTAP (venues, features, closures, profiles) untuk 5 role |
| T-009b | Halaman Pengguna, Edge Function `admin-users`, `<Can>` | T-009a | review | Undang/ubah role/nonaktifkan; guard Super Admin terakhir + audit (migrasi 0003); diuji browser, 2 test integrasi, 7 pgTAP |
| T-010 | Pengaturan sistem | T-009 | review | Tab Sistem, password SMTP di Vault, email uji lewat Edge Function; diuji browser + Mailpit. Lihat pertanyaan terbuka soal SMTP GoTrue |
| T-011 | Kerangka Visitor | T-002, T-006 | review | Layout HP/desktop, bottom sheet 3 tinggi (drag + keyboard), i18next ID/EN, PWA installable; tanpa cookie & request pihak ketiga |
| T-012 | Catatan peristiwa penting | T-009 | review | Tab Catatan (Super Admin), 200 terakhir + filter; login, gagal masuk, role, nonaktif, pengaturan tercatat |

## R1 · Inti peta (`11-R1-inti-peta.md`)

| Task | Judul | Bergantung pada | Status | Catatan |
| --- | --- | --- | --- | --- |
| T-104 | Fondasi peta (map-core) | T-003, T-006 | review | Style tanpa basemap, layer 2D/3D, ganti lantai lewat satu source, MapControls; `/_map` (dev) di Admin & Visitor. Ganti lantai 1.000 fitur 102–204 ms di WebGL perangkat lunak — perlu diukur ulang di perangkat dengan GPU |
| T-101 | Venue dan multi-venue | R0 | review | CRUD venue, logo ke `public-assets` (migrasi 0005), waktu dalam zona venue, hapus dengan ketik ulang nama; 4 test integrasi + browser |
| T-102 | Gedung dan Area Luar | T-101, T-104 | review | Tab Gedung (tabel, footprint digambar terra-draw, default), Area Luar dijaga trigger (migrasi 0006); 2 integrasi + 3 pgTAP + browser |
| T-103 | Lantai dan default tampilan | T-102 | review | Sheet lantai per gedung, level negatif, konfirmasi hapus dengan jumlah fitur, lantai default, `FloorSwitcher`, `initialFloorView` |
| T-105 | Unggah denah PNG/JPG/PDF | T-103 | review | |
| T-106 | Georeferensi dan opasitas | T-105 | review | |
| T-107 | Lapisan acuan lantai lain | T-106 | review | |
| T-108 | Editor: kanvas, alat gambar, draft | T-104, T-106 | review | model besar |
| T-109 | Jenis fitur dan atribut unit | T-108 | review | |
| T-110 | Edit geometri, multi-select, snapping | T-109 | review | |
| T-111 | Undo/redo | T-110 | review | |
| T-112 | Fasilitas dan jenis fasilitas | T-109 | review | Tab Pengaturan → Jenis fasilitas, 14 piktogram bawaan, ikon unggahan SVG/PNG, sprite + layer simbol di map-core, pilihan Fasilitas di alat Titik (migrasi 0008); 2 integrasi + 7 pgTAP + browser |
| T-113 | Panel daftar fitur | T-109 | review | Pencarian kode/nama/jenis, hover menyorot, klik memilih dan menerbangkan peta, daftar tervirtualisasi; lantai > 1.000 fitur kini dimuat utuh (paginasi). 1.006 fitur: gulir 60 fps tanpa long task, cari 27 ms |
| T-114 | Validasi geometri | T-109 | siap | |
| T-115 | Tampilan 2D/3D | T-104, T-109 | menunggu | |
| T-116 | Lokasi dasar, kategori, tautan unit | T-109 | menunggu | |
| T-117 | Snapshot minimal | T-115, T-116 | menunggu | |
| T-118 | Visitor: peta, gedung, lantai | T-117, T-011 | menunggu | |
| T-119 | Visitor: cari, kategori, detail, A–Z | T-118 | menunggu | |
| T-120 | Visitor: bahasa ID/EN | T-119 | menunggu | |

## R2 · Navigasi (`12-R2-navigasi.md`)

| Task | Judul | Bergantung pada | Status | Catatan |
| --- | --- | --- | --- | --- |
| T-213 | Spesifikasi deep link | – | menunggu | boleh paralel sejak R1 |
| T-201 | Routing: graf dan A* | R1 | menunggu | model besar |
| T-202 | Routing: konektor | T-201 | menunggu | |
| T-203 | Routing: aksesibel, penutupan, titik masuk | T-202 | menunggu | |
| T-204 | Routing: instruksi | T-203 | menunggu | |
| T-205 | Editor graf | T-201 | menunggu | |
| T-206 | Titik masuk unit/fasilitas | T-205 | menunggu | |
| T-207 | Editor konektor dan aksesibilitas | T-205 | menunggu | |
| T-208 | Tampilan graf | T-207 | menunggu | |
| T-209 | Test route | T-204, T-207 | menunggu | |
| T-210 | Template instruksi | T-204 | menunggu | |
| T-211 | Penutupan dan role Operator | T-203, T-208 | menunggu | |
| T-212 | QR titik asal | T-205 | menunggu | |
| T-214 | Visitor: titik asal | T-213, T-118 | menunggu | |
| T-215 | Visitor: rute dan instruksi | T-204, T-214 | menunggu | |
| T-216 | Visitor: penutupan live | T-211, T-215 | menunggu | |
| T-217 | Visitor: bagikan | T-213, T-215 | menunggu | |

## R3 · Operasional (`13-R3-operasional.md`)

| Task | Judul | Bergantung pada | Status | Catatan |
| --- | --- | --- | --- | --- |
| T-313 | Konversi denah CAD | T-105 | menunggu | butuh keputusan lisensi konverter |
| T-301 | Kunci edit per lantai | R2 | menunggu | |
| T-303 | Tipe lokasi dan field kustom | R2 | menunggu | |
| T-302 | Tipe venue dan template industri | T-303 | menunggu | |
| T-304 | Status dan jam operasional | T-303 | menunggu | |
| T-305 | Import CSV/Excel | T-303, T-304 | menunggu | |
| T-306 | Alias pencarian | T-303 | menunggu | |
| T-307 | Validasi publish lengkap | T-303 | menunggu | model besar |
| T-308 | Ringkasan perubahan | R2 | menunggu | |
| T-309 | Preview | T-308 | menunggu | |
| T-310 | Publish berversi dan rollback | T-307, T-308 | menunggu | |
| T-311 | Visitor: pembaruan versi | T-310 | menunggu | |
| T-312 | Role Viewer dan matriks otorisasi | T-310 | menunggu | |

## R4 · Komersial (`14-R4-komersial.md`)

| Task | Judul | Bergantung pada | Status | Catatan |
| --- | --- | --- | --- | --- |
| T-410 | Branding Visitor | T-117 | menunggu | boleh paralel sejak R1 |
| T-401 | Format lisensi dan license-cli | R3 | menunggu | model besar |
| T-402 | Aktivasi online dan manual | T-401 | menunggu | |
| T-403 | Check-in, pencabutan, proteksi waktu | T-402 | menunggu | |
| T-404 | Status lisensi dan kuota | T-402 | menunggu | |
| T-405 | Fitur per paket | T-404 | menunggu | |
| T-406 | Pengingat, tenggang, kedaluwarsa | T-403, T-404 | menunggu | |
| T-407 | Info Point di Admin | T-404 | menunggu | |
| T-408 | Mode Info Point | T-407 | menunggu | |
| T-409 | Lanjutkan di HP, pembaruan, offline | T-408 | menunggu | |
| T-411 | Paket instalasi dan backup | T-402 | menunggu | |
| T-412 | Performa, kompatibilitas, pengerasan | T-409, T-411 | menunggu | |

## Pertanyaan terbuka

Format: `- [tanggal] T-xxx — pertanyaan. Opsi: A) … B) … Rekomendasi: … (status: menunggu jawaban)`

- [2026-09-29] T-010 — FR-SYS-01 menyebut SMTP di Pengaturan Sistem dipakai untuk reset password, tetapi email Auth (reset, undangan) dikirim GoTrue memakai SMTP dari konfigurasi server (`[auth.email.smtp]` / variabel `GOTRUE_SMTP_*`), bukan dari tabel `system_settings`. Opsi: A) Auth Hook *send email*: GoTrue memanggil Edge Function yang mengirim email Auth memakai SMTP dari Pengaturan Sistem (klien SMTP `_shared/smtp.ts` sudah ada); satu sumber konfigurasi, bisa diubah dari Admin tanpa restart. B) SMTP Auth tetap konfigurasi instalasi (diisi tim IT di paket T-411), Pengaturan Sistem hanya untuk email lain. Rekomendasi: A. (status: menunggu jawaban)

- [2026-09-30] T-112 — Siapa yang boleh mengubah jenis fasilitas? `05-user-flow.md` menaruh jenis fasilitas di Pengaturan (Admin, Super Admin), tetapi `04-model-data.md` memasukkan `facility_types` ke "konten yang boleh diubah Editor" (RLS `app.can_edit()`), sehingga Editor bisa mengubahnya lewat API walau tombolnya tidak tampil. Opsi: A) migrasi baru memperketat RLS `facility_types` dan policy Storage ikon ke `app.can_manage()`; B) tab Jenis fasilitas juga bisa diubah Editor (aksi `settings.edit` tidak dipakai di tab ini). Rekomendasi: A, sejalan dengan struktur menu; dikerjakan bersama matriks otorisasi T-312 atau lebih awal bila disetujui. Sementara ini UI mengikuti A, server mengikuti `04-model-data.md`. (status: menunggu jawaban)

## Catatan keputusan

Format: `- [tanggal] T-xxx — keputusan — alasan`

- [2026-09-29] T-001 — Task dikerjakan berurutan di branch `claude/vibrant-davinci-uyrrka`, bukan `task/T-xxx-*` dari `main` — repo belum punya branch `main`, dan pemilik meminta task dikerjakan beruntun dalam satu sesi. Dependensi dianggap terpenuhi bila task sebelumnya sudah ter-commit dengan status `review`.
- [2026-09-29] T-001 — TypeScript 7 (kompiler native) — versi stabil terbaru; semua opsi di `tsconfig.base.json` didukung. Jika ada alat yang butuh API JS TypeScript lama, turunkan ke 6.x.
- [2026-09-29] T-001 — `pnpm lint` di root menjalankan `biome check .` untuk seluruh repo (tugas root `//#lint`, tanpa cache) — file konfigurasi root ikut diperiksa; lint per paket tetap ditambahkan di T-002/T-003 untuk cache per paket.
- [2026-09-29] T-001 — `.gitignore` mengecualikan `.env*` kecuali `.env.example` — T-004 mewajibkan `.env.example` di-commit.
- [2026-09-29] T-002 — Versi dependensi bersama lewat `catalog:` di `pnpm-workspace.yaml` — satu versi TypeScript/React/Vite/Vitest untuk semua paket. Oxlint bawaan template Vite dihapus karena Biome menggantikannya.
- [2026-09-29] T-002 — Tiap app punya `tsconfig.json` (src, DOM) dan `tsconfig.node.json` (vite.config.ts); `typecheck` menjalankan keduanya. `build` hanya `vite build` karena typecheck sudah di `pnpm check`.
- [2026-09-29] T-003 — ID bermerek dibuat dari skema zod (`z.uuid().brand<'VenueId'>()`) — satu sumber untuk tipe dan validasi saat parsing baris/URL.
- [2026-09-29] T-003 — Selain larangan React/MapLibre/Supabase di `domain` dan `routing`, Biome juga menegakkan aturan dependensi `03-arsitektur.md`: `domain` tidak mengimpor `@indoor/*`, `routing` hanya `@indoor/domain`, `map-core` tidak mengimpor `@indoor/data`/`@supabase/*`.
- [2026-09-29] T-003 — Test paket murni di folder `test/` (sejalan dengan `test/fixtures/` di `06-alur-kerja.md`); `domain` dan `routing` hanya memakai lib ES2023 tanpa DOM.
- [2026-09-29] T-004 — **Perubahan SQL 0001 (keamanan):** PostGIS dan pgcrypto dibuat `with schema extensions`, bukan di `public` — di Supabase tabel `spatial_ref_sys` dimiliki `supabase_admin`, tidak bisa diberi RLS atau dicabut haknya oleh `postgres`, dan di `public` tabel itu bisa diubah/dihapus `anon` lewat REST API (terbukti: DELETE/INSERT anon → 204/201). PostGIS juga tidak bisa dipindah skema lewat migrasi lanjutan, jadi 0001 diubah sebelum pernah di-merge; blok SQL di `docs/04-model-data.md` diubah identik. Diuji di `supabase/tests/rls.test.sql`.
- [2026-09-29] T-004 — Password Super Admin seed diteruskan lewat `PGOPTIONS` (`-c seed.admin_password=…`) oleh `pnpm db:reset` (`scripts/db-reset.mjs`), karena seed SQL tidak bisa membaca `.env.local`. `supabase db reset` biasa tetap sukses tetapi tanpa Super Admin.
- [2026-09-29] T-004 — Supabase CLI dipasang sebagai devDependency root (`onlyBuiltDependencies: supabase`) agar `pnpm db:types` jalan tanpa instalasi global. `db:types` memformat hasil generate dengan Biome; file itu dikecualikan dari lint saja.
- [2026-09-29] T-005 — Konversi GeoJSON ↔ `geometry` tanpa view/RPC: PostgREST sudah mengeluarkan kolom geometry sebagai GeoJSON lewat cast bawaan PostGIS (yang memanggil `ST_AsGeoJSON`), dan PostGIS menerima teks GeoJSON sebagai input dengan SRID kolom. Helper `geometryFromColumn` membuang anggota `crs` dan memvalidasi dengan zod; tetap tanpa WKB manual. Diuji bolak-balik di test integrasi.
- [2026-09-29] T-005 — `DataErrorKind` ditambah `unknown` untuk error yang tidak dipetakan, agar tidak disamarkan sebagai `invalid`.
- [2026-09-29] T-005 — Update/delete 0 baris: repository memeriksa apakah baris masih terlihat → `forbidden`, jika tidak → `not_found`. Untuk `system_settings` (baris tunggal yang selalu ada) langsung `forbidden`.
- [2026-09-29] T-005 — Test integrasi (`pnpm test:integration`) memakai `scripts/with-supabase-env.mjs` yang membaca `supabase status -o env`; tidak ikut `pnpm check` karena butuh Docker. Biome melarang `@supabase/*` di luar `packages/data` dan `supabase/functions`.
- [2026-09-29] T-006 — Komponen shadcn ditulis tangan mengikuti struktur shadcn v4 (radix-ui, cva, `data-slot`) karena `ui.shadcn.com` diblokir kebijakan jaringan lingkungan cloud; `packages/ui/components.json` sudah ada agar `shadcn add` bisa dipakai saat host diizinkan.
- [2026-09-29] T-006 — Tema Tailwind menghapus palet, bayangan, radius, ukuran huruf, dan berat bawaan (`--color-*: initial`, dst.). Hanya token `05-desain-ui.md` yang menghasilkan kelas, sehingga warna non-token, bayangan besar, dan radius > 8 px tidak bisa dipakai. Skala `text-lg` = 20 px, `text-xl` = 24 px, `text-2xl` = 32 px; `text-body` mengikuti permukaan.
- [2026-09-29] T-006 — Nilai per permukaan lewat `data-surface` (`admin`, `visitor`, `info-point`) di `<html>`: font, ukuran dasar 14/16/20 px, tinggi kontrol 36/44/60 px, padding panel 16/20/24 px.
- [2026-09-29] T-006 — `--warn` (#B26A00) hanya untuk elemen non-teks (4,24:1 di atas putih, lolos 3:1 tetapi tidak 4,5:1); teks peringatan memakai `--ink`. Batas `Input`/`SelectTrigger` memakai `--ink-muted` (6,87:1) karena `--line` (1,42:1) tidak lolos 3:1 untuk batas kontrol (WCAG 1.4.11); `--line` tetap untuk garis pemisah. Token baru `--on-strong` (#FFFFFF) untuk teks di atas `--danger`/`--route`.
- [2026-09-29] T-006 — Font dari paket npm @fontsource (OFL-1.1) disalin ke `packages/ui/src/fonts/` (subset latin dan latin-ext, berat 400/700) beserta lisensinya.
- [2026-09-29] T-007 — Matriks akses modul dibuat di `packages/domain/src/permissions.ts` (file milik T-009) agar menu dan otorisasi aksi berasal dari satu sumber. Tingkat akses `edit`/`read`; modul `read` diberi penanda "baca" di menu dan "Mode baca" di halaman, sehingga menu kelima role berbeda. Editor: Venue, Penutupan, Pengaturan baca; Operator: Editor Peta baca + Penutupan.
- [2026-09-29] T-007 — `packages/data` mendapat `auth` (profil saat ini, perubahan sesi, keluar) dan `venues.list()`; login, reset, dan penguncian tetap di T-008. Tombol "Keluar" sudah aktif di menu akun.
- [2026-09-29] T-007 — Seed membuat satu akun per role (admin@, pengelola@, editor@, operator@, viewer@local.test) dengan password dari `SEED_ADMIN_PASSWORD`.
- [2026-09-29] T-007 — Kedua app membaca `.env.local` dari root repo (`envDir: '../..'`). Beranda mengarah ke modul pertama yang bisa diubah role (Operator → Penutupan).
- [2026-09-29] T-008 — Penguncian login memakai Auth Hook *password verification attempt* (GoTrue v2.197) dengan fungsi `app.hook_password_verification_attempt` di migrasi 0002. Fungsi ada di skema `app` (tidak diekspos PostgREST) dan hanya bisa dieksekusi `supabase_auth_admin`, sehingga penghitung tidak bisa diubah atau dipakai orang lain untuk mengunci akun lewat RPC. Hook juga menolak akun nonaktif dan mencatat `login`/`login_failed`. Migrasi Storage T-105 menjadi 0004 (bukan 0002 seperti di `04-model-data.md`).
- [2026-09-29] T-008 — GoTrue mengembalikan penolakan hook dengan kode `invalid_credentials`; klien mengenali pesan hook secara persis (`ACCOUNT_LOCKED_MESSAGE`, `ACCOUNT_INACTIVE_MESSAGE` di `packages/data/src/auth.ts`), dijaga test integrasi.
- [2026-09-29] T-008 — Konfigurasi auth lokal: pendaftaran mandiri dimatikan (`[auth] enable_signup = false`; `[auth.email] enable_signup` harus tetap `true` karena di CLI itu mematikan login email), `minimum_password_length = 8`, `[auth.sessions] inactivity_timeout = "1h"`, redirect ke port 5173, template email reset Bahasa Indonesia, batas email lokal 10/jam (default 2 menghambat pengujian).
- [2026-09-29] T-008 — Batas 60 menit tanpa aktivitas dijaga timer klien (waktu aktivitas terakhir dibagi antar-tab di localStorage; bukan token) dan `inactivity_timeout` server. Pesan untuk halaman login disimpan sekali tampil di sessionStorage karena keluar dari sesi memicu beberapa pengalihan yang menimpa state router.
- [2026-09-29] T-009 — Guard "Super Admin aktif terakhir" dan catatan `role_changed`/`user_deactivated` dibuat sebagai trigger database (migrasi 0003), sehingga berlaku untuk jalur apa pun (UI, REST langsung, Edge Function). Ubah role dan nonaktifkan memakai `profiles.update` biasa (RLS Super Admin); hanya pembuatan akun yang lewat Edge Function.
- [2026-09-29] T-009 — Konvensi SQLSTATE `IMxxx` untuk aturan proyek yang dilempar fungsi SQL: `toDataError` memetakannya ke `conflict` dan menampilkan pesan Bahasa Indonesia dari server apa adanya.
- [2026-09-29] T-009 — Edge Function `admin-users` memakai `fetch` ke REST Auth/PostgREST, tanpa impor `npm:`/URL, agar bisa dimuat di server on-premise tanpa akses registry (di lingkungan cloud impor npm gagal karena proxy TLS). Undangan ke email yang sudah punya profil ditolak 409 sebelum GoTrue dipanggil, sehingga akun yang ada tidak pernah terhapus oleh langkah pembersihan.
- [2026-09-29] T-010 — `system_settings` hanya dibaca Super Admin (migrasi 0004). Password SMTP disimpan di Supabase Vault lewat RPC `set_smtp_password` (cek Super Admin di server) dan dibaca hanya oleh Edge Function lewat `smtp_password_for_sending` (service role); klien hanya melihat status "tersimpan". Tugas T-010 menyebut penyimpanan lewat Edge Function; RPC dipilih karena sama amannya dan lebih sederhana. Fungsi-fungsi ini satu-satunya titik yang terikat Vault.
- [2026-09-29] T-010 — Email uji dikirim Edge Function `system-settings` dengan klien SMTP minimal tanpa dependensi (`supabase/functions/_shared/smtp.ts`: STARTTLS/TLS 465, AUTH PLAIN, batas waktu 10 detik, pesan gagal Bahasa Indonesia). URL publik Visitor wajib https tanpa `/` akhir; http hanya untuk localhost (pengujian lokal).
- [2026-09-29] T-012 — Pencatatan dilakukan di server (hook login, trigger `profiles` dan `system_settings`, RPC password SMTP), bukan dari klien; `audit_events` tidak bisa ditulis klien. `publish`, `rollback`, `license_changed` dicatat saat fiturnya dibuat (T-310, T-402). Komponen di `features/settings/audit-log.tsx` (nama file kebab-case seperti file lain, bukan `AuditLog.tsx` di task).
- [2026-09-29] T-011 — Bahasa Visitor ditentukan `resolveLanguage` di domain (pilihan tersimpan → bahasa perangkat → default), tanpa `i18next-browser-languagedetector` karena detector itu bisa menulis cookie. localStorage hanya berisi `indoor-visitor.language`.
- [2026-09-29] T-011 — PWA: precache aset (cache-first) kecuali font IBM Plex Sans milik Admin; snapshot `…/public/snapshots/…` stale-while-revalidate. Ikon PNG dirender dari SVG (penanda "Anda di sini" kuning di atas tinta). Installability diperiksa lewat Chrome DevTools Protocol (`Page.getInstallabilityErrors` kosong); Lighthouse tidak tersedia di lingkungan ini.
- [2026-09-29] T-104 — Fixture venue contoh di `packages/domain/test/fixtures/venue-sample.json` (2 gedung, 5 lantai termasuk Area Luar, 56 unit, lift GF–L1 saja, eskalator naik/turun, tangga), diekspor sebagai `@indoor/domain/fixtures/*`. Peta dengan fixture hanya ada di route pengembangan `/_map` agar tidak ada data contoh di build produksi.
- [2026-09-29] T-104 — MapLibre 6 memuat worker dari file terpisah: kedua app memakai `optimizeDeps.exclude: ['maplibre-gl']` di Vite. App memakai tipe `MapInstance` dari `@indoor/map-core`, tidak mengimpor `maplibre-gl` langsung.
- [2026-09-29] T-104 — Di 3D unit bersebelahan tampak menyatu (tinggi dan warna sama, dinding berupa garis tidak diekstrusi). Untuk T-115: ekstrusi dinding dari garis dinding dan pemisah visual antar-unit.
- [2026-09-29] T-101 — Titik pusat venue diisi dengan menempel koordinat "lat, lng" dari Google Maps (`parseLatLng`), bukan klik di peta kecil: peta on-premise tidak punya basemap sehingga klik di kanvas kosong tidak memberi acuan lokasi. Bucket `public-assets` (5 MB, PNG/JPG/WebP, tanpa SVG) dibuat di migrasi 0005 untuk logo venue; bucket denah tetap di T-105.
- [2026-09-29] T-101 — `toDataError` juga memetakan status HTTP (Storage/Edge Function): 403 → forbidden, 413/415 → invalid.
- [2026-09-29] T-102 — Area Luar dijaga di server (migrasi 0006, trigger `floors_guard_outdoor_layer`, SQLSTATE IM409): hanya terhapus bersama venue. `createPolygonDrawer` di map-core membungkus terra-draw (mode polygon + select, poligon memotong diri ditolak) dengan warna token (--signal isi, --ink garis), bukan biru bawaan terra-draw.
- [2026-09-29] T-102 — Halaman Venue memakai tab "Gedung" (venue terpilih) dan "Semua venue"; tombol utama berada di dalam tab masing-masing agar satu aksi utama per tampilan.
- [2026-09-29] T-103 — Urutan lantai mengikuti level (`sortFloorsTopDown`: level terbesar di atas, B1 di bawah GF); `sort_order` hanya pemecah seri, sehingga urutan drag tidak dibuat (urutan manual yang bertentangan dengan level akan membingungkan). Tampilan awal peta memakai `initialFloorView` (gedung default → lantai default → lantai level terdekat ke 0).
- [2026-09-29] T-105 — Bucket `floor-plans` (privat, 50 MB, PNG/JPG/PDF) dan `snapshots` (baca publik, JSON) di migrasi 0007; `public-assets` sudah ada di 0005. Path denah `{venue_id}/{floor_id}/{waktu}-source.{ext}` dan `-raster.png` untuk PDF; untuk PNG/JPG `raster_path` = berkas asli. Riwayat: versi lama `is_active = false` dan dibuka lewat URL bertanda (1 jam). Batas ukuran/tipe dicek di domain (`checkFloorPlanFile`, MIME harus cocok dengan ekstensi) dan ditegakkan lagi oleh bucket (413/415).
- [2026-09-29] T-105 — Dependency baru `pdfjs-dist` (Admin saja, dimuat lazy saat PDF dipilih, tidak masuk bundle awal). Dipakai build `legacy/`: build utama v6 memanggil `Map.prototype.getOrInsertComputed` yang belum ada di Chromium yang dipakai uji (dan Chrome/Edge kantor yang tertinggal). Raster PDF: lebar ±4.000 px, sisi terpanjang ≤ 8.000 px, latar putih.
- [2026-09-29] T-106 — Posisi denah dimodelkan sebagai persegi panjang berputar (`Placement`: pusat, lebar/tinggi meter, rotasi searah jarum jam dari utara) di `map-core/src/georef.ts`; `corners` yang disimpan selalu diturunkan darinya, sehingga tidak ada warping. Tarik sudut = sudut seberang tetap (dengan "Kunci proporsi": skala seragam); kalibrasi alat ukur menskalakan terhadap titik ukur pertama. Hitungan jarak memakai proyeksi ekuirektangular lokal (galat < 0,01% pada skala gedung). Uji browser: setelah kalibrasi 48 m, jarak lain yang diketahui (32 m) terukur 31,98 m (0,06%).
- [2026-09-29] T-106 — Halaman "Tempatkan denah" di route `/venues/floors/:floorId/plan` (dibuka dari dialog Denah), file kebab-case `georeference.tsx` sesuai konvensi repo. Posisi awal denah yang belum pernah ditempatkan: selebar footprint gedung di tengahnya. Role tanpa `venue.edit` melihat denah tanpa pegangan (sama dengan RLS `can_manage` untuk update).
- [2026-09-29] T-107 — Lapisan acuan (`map-core/src/layers/reference.ts`) memakai source dan layer sendiri (`ref-floor-*`) tanpa event, sehingga tidak bisa diseleksi atau disunting, dan tidak pernah disimpan. Fitur samar (isi/garis ≤ 25–50%, garis putus-putus); lift, eskalator, dan tangga berisi --signal 55%. Pilihan lantai acuan dibatasi lantai lain di gedung yang sama. Karena Editor (T-108) belum ada, komponen `features/editor/reference-layer.tsx` dipasang dulu di mode "Tempatkan denah", yang kini juga menampilkan fitur lantainya sendiri. `features.listByFloor` (baca saja) ditambahkan lebih awal di `packages/data/src/repositories/features.ts`; T-108 menambah penulisan.
- [2026-09-29] T-108 — Store editor (Zustand) memegang semua fitur lantai; fitur dirender lewat layer style map-core (cepat untuk 1.000 fitur), sedangkan terra-draw hanya memegang fitur yang sedang digambar atau disunting (`createFeatureEditor`); fitur yang disunting disembunyikan dari layer style lewat filter. Id fitur dibuat klien (UUID) dan disimpan dengan upsert, sehingga "buat" dan "ubah" satu jalur dan antrean tidak perlu tahu status di server. `SaveQueue` (debounce 800 ms per fitur, tanpa penyimpanan paralel per fitur, yang terakhir menang, "Gagal, coba lagi" mengirim ulang) dengan test.
- [2026-09-29] T-108 — Jenis awal fitur baru: poligon = unit (Area Luar: `outdoor_area`), garis = dinding, titik = pintu; unit mendapat kode otomatis `{kode gedung}-{lantai}-{nnn}` karena kolom `unit_code` wajib untuk unit. Pemilih jenis dan pengubahan kode di T-109. Luas memakai rumus bola (seperti turf) dengan jari-jari rata-rata; selisih ±0,5% dari PostGIS geography (elipsoid). Gedung/lantai terpilih disimpan di URL (`?building=&floor=`) agar reload kembali ke lantai yang sama. Tombol "Hapus fitur" di panel properti sudah ada (hapus multi-select dan pintasan di T-110).
- [2026-09-29] T-108 — Kelancaran: dengan WebGL perangkat lunak (SwiftShader) menggeser lantai 1.000 fitur 36 fps vs 43 fps untuk lantai hampir kosong, jadi batasnya perender CPU, bukan jumlah fitur; buka lantai 1.000 fitur 290 ms, pilih fitur 139 ms. Perlu diukur ulang di perangkat dengan GPU.
- [2026-09-29] T-109 — Jenis dipilih per alat gambar (chip mengambang di kanvas); daftar jenis dan bentuknya di domain (`KIND_SHAPE`, `drawKindsFor`), perubahan jenis lewat `changeFeatureKind` (atribut unit hanya pada unit; unit baru berstatus "kosong" dengan kode otomatis). Area Luar: `outdoor_area` dengan `props.subtype` road/garden/parking; parkir memakai `#E3E5E8` (tidak ada di tabel warna). Pintu keluar hijau `#1B7F4B`, lebih besar dari pintu. Lift/eskalator/tangga tetap satu gaya sesuai tabel `05-desain-ui.md`; pembeda berupa ikon menyusul bersama ikon peta.
- [2026-09-29] T-109 — Kode unit dinormalkan huruf besar (seperti kode gedung) dan dicek sebelum disimpan: bentrok di lantai yang sama dari store, bentrok lintas lantai lewat `features.findUnitCode` sehingga pesan menyebut gedung dan lantai unit yang bentrok; indeks unik `lower(unit_code)` tetap penjaga terakhir. Luas koreksi manual disimpan di `area_m2` dengan penanda `props.areaManual`; "Pakai otomatis" menghapus koreksi. Luas otomatis 1.266,09 m² vs PostGIS (elipsoid) 1.260,63 m² → 0,43%. File task menyebut `packages/domain/src/features.ts`; aturan ditaruh di `feature.ts`/`feature-draft.ts` yang sudah ada.
- [2026-09-29] T-110 — Snapping memakai `toCustom` terra-draw dengan fungsi murni `snapPoint` (vertex → tepi → sudut siku terhadap ruas terakhir, 8 px layar) dan `buildSnapIndex` dari store, karena fitur lantai sengaja tidak disimpan di terra-draw; berlaku saat menggambar poligon/garis dan menarik vertex. Mode titik terra-draw tidak mendukung snapping, jadi pintu belum menempel ke dinding. Seleksi ganda di store (`selectedIds`): Shift+klik, Shift+tarik (kotak), geser kelompok dengan pratinjau di source kecil lalu satu kali tulis ke store; putar lewat panel properti (±15°/±90° atau sudut bebas) terhadap pusat kotak batas seleksi. Pintasan global (Delete/Backspace, Esc, V/P/L/T) tidak aktif saat fokus di kolom isian atau menu.
- [2026-09-29] T-111 — Undo/redo memakai command berbasis patch (`store/history.ts`): setiap aksi dicatat sebagai daftar `{id, before, after}` fitur; `do` memasang `after`, `undo` memasang `before`, aksi massal = satu patch. Riwayat 100 langkah di store, dibersihkan saat lantai dimuat (ganti lantai/reload), tidak disimpan ke database; undo/redo masuk antrean simpan yang sama. Test: 50 undo lalu 50 redo acak (buat/ubah/hapus/massal) sama persis dengan snapshot tiap langkah. Store dan antrean dipindah ke `features/editor/store/`.
- [2026-09-29] T-111 — Perbaikan dari uji: (1) koordinat hasil snap/putar/geser kini dibulatkan 9 desimal (≈0,1 mm) karena terra-draw menolak presisi lebih tinggi, yang sebelumnya membuat fitur tersebut tidak bisa disunting ulang; (2) klik di dalam fitur yang sedang disunting tidak lagi membatalkan seleksi; (3) mengklik peta melepas fokus kolom isian (terra-draw mencegah fokus pindah) sehingga pintasan langsung berlaku.
- [2026-09-30] T-112 — Ikon jenis fasilitas di `facility_types.icon_path`: `builtin:<kunci>` untuk piktogram bawaan (kunci di `PICTOGRAM_KEYS` domain, gambar path SVG 24×24 di `packages/ui/src/pictograms`), selain itu path Storage `public-assets/facility-types/{venue_id}/{id}-{waktu}.png`. Tanpa perubahan skema. Ikon unggahan SVG/PNG (≤ 200 kB, dicek di domain) dirasterisasi di Admin ke PNG 128 px lewat `<img>` + canvas, sehingga skrip/rujukan luar di SVG tidak pernah jalan dan bucket tetap tanpa SVG (sesuai 0005).
- [2026-09-30] T-112 — Sprite dibangun saat memuat oleh `setFacilityIcons` (map-core), bukan berkas sprite dari server: lingkaran 28 px (bitmap 2×), latar putih + cincin dan simbol --ink; keselamatan berlatar --danger dengan simbol putih (simbol --ink di atas merah tidak kontras). Gambar unggahan yang punya piksel transparan dipakai sebagai topeng dan diwarnai seperti ikon bawaan; gambar buram penuh ditampilkan apa adanya. Jenis tanpa ikon atau ikon yang belum/ gagal dimuat tampil sebagai lingkaran bertitik lewat `setMissingStyleImageResolver`. Pratinjau di Admin memakai fungsi yang sama (`renderFacilityIcon`) agar persis seperti di peta.
- [2026-09-30] T-112 — Fasilitas dirender layer `symbol` `floor-facilities` (bukan lingkaran titik) dengan `icon-allow-overlap` agar semuanya terlihat dan bisa diklik di editor; aturan label/ikon bertumpuk untuk pengunjung (FR-VST-03) diatur di T-118/T-119. Titik terpilih (fasilitas, pintu) tetap tampil dengan cincin sorotan, tidak disembunyikan saat disunting. Snapshot (T-117) perlu memuat jenis fasilitas (nama, ikon, keselamatan) agar Visitor bisa membangun sprite yang sama.
- [2026-09-30] T-112 — Jenis yang masih dipakai: penjaga server tetap FK `features.facility_type_id … on delete restrict` (hapus venue tetap cascade, sudah diuji); repository menerjemahkan 23503 menjadi pesan yang menyebut jumlah fasilitas dan lantainya. Tabel Admin menampilkan jumlah pemakaian dan dialog hapus menolak lebih dulu.
- [2026-09-30] T-112 — Migrasi 0008 juga menambah policy SELECT `public-assets` untuk pengguna Admin (`app.can_read()`): tanpa itu `remove()`/`list()` Storage sukses tanpa menghapus apa pun, sehingga ikon lama — dan logo venue lama sejak T-101 — tertinggal. `venues.remove` kini ikut membersihkan folder `facility-types/{venue_id}`.
- [2026-09-30] T-112 — Pengaturan kini bertab untuk semua role yang melihatnya: Jenis fasilitas (ubah: `settings.edit`; Editor/Viewer baca), Tampilan (placeholder), Sistem dan Catatan (hanya Super Admin). Fasilitas di editor = pilihan "Fasilitas" pada alat Titik dengan pemilih jenis berikon di sebelahnya; nama opsional di panel properti; pintu ↔ fasilitas bisa diubah lewat "Jenis" (jenis fasilitas dipertahankan/diambil dari pilihan terakhir). Seed menambah 8 jenis contoh dengan ikon bawaan.
- [2026-09-30] T-113 — Daftar fitur divirtualisasi sendiri (baris tinggi tetap: judul grup 32 px, item 28 px; posisi dihitung dari offset + pencarian biner di `feature-list-model.ts`) tanpa dependency baru; hanya ±30–40 baris di DOM untuk 1.000 fitur. Pencarian tanpa membedakan huruf besar/kecil dan diakritik atas kode unit, nama, dan nama jenis fasilitas; saat mencari, grup yang punya hasil terbuka otomatis dan jumlahnya = jumlah yang cocok. Enter memilih hasil pertama, Escape mengosongkan pencarian.
- [2026-09-30] T-113 — Hover dan fokus tidak menduplikasi seleksi: store editor mendapat `hoveredId` (sorotan sementara, garis putus-putus lewat `setHoverHighlight` map-core) dan `focus(id)` yang memilih satu fitur, kembali ke alat Pilih, dan menaikkan `focusRequest.seq`; kanvas lalu memanggil `focusFeature` (map-core): zoom sekarang dipertahankan bila fitur muat, minimal 19, diturunkan bila fitur lebih besar dari layar; tanpa animasi bila `prefers-reduced-motion`.
- [2026-09-30] T-113 — **Perbaikan di luar file task:** PostgREST memotong hasil di `max_rows` (1.000) tanpa galat, sehingga `features.listByFloor` diam-diam hanya memuat 1.000 fitur (ditemukan saat uji 1.006 fitur: GU-L1-020 tidak muncul). Kini diambil per halaman 1.000 berurutan `id` (`fetchAllPages` di `packages/data/src/pagination.ts`), dengan test unit dan integrasi 1.001 fitur. Batas `max_rows` tetap sebagai pengaman server. Daftar lain yang bisa melewati 1.000 baris (mis. node graf di R2) perlu memakai helper yang sama.
- [2026-09-29] T-001 — `agentGuidance: false` di `turbo.json` — Turborepo 2.11 otomatis menulis `AGENTS.md` saat mendeteksi agen; aturan agen sudah ada di `CLAUDE.md`.

## Riwayat rilis

| Rilis | Tag | Tanggal | Ringkasan |
| --- | --- | --- | --- |
| – | – | – | – |
