# CLAUDE.md

Platform indoor map dan indoor navigation untuk semua jenis gedung (rumah sakit, kampus, perkantoran, bandara, pabrik, pusat perbelanjaan). Dipasang on-premise di server klien, hak pakai lewat lisensi berlangganan.

## Cara bekerja di repo ini

1. Baca `docs/PROGRESS.md` untuk tahu task mana yang sedang berjalan atau berikutnya.
2. Buka file rilis yang memuat task itu (`docs/10-R0-fondasi.md` s.d. `docs/14-R4-komersial.md`). Setiap task sudah mandiri: konteks, langkah, file, kriteria selesai.
3. Baca dokumen pendukung **hanya jika task merujuknya** (misalnya `docs/04-model-data.md` untuk task database). Untuk detail perilaku dan kriteria lengkap sebuah FR, cari ID-nya di `docs/spec/` (sumber kebenaran spesifikasi). Jangan membaca seluruh `docs/` di setiap sesi.
4. Kerjakan satu task saja, di branch `task/T-xxx-slug`.
5. Jalankan `pnpm check` (typecheck, lint, test) sampai hijau.
6. Centang task di `docs/PROGRESS.md`, tulis catatan singkat jika ada keputusan baru, lalu buka PR.

Urutan baca lengkap untuk orang baru ada di `docs/00-README.md`.

## Stack

- Monorepo: pnpm workspace + Turborepo
- Frontend: React + Vite + TypeScript (strict), shadcn/ui + Tailwind, React Router, TanStack Query, Zustand
- Peta: MapLibre GL JS, terra-draw (editor). Three.js **hanya** untuk model 3D di backlog; 3D gedung memakai `fill-extrusion`
- Data: Supabase (Postgres + PostGIS, Auth, Storage, Edge Functions), dijalankan lokal dengan `supabase start`
- Test: Vitest (paket murni), Playwright (alur utama saja)
- Lint/format: Biome

## Struktur

```
apps/admin        Admin: editor peta, CRUD, publish, lisensi
apps/visitor      Visitor (HP) dan Info Point (route /ip/:code)
packages/domain   tipe, skema zod, aturan validasi — TANPA dependensi UI
packages/routing  graf, A*, konektor, instruksi — TANPA dependensi UI
packages/map-core wrapper MapLibre: style, layer 2D/3D, georeferensi, kamera
packages/data     satu-satunya pintu ke Supabase (repository)
packages/ui       komponen shadcn yang sudah dikustom + design token
supabase/         migrations (SQL murni), functions (Edge Functions)
docs/             playbook, dibaca per kebutuhan task
```

## Perintah

```
pnpm install          pasang dependensi
pnpm dev              jalankan semua app
pnpm check            typecheck + lint + test (wajib hijau sebelum PR)
pnpm test             test saja
pnpm test:integration test yang butuh Supabase lokal berjalan (RLS lewat repository)
supabase start        Supabase lokal (butuh Docker)
supabase db reset     terapkan ulang semua migrasi + seed (tanpa Super Admin)
pnpm db:reset         sama, plus Super Admin lokal admin@local.test (password dari .env.local)
pnpm db:types         generate tipe TS dari skema ke packages/data
```

## Aturan wajib

- **Komponen React tidak pernah memanggil Supabase langsung.** Semua lewat `packages/data`. Ini menjaga agar database bisa dipindah ke Postgres/SQL lain.
- **Logika bisnis ada di `packages/domain` dan `packages/routing`**, bukan di komponen. Setiap perubahan di dua paket ini wajib disertai test.
- **Skema database hanya berubah lewat file migrasi baru** di `supabase/migrations/`. Jangan mengedit migrasi yang sudah di-merge.
- **Otorisasi selalu di server** (RLS/fungsi SQL). Menyembunyikan tombol di UI bukan otorisasi.
- **Istilah industri tidak boleh ada di kode.** Gunakan `location`, `unit`, `venue`, `building`, `floor`. Kata seperti "tenant", "toko", "mall", "poli" hanya boleh muncul di data template.
- **Info Point adalah mode dari aplikasi Visitor**, bukan aplikasi terpisah.
- Semua jarak dalam meter, koordinat WGS84 (EPSG:4326), geometri GeoJSON.
- UI mengikuti `docs/05-desain-ui.md`. Jangan memakai gaya default generik.

## Gaya kode

- TypeScript strict, tanpa `any`. Tipe data dari `packages/domain` atau hasil generate `packages/data`.
- Fungsi kecil dengan nama jelas. File di atas ±300 baris dipecah.
- Tidak menambah dependency tanpa menuliskan alasannya di deskripsi PR.
- Tidak ada data dummy di kode produksi; data contoh hanya di `supabase/seed.sql` atau fixture test.
- Komentar hanya untuk menjelaskan *mengapa*, bukan mengulang *apa*.
- Teks UI Admin dalam Bahasa Indonesia. Teks Visitor lewat i18next (ID/EN), tidak di-hardcode.
- Nama commit: `T-xxx: ringkasan singkat` (misalnya `T-201: A* dengan heuristik jarak`).

## Kapan berhenti dan bertanya

- Task menuntut perubahan di luar file yang disebut dan dampaknya lebih dari satu paket.
- Kriteria selesai bertentangan dengan dokumen lain.
- Butuh dependency baru yang berat (lebih dari ±100 kB gzip) atau berlisensi non-permisif.
- Perubahan skema yang menghapus atau mengganti nama kolom.

Tulis pertanyaannya di PR atau di `docs/PROGRESS.md` bagian "Pertanyaan terbuka", lalu hentikan task.
