# Verifikasi E2E bertahap (T-307a)

Pengecekan end-to-end CRUD dan UI/UX dengan Playwright untuk **semua task berstatus `review`** di `docs/PROGRESS.md`, dikerjakan **sebelum T-307**. Setiap task dicek satu per satu dan disertai gambar hasil pengecekan.

## Persiapan

```
pnpm install
supabase start
pnpm db:reset          # seed + Super Admin admin@local.test
pnpm dev               # Admin :5173, Visitor :5174
pnpm test:e2e          # menjalankan e2e/
```

Pakai Page Object di `e2e/pages/` (tambah bila perlu) dan agent `e2e-runner` atau `/ecc-e2e`.

## Aturan pengerjaan

1. Mulai dari **R0 Fondasi (T-001)**, lanjut berurutan sesuai daftar di bawah. **Satu task per langkah**: task berikutnya baru dimulai setelah task saat ini lulus atau temuannya dicatat.
2. Per task, satu spec: `e2e/tests/verify/T-xxx-slug.spec.ts`.
3. **CRUD:** buat, baca (tampil di daftar/peta), ubah, hapus entitas task itu; termasuk validasi formulir dan penolakan oleh server untuk role tanpa izin (bukan hanya tombol tersembunyi).
4. **UI/UX** sesuai `docs/05-desain-ui.md`: teks Admin Bahasa Indonesia, Visitor ID/EN; keadaan kosong, memuat, error; umpan balik setelah simpan; fokus dan navigasi keyboard; Admin desktop 1440 × 900, Visitor HP 390 × 844.
5. Task tanpa UI (tooling, paket, skema) dibuktikan lewat efeknya di aplikasi (app jalan, data tampil, akses ditolak) dan tetap diberi screenshot.
6. **Gambar wajib:** `page.screenshot({ path, fullPage: true })` ke `e2e/evidence/T-xxx/NN-langkah.png` (mis. `01-daftar-kosong.png`, `02-form-isi.png`, `03-tersimpan.png`, `04-dihapus.png`, `05-error.png`).
7. Ringkasan per task di `e2e/evidence/T-xxx/README.md`: skenario, hasil (lulus/gagal), daftar gambar (ditautkan), temuan.
8. Bug kecil di file task itu diperbaiki di PR yang sama beserta test-nya; bug besar dicatat di `docs/PROGRESS.md` sebagai pekerjaan lanjutan.
9. Setelah task terverifikasi: centang di daftar bawah, tambahkan "diuji E2E, bukti `e2e/evidence/T-xxx/`" di catatan task itu di `PROGRESS.md`, commit `T-307a: verifikasi E2E T-xxx`.
10. Jangan: menggabungkan beberapa task dalam satu spec/commit, memakai `waitForTimeout`, atau melemahkan/menghapus test agar hijau.

## Selesai jika

- [ ] Setiap task di daftar punya spec verifikasi yang lulus di `pnpm test:e2e`, atau temuannya tercatat
- [ ] Setiap task punya `e2e/evidence/T-xxx/` berisi screenshot CRUD dan UI/UX serta README
- [ ] Semua spec lulus 3 kali berturut-turut tanpa retry

## Daftar task (urutan pengerjaan)


### R0 · Fondasi (`10-R0-fondasi.md`)

- [ ] T-001 · Monorepo dan tooling → `e2e/evidence/T-001/`
- [ ] T-002 · Scaffold aplikasi Admin dan Visitor → `e2e/evidence/T-002/`
- [ ] T-003 · Kerangka paket bersama → `e2e/evidence/T-003/`
- [ ] T-004 · Supabase lokal dan skema inti → `e2e/evidence/T-004/`
- [ ] T-005 · Lapisan data → `e2e/evidence/T-005/`
- [ ] T-006 · Sistem desain → `e2e/evidence/T-006/`
- [ ] T-007 · Kerangka Admin → `e2e/evidence/T-007/`
- [ ] T-008 · Login, logout, reset password → `e2e/evidence/T-008/`
- [ ] T-009a · Peta aksi per role dan pgTAP per role → `e2e/evidence/T-009a/`
- [ ] T-009b · Halaman Pengguna, Edge Function `admin-users`, `<Can>` → `e2e/evidence/T-009b/`
- [ ] T-010 · Pengaturan sistem → `e2e/evidence/T-010/`
- [ ] T-011 · Kerangka Visitor → `e2e/evidence/T-011/`
- [ ] T-012 · Catatan peristiwa penting → `e2e/evidence/T-012/`

