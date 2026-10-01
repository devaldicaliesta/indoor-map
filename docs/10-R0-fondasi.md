# 10 · R0 Fondasi

**Tujuan:** repo siap dikerjakan: monorepo, tooling, CI, database lokal dengan skema inti, auth, layout Admin dan Visitor.

**Gerbang selesai R0:**
- `pnpm install && pnpm check && pnpm build` hijau di CI.
- `supabase start && supabase db reset` menerapkan skema tanpa error; `pnpm db:types` menghasilkan tipe.
- Super Admin dari seed bisa login ke Admin, membuat pengguna Editor, logout; Editor login dan tidak melihat menu Pengguna/Lisensi.
- Visitor terbuka di HP (360 px) dengan peta kosong dan pemilih bahasa ID/EN.

**Versi acuan (September 2026):** Node 22 LTS, pnpm ≥ 10, React 19, Vite 8, TypeScript 7, Tailwind 4, MapLibre GL JS 6, Vitest 5, Biome 2, Turborepo 2. Gunakan versi stabil terbaru saat task dikerjakan; jika major berbeda, catat di `PROGRESS.md`.

---

### T-001 · Monorepo dan tooling

- **Untuk:** NFR-MNT-01
- **Bergantung pada:** –
- **Konteks:** Semua task berikutnya bergantung pada struktur dan perintah yang konsisten.
- **Langkah:**
  1. Inisialisasi pnpm workspace (`pnpm-workspace.yaml`: `apps/*`, `packages/*`).
  2. Pasang Turborepo, TypeScript, Biome, Vitest di root.
  3. `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `moduleResolution: bundler`, `verbatimModuleSyntax`.
  4. `biome.json`: format 2 spasi, lebar 100, kutip tunggal, aturan `noExplicitAny: error`, `noConsole: error` (kecuali di skrip).
  5. `turbo.json` dengan task `build`, `dev` (persistent), `typecheck`, `lint`, `test`.
  6. Skrip root: `dev`, `build`, `check` (= `turbo run typecheck lint test`), `test`, `format`, `db:types`.
  7. `.editorconfig`, `.nvmrc` (22), `.gitignore` (node_modules, dist, .turbo, .env*, supabase/.temp).
  8. `.github/workflows/ci.yml`: checkout, setup pnpm + Node 22, `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm build`.
  9. `.github/pull_request_template.md` sesuai `06-alur-kerja.md`.
- **File:** root config, `.github/*`
- **Selesai jika:**
  - [ ] `pnpm check` dan `pnpm build` hijau (meski belum ada paket)
  - [ ] CI berjalan di PR dan hijau
  - [ ] `pnpm format` memformat seluruh repo tanpa error
- **Jangan:** memasang ESLint/Prettier (Biome menggantikan keduanya).

### T-002 · Scaffold aplikasi Admin dan Visitor

- **Untuk:** struktur aplikasi
- **Bergantung pada:** T-001
- **Langkah:**
  1. `pnpm create vite apps/admin --template react-ts` dan `apps/visitor` dengan template yang sama.
  2. Hapus aset contoh Vite. Sesuaikan `tsconfig` agar extends `tsconfig.base.json`.
  3. Pasang React Router. Admin: route `/login`, `/` (placeholder). Visitor: route `/`, `/v/:venueId`, `/ip/:code` (placeholder).
  4. Port dev: Admin 5173, Visitor 5174.
  5. Tambah skrip `typecheck` (`tsc --noEmit`), `lint` (`biome check .`), `test` (`vitest run --passWithNoTests`) di kedua app.
- **File:** `apps/admin/**`, `apps/visitor/**`
- **Selesai jika:**
  - [ ] `pnpm dev` menjalankan kedua app bersamaan
  - [ ] Route placeholder bisa dibuka
  - [ ] `pnpm check` hijau
- **Jangan:** menambahkan UI library atau state library di task ini.

### T-003 · Kerangka paket bersama

- **Untuk:** arsitektur `03-arsitektur.md`
- **Bergantung pada:** T-001
- **Langkah:**
  1. Buat `packages/domain`, `packages/routing`, `packages/map-core`, `packages/data`, `packages/ui`, masing-masing dengan `package.json` (`"name": "@indoor/<nama>"`, `"type": "module"`, `exports` ke `src/index.ts`), `tsconfig.json`, `src/index.ts`, dan `README.md` berisi tanggung jawab + larangan dari tabel di `03-arsitektur.md`.
  2. Tambahkan dependensi antar paket sesuai diagram di `03-arsitektur.md`.
  3. `packages/domain`: pasang `zod`. Buat `src/ids.ts` (tipe ID bermerek, misalnya `VenueId`), `src/units.ts` (konstanta meter, EPSG:4326).
  4. Tambahkan pemeriksaan batas impor di Biome (`noRestrictedImports`) agar `domain` dan `routing` tidak mengimpor `react`, `maplibre-gl`, atau `@supabase/*`.
  5. Satu test contoh per paket murni agar pipeline test terbukti jalan.
- **File:** `packages/*`
- **Selesai jika:**
  - [ ] Kedua app bisa mengimpor dari `@indoor/domain` tanpa build terpisah (via `exports` ke sumber TS)
  - [ ] Impor `react` di `packages/domain` membuat `pnpm lint` gagal
  - [ ] `pnpm check` hijau
- **Jangan:** menulis logika bisnis di sini; hanya kerangka.

### T-004 · Supabase lokal dan skema inti

- **Untuk:** NFR-MNT-01, NFR-MNT-03; dasar semua FR
- **Bergantung pada:** T-001
- **Langkah:**
  1. `supabase init` di root.
  2. Salin **apa adanya** blok SQL dari `docs/04-model-data.md` ke `supabase/migrations/<timestamp>_0001_core_schema.sql`.
  3. `supabase/seed.sql`: buat satu pengguna Super Admin lokal (email `admin@local.test`, password dari variabel `.env.local`), baris `profiles`-nya, dan satu venue contoh "Venue Contoh" dengan satu gedung dan dua lantai.
  4. `supabase db reset` harus sukses.
  5. Skrip `pnpm db:types` → `supabase gen types typescript --local > packages/data/src/database.types.ts`.
  6. `supabase/tests/rls.test.sql` (pgTAP): minimal uji bahwa `anon` tidak bisa membaca `venues`, `anon` bisa membaca penutupan aktif, Editor tidak bisa insert `venues`, Admin bisa.
  7. `.env.example` berisi variabel yang dibutuhkan (tanpa nilai rahasia).
- **File:** `supabase/**`, `packages/data/src/database.types.ts`, `.env.example`
- **Selesai jika:**
  - [ ] `supabase db reset` sukses dari nol dua kali berturut-turut
  - [ ] Venue contoh otomatis punya lapisan Area Luar, `display_settings`, tipe lokasi "Lokasi", dan 15 template instruksi
  - [ ] `supabase test db` lulus
  - [ ] Tipe hasil generate ter-commit
- **Jangan:** mengubah SQL skema tanpa mencatat alasannya; perbaikan dilakukan lewat migrasi 0002.
- **Catatan lingkungan cloud:** jika Docker tidak tersedia, tulis file migrasi, seed, dan test; minta manusia menjalankan `supabase db reset` dan `pnpm db:types` lalu commit hasilnya.

### T-005 · Lapisan data (`packages/data`)

- **Untuk:** NFR-MNT-02
- **Mendukung:** FR-AUTH-04 (dimiliki T-009)
- **Bergantung pada:** T-003, T-004
- **Langkah:**
  1. `createDataClient(config)` yang membungkus `@supabase/supabase-js`. Konfigurasi dari `import.meta.env` di app, bukan di paket.
  2. Pola repository: satu modul per agregat (`venues.ts`, `floors.ts`, …) yang mengembalikan **tipe domain**, bukan baris mentah. Mulai dengan `profiles` dan `systemSettings` saja.
  3. Pemetaan error: kode Postgres (`23505`, `23514`, `42501`, …) → `DataError` dengan `kind` (`conflict`, `invalid`, `forbidden`, `not_found`, `network`) dan pesan Bahasa Indonesia. **Penting:** RLS tidak melempar error untuk `update`/`delete` yang dilarang, melainkan mengubah 0 baris. Repository wajib memakai `select()` setelah `update`/`delete` dan mengubah hasil 0 baris menjadi `DataError { kind: 'forbidden' | 'not_found' }`.
  4. Helper konversi GeoJSON ↔ kolom `geometry` (gunakan `ST_AsGeoJSON` lewat view atau RPC; jangan WKB manual).
  5. Hook TanStack Query **tidak** di sini; hook ada di app. Paket ini tetap bebas React.
  6. Test: pemetaan error dan konversi tipe dengan fixture baris.
- **File:** `packages/data/src/**`
- **Selesai jika:**
  - [ ] Tidak ada impor `@supabase/*` di luar `packages/data` (dicek Biome)
  - [ ] Error RLS muncul sebagai `DataError { kind: 'forbidden' }`
  - [ ] Test lulus
- **Jangan:** mengekspos klien Supabase mentah ke app.

### T-006 · Sistem desain (`packages/ui`)

- **Untuk:** NFR-USE-01; `05-desain-ui.md`
- **Bergantung pada:** T-003
- **Langkah:**
  1. Pasang Tailwind 4 di `packages/ui` dan kedua app.
  2. `npx shadcn init` dengan base color netral, lalu ganti variabel tema dengan token dari `05-desain-ui.md` bagian 3.
  3. Host font sendiri (Atkinson Hyperlegible, IBM Plex Sans, IBM Plex Mono) di `packages/ui/src/fonts/`.
  4. Tambah komponen: button, input, label, select, dialog, sheet, dropdown-menu, table, tabs, toast (sonner), tooltip, badge, skeleton. Sesuaikan radius (4/8 px) dan tinggi tombol (36 px Admin, 44 px Visitor).
  5. Komponen `StatusDot` (titik + teks) dan `EmptyState` (judul, kalimat langkah berikutnya, satu aksi).
  6. Halaman `/_ui` di Admin (hanya mode dev) yang menampilkan semua komponen dan token.
- **File:** `packages/ui/**`, konfigurasi Tailwind di app
- **Selesai jika:**
  - [ ] Semua warna lewat token; tidak ada hex di komponen
  - [ ] Kontras pasangan teks/latar di halaman `/_ui` lolos WCAG AA (cek manual dengan alat kontras)
  - [ ] Font dimuat dari aset lokal (tidak ada request ke Google Fonts)
- **Jangan:** menambah gradien, bayangan besar, atau radius > 8 px.

### T-007 · Kerangka Admin

- **Untuk:** NFR-COMP-03; menu dari `01-produk.md`
- **Bergantung pada:** T-002, T-005, T-006
- **Langkah:**
  1. Layout: sidebar kiri (240 px) berisi menu, header dengan pemilih venue dan menu akun.
  2. Menu: Venue, Editor Peta, Lokasi, Penutupan, Titik Asal, Publish, Pengaturan, Pengguna, Lisensi. Tampil sesuai role (tabel di `01-produk.md`); Operator hanya Penutupan dan peta baca.
  3. TanStack Query provider, error boundary dengan pesan jelas, toast.
  4. Store kecil (Zustand) untuk venue terpilih, disimpan di `localStorage`.
  5. Halaman placeholder per menu memakai `EmptyState`.
  6. Peringatan lebar layar < 1280 px ("Admin dirancang untuk layar lebar").
- **File:** `apps/admin/src/app/**`, `apps/admin/src/features/*/`
- **Selesai jika:**
  - [ ] Menu berbeda untuk kelima role (uji dengan akun seed per role)
  - [ ] Berpindah venue memperbarui semua halaman
  - [ ] Tidak ada menu hamburger di desktop
- **Jangan:** membuat halaman fitur; hanya kerangka.

### T-008 · Login, logout, reset password

- **Untuk:** FR-AUTH-01, FR-AUTH-02, NFR-SEC-02
- **Bergantung pada:** T-007
- **Langkah:**
  1. Halaman `/login` (email, password), sesuai gaya Admin.
  2. Sesi berakhir setelah 60 menit tanpa aktivitas (timer di klien + refresh token Supabase).
  3. "Lupa password": kirim tautan reset lewat Supabase Auth; halaman `/reset-password` untuk mengatur password baru (minimal 8 karakter).
  4. Penguncian: setelah 5 gagal login beruntun, akun terkunci 15 menit (`profiles.failed_login_count`, `locked_until`). Utamakan Auth Hook Supabase *password verification attempt*; jika tidak tersedia di versi yang dipakai, login lewat Edge Function `login` yang memeriksa dan memperbarui penghitung di server. Penghitung **tidak boleh** bisa diubah langsung dari klien (mencegah orang lain sengaja mengunci akun).
  5. Pengguna nonaktif (`is_active = false`) langsung di-logout dengan pesan jelas.
  6. Catat `login` dan `login_failed` lewat `app.log_event`.
- **File:** `apps/admin/src/features/auth/**`, `packages/data/src/auth.ts`, migrasi baru untuk fungsi penguncian
- **Selesai jika:**
  - [ ] Login benar masuk; salah menampilkan pesan umum ("Email atau password salah")
  - [ ] Tautan reset bisa dipakai sekali dan kedaluwarsa (uji dengan Inbucket/Mailpit bawaan Supabase lokal)
  - [ ] Percobaan ke-6 dalam 15 menit ditolak dengan pesan akun terkunci
  - [ ] Sesi berakhir setelah batas waktu tidak aktif
- **Jangan:** menyimpan password atau token di `localStorage` sendiri.

### T-009 · Kelola pengguna dan otorisasi per role

> Dipecah: **T-009a** = langkah 3 (peta aksi `can()` di `packages/domain/src/permissions.ts`) dan langkah 4 (pgTAP per role) — selesai. **T-009b** = langkah 1, 2, 3 (hook `useRole()` dan `<Can>` di Admin), dan 5, serta semua kriteria yang tersisa.

- **Untuk:** FR-AUTH-03, FR-AUTH-04, NFR-SEC-03
- **Bergantung pada:** T-008
- **Langkah:**
  1. Halaman Pengguna (Super Admin): tabel nama, email, role, status; tambah pengguna (undang lewat email), ubah role, nonaktifkan.
  2. Pembuatan pengguna lewat Edge Function `admin-users` (butuh service role) yang memeriksa pemanggil adalah Super Admin.
  3. Hook `useRole()` dan komponen `<Can action="...">` di Admin; peta aksi per role di `packages/domain/src/permissions.ts` (satu sumber untuk UI).
  4. Test pgTAP untuk setiap role di tabel `venues`, `features`, `closures`, `profiles`.
  5. Catat `role_changed` lewat `app.log_event`.
- **File:** `apps/admin/src/features/users/**`, `supabase/functions/admin-users/`, `packages/domain/src/permissions.ts`, `supabase/tests/`
- **Selesai jika:**
  - [ ] Super Admin bisa menambah, mengubah role, dan menonaktifkan pengguna
  - [ ] Editor yang memanggil API insert venue langsung ditolak (bukan hanya tombol disembunyikan)
  - [ ] Super Admin tidak bisa menurunkan role dirinya sendiri jika ia satu-satunya Super Admin
  - [ ] Test pgTAP per role lulus
- **Jangan:** menduplikasi aturan role di banyak tempat; semua dari `permissions.ts` dan fungsi `app.*`.

### T-010 · Pengaturan sistem

- **Untuk:** FR-SYS-01
- **Bergantung pada:** T-009
- **Langkah:**
  1. Halaman Pengaturan → tab Sistem (Super Admin): URL publik Visitor, SMTP (host, port, username, pengirim), zona waktu dan bahasa default.
  2. Password SMTP disimpan sebagai secret (Supabase Vault) lewat Edge Function; tidak pernah dikembalikan ke klien (tampil sebagai "••••• tersimpan").
  3. Tombol "Kirim email uji" ke email Super Admin.
  4. Validasi URL (https, tanpa path akhir `/`).
- **File:** `apps/admin/src/features/settings/**`, `packages/data/src/systemSettings.ts`, `supabase/functions/system-settings/`
- **Selesai jika:**
  - [ ] Nilai tersimpan dan tampil kembali setelah reload
  - [ ] Email uji terkirim dengan SMTP valid; pesan jelas saat gagal (host salah, auth gagal)
  - [ ] Role selain Super Admin tidak bisa membuka atau mengubah (UI dan server)
- **Jangan:** menyimpan password SMTP di tabel `system_settings`.

### T-011 · Kerangka Visitor

- **Untuk:** NFR-SEC-06, NFR-COMP-02
- **Mendukung:** FR-VST-11 (dimiliki T-120)
- **Bergantung pada:** T-002, T-006
- **Langkah:**
  1. Layout peta penuh + kolom cari mengambang (HP) / panel kiri 380 px (≥ 1024 px), sesuai wireframe `05-desain-ui.md`.
  2. i18next dengan dua bahasa (`id`, `en`), deteksi bahasa perangkat, pemilih bahasa, file terjemahan di `apps/visitor/src/i18n/`.
  3. `vite-plugin-pwa`: manifest, service worker dengan strategi *stale-while-revalidate* untuk `snapshots/**` dan *cache-first* untuk aset.
  4. Komponen bottom sheet tiga tinggi (intip, setengah, penuh), bisa di-drag dan dioperasikan keyboard.
  5. Pastikan tidak ada cookie/analitik/penyimpanan data pribadi; `localStorage` hanya untuk bahasa pilihan.
- **File:** `apps/visitor/src/**`
- **Selesai jika:**
  - [ ] Tampilan benar di 360 px dan 1440 px
  - [ ] Bahasa berganti tanpa reload; pilihan diingat
  - [ ] Lighthouse PWA: installable
  - [ ] Tidak ada request ke domain pihak ketiga
- **Jangan:** memuat data venue (itu T-117/T-118).

### T-012 · Catatan peristiwa penting

- **Untuk:** NFR-SEC-05
- **Bergantung pada:** T-009
- **Langkah:**
  1. Daftar aksi yang wajib dicatat (konstanta di `packages/domain/src/audit.ts`): `login`, `login_failed`, `role_changed`, `user_deactivated`, `publish`, `rollback`, `license_changed`, `settings_changed`.
  2. Pastikan semua titik yang sudah ada (T-008, T-009, T-010) memanggil `app.log_event`.
  3. Halaman sederhana di Pengaturan → tab Catatan (Super Admin): tabel 200 peristiwa terakhir, filter aksi.
- **File:** `packages/domain/src/audit.ts`, `apps/admin/src/features/settings/AuditLog.tsx`
- **Selesai jika:**
  - [ ] Setiap aksi di daftar yang sudah ada tercatat dengan pengguna dan waktu
  - [ ] Hanya Super Admin yang bisa membaca catatan
- **Jangan:** mencatat perubahan data biasa (itu audit log lengkap F2).