### R1 · Inti peta (`11-R1-inti-peta.md`)

- [ ] T-101 · Venue dan multi-venue → `e2e/evidence/T-101/`
- [ ] T-102 · Gedung dan Area Luar → `e2e/evidence/T-102/`
- [ ] T-103 · Lantai dan default tampilan → `e2e/evidence/T-103/`
- [ ] T-104 · Fondasi peta (map-core) → `e2e/evidence/T-104/`
- [ ] T-105 · Unggah denah PNG/JPG/PDF → `e2e/evidence/T-105/`
- [ ] T-106 · Georeferensi dan opasitas → `e2e/evidence/T-106/`
- [ ] T-107 · Lapisan acuan lantai lain → `e2e/evidence/T-107/`
- [ ] T-108 · Editor: kanvas, alat gambar, draft → `e2e/evidence/T-108/`
- [ ] T-109 · Jenis fitur dan atribut unit → `e2e/evidence/T-109/`
- [ ] T-110 · Edit geometri, multi-select, snapping → `e2e/evidence/T-110/`
- [ ] T-111 · Undo/redo → `e2e/evidence/T-111/`
- [ ] T-112 · Fasilitas dan jenis fasilitas → `e2e/evidence/T-112/`
- [ ] T-113 · Panel daftar fitur → `e2e/evidence/T-113/`
- [ ] T-114 · Validasi geometri → `e2e/evidence/T-114/`
- [ ] T-115 · Tampilan 2D/3D → `e2e/evidence/T-115/`
- [ ] T-116 · Lokasi dasar, kategori, tautan unit → `e2e/evidence/T-116/`
- [ ] T-117 · Snapshot minimal → `e2e/evidence/T-117/`
- [ ] T-118 · Visitor: peta, gedung, lantai → `e2e/evidence/T-118/`
- [ ] T-119 · Visitor: cari, kategori, detail, A–Z → `e2e/evidence/T-119/`
- [ ] T-120 · Visitor: bahasa ID/EN → `e2e/evidence/T-120/`

### R2 · Navigasi (`12-R2-navigasi.md`)

- [ ] T-201 · Routing: graf dan A* → `e2e/evidence/T-201/`
- [ ] T-202 · Routing: konektor → `e2e/evidence/T-202/`
- [ ] T-203 · Routing: aksesibel, penutupan, titik masuk → `e2e/evidence/T-203/`
- [ ] T-204 · Routing: instruksi → `e2e/evidence/T-204/`
- [ ] T-205 · Editor graf → `e2e/evidence/T-205/`
- [ ] T-206 · Titik masuk unit/fasilitas → `e2e/evidence/T-206/`
- [ ] T-207 · Editor konektor dan aksesibilitas → `e2e/evidence/T-207/`
- [ ] T-208 · Tampilan graf → `e2e/evidence/T-208/`
- [ ] T-209 · Test route → `e2e/evidence/T-209/`
- [ ] T-210 · Template instruksi → `e2e/evidence/T-210/`
- [ ] T-211 · Penutupan dan role Operator → `e2e/evidence/T-211/`
- [ ] T-212 · QR titik asal → `e2e/evidence/T-212/`
- [ ] T-213 · Spesifikasi deep link → `e2e/evidence/T-213/`
- [ ] T-214 · Visitor: titik asal → `e2e/evidence/T-214/`
- [ ] T-215 · Visitor: rute dan instruksi → `e2e/evidence/T-215/`
- [ ] T-216 · Visitor: penutupan live → `e2e/evidence/T-216/`
- [ ] T-217 · Visitor: bagikan → `e2e/evidence/T-217/`

### R3 · Operasional (`13-R3-operasional.md`)

- [ ] T-301 · Kunci edit per lantai → `e2e/evidence/T-301/`
- [ ] T-302 · Tipe venue dan template industri → `e2e/evidence/T-302/`
- [ ] T-303 · Tipe lokasi dan field kustom → `e2e/evidence/T-303/`
- [ ] T-304 · Status dan jam operasional → `e2e/evidence/T-304/`
- [ ] T-305 · Import CSV/Excel → `e2e/evidence/T-305/`
- [ ] T-306 · Alias pencarian → `e2e/evidence/T-306/`
