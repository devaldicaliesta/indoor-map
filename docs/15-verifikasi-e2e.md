# Verifikasi E2E bertahap (T-307a)

Pengecekan end-to-end **CRUD** dan **UI/UX** dengan Playwright untuk **semua task berstatus `review`** di `docs/PROGRESS.md`, dikerjakan **sebelum T-307**. Setiap task dicek satu per satu dan disertai gambar hasil pengecekan. Test case yang dijalankan (CRUD, UI/UX, keamanan, NFR) ada di `16-test-case.md`; sebut ID-nya (`TC-xxx-nn`) di nama test dan README bukti.

## Persiapan

```
pnpm install
dockerd &                      # di lingkungan cloud daemon Docker belum menyala
supabase start
pnpm db:reset                  # seed + Super Admin admin@local.test
# Untuk denah DXF (T-313): layanan konversi, lihat services/cad-converter/README.md
pnpm test:e2e                  # Playwright menyalakan Admin :5173 dan Visitor :5174 sendiri
```

- `.env.local` berisi `SEED_ADMIN_PASSWORD`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan (opsional) `VITE_CAD_CONVERTER_URL`.
- Bila Edge Function mulai mengimpor file `packages/domain` baru, jalankan `supabase stop && supabase start`: berkas di luar `supabase/functions` hanya dipasang saat start.
- Bila gateway membalas "name resolution failed" setelah Docker dinyalakan ulang, `supabase stop && supabase start`.
- Langkah pertama T-307a (sebelum T-001): tambahkan fixture data uji lengkap sesuai `16-test-case.md` bagian 2 (2 gedung, 3 lantai, ≥ 20 unit, lift yang tidak melayani semua lantai, eskalator naik dan turun, tangga, 3 QR, jalur Area Luar) dan berkas denah contoh; fixture `testVenue`/`publishedVenue` yang ada baru berisi satu gedung satu lantai.
- Pakai fixture `e2e/fixtures.ts` (`loginAs`, `testVenue`, `publishedVenue`, `superAdmin`) dan Page Object `e2e/pages/` (tambah bila perlu); agent `e2e-runner` atau `/ecc-e2e`.

## Referensi: e2e-runner (everything-claude-code)

Panduan kerja E2E mengikuti agent [e2e-runner](https://github.com/WorldFlowAI/everything-claude-code/blob/main/agents/e2e-runner.md) (WorldFlowAI/everything-claude-code), yang versi adaptasinya ada di `.claude/agents/e2e-runner.md` (panggil lewat agent `e2e-runner` atau `/ecc-e2e`). Bila berbeda, aturan di dokumen ini dan `CLAUDE.md` yang berlaku.

Prinsip yang dipakai selama pengujian:

| Prinsip upstream | Penerapan di repo ini |
| --- | --- |
| Rencanakan alur kritis dan kelompokkan menurut risiko | Prioritas P1–P3 dan ID test case di `16-test-case.md` |
| Page Object Model | `e2e/pages/` (tambah kelas baru per halaman bila belum ada) |
| Locator stabil (`data-testid`) | Utamakan role + nama aksesibel (`getByRole`, `getByLabel`); `data-testid` hanya untuk elemen tanpa nama (peta, pratinjau) |
| Tanpa timeout sembarang; tunggu kondisi spesifik | Dilarang `waitForTimeout`; tunggu elemen/teks, respons jaringan (`waitForResponse`), atau `data-ready` |
| Pola Arrange-Act-Assert | Siapkan data lewat fixture/repository, lakukan aksi lewat UI, periksa di UI **dan** database |
| Screenshot di momen penting | Gambar wajib per langkah ke `e2e/evidence/T-xxx/` |
| Trace saat gagal, video hanya untuk yang gagal | Sudah di `playwright.config.ts` (`trace: retain-on-failure`, `video: retain-on-failure`); lampirkan path trace di README bukti bila gagal |
| Laporan HTML dan JUnit | `e2e/playwright-report/` dan `e2e/test-results/junit.xml` (tidak di-commit) |
| Tangani test flaky | Cari penyebab (animasi, jaringan, elemen belum siap) dan perbaiki. `test.fixme()` hanya boleh disertai temuan di `PROGRESS.md` dan disetujui pemilik, **tidak pernah** untuk membuat hijau |
| Target lulus > 95%, flaky < 5%, satu run < 10 menit | Untuk spec verifikasi: lulus 3 kali berturut-turut tanpa retry; seluruh `pnpm test:e2e` dijaga < 10 menit |

## Aturan pengerjaan

1. Mulai dari **R0 Fondasi (T-001)**, lanjut berurutan sesuai daftar di bawah. **Satu task per langkah**: task berikutnya baru dimulai setelah task saat ini lulus atau temuannya dicatat.
   - **Wajib berhenti dan konfirmasi ke pemilik setiap selesai satu task.** Setelah satu task diuji, laporkan hasilnya (lulus/gagal, test case yang dijalankan, temuan, dan gambar di `e2e/evidence/T-xxx/`), lalu **tunggu persetujuan pemilik** sebelum memulai task berikutnya. Jangan langsung lanjut otomatis, walaupun semua test lulus.
2. Per task satu spec, di folder yang memang dijalankan konfigurasi Playwright (`testMatch` hanya `admin/**` dan `visitor/**`):
   - `e2e/tests/admin/verify/T-xxx-slug.spec.ts` untuk Admin (desktop 1440 × 900)
   - `e2e/tests/visitor/verify/T-xxx-slug.spec.ts` untuk Visitor (HP 360 × 740); buka halaman tambahan 1280 × 800 untuk desktop
3. Isi setiap spec memakai **daftar periksa CRUD** dan **daftar periksa UI/UX** di bawah; kolom "Fokus" di daftar task menyebut entitas dan alur yang wajib dicek.
4. Task tanpa UI (tooling, paket, skema) dibuktikan lewat efeknya di aplikasi (app jalan, data tampil, akses ditolak) dan tetap diberi screenshot; bila memang tidak ada yang tampil, tulis alasannya di README.
5. **Gambar wajib**, langsung ke folder bukti (bukan `test-results/`, yang dikosongkan setiap run):
   `page.screenshot({ path: 'evidence/T-xxx/NN-langkah.png', fullPage: true })` (path relatif ke `e2e/`), mis. `01-daftar-kosong.png`, `02-form-isi.png`, `03-tersimpan.png`, `04-diubah.png`, `05-dihapus.png`, `06-error.png`, `07-role-ditolak.png`.
6. **Pakai data yang banyak dan realistis** agar hasil pengerjaan terlihat jelas di gambar (bukan layar kosong atau satu baris):
   - Venue: fixture `fullVenue` (2 gedung, 4 lantai + Area Luar, unit dan fasilitas, lift/eskalator/tangga, jalur luar, lokasi berbagai status, alias, titik asal, Info Point), ditambah minimal 3 venue lain agar pemilih venue dan daftar terisi.
   - Daftar dan tabel: minimal 20–50 baris (lokasi, pengguna per role, kategori, penutupan, titik asal) sehingga gulir, pencarian, filter, dan urutan teruji; sertakan nama panjang, aksen/emoji, dan status campuran (aktif, segera buka, nonaktif).
   - Peta: lantai berisi puluhan unit dengan kode, warna per jenis, label, dan rute lintas lantai agar 2D/3D dan rute tampak nyata.
   - Data tambahan dibuat lewat fixture/repository di test (bukan `seed.sql` produksi) dan dihapus setelah test; tetap tanpa istilah industri di kode.
   - **Variasi data** (setiap venue/daftar mencampur beberapa nilai, bukan satu jenis saja):
     - Venue: tipe template berbeda (rumah sakit, kampus, perkantoran, bandara/stasiun, pabrik/gudang, pusat perbelanjaan, lainnya), zona waktu WIB/WITA/WIT, bahasa bawaan ID dan EN, dengan/tanpa logo, branding warna berbeda (terang, gelap, bawaan).
     - Gedung dan lantai: satu gedung vs banyak gedung, lantai basement (level negatif), lantai default berbeda, lantai kosong, Area Luar berisi jalan/taman/parkir.
     - Peta: semua jenis fitur (unit, koridor, dinding, pintu, lift, eskalator naik/turun, tangga, pintu keluar, non-akses, area luar, fasilitas, fasilitas keselamatan), status unit terisi/kosong/renovasi, tinggi dan warna override, denah PNG/JPG/PDF/DXF.
     - Lokasi: semua status (aktif, segera buka dengan tanggal, nonaktif sementara, nonaktif permanen), satu dan dua unit, tanpa unit, keenam jenis field kustom terisi/kosong, jam operasional (biasa, 24 jam, lewat tengah malam, libur, tanggal khusus), kategori dan alias, logo/foto.
     - Navigasi: edge aksesibel dan tidak, lift yang tidak melayani semua lantai, penutupan aktif/terjadwal/berakhir, beberapa titik asal QR dengan arah hadap berbeda.
     - Pengguna: kelima role, aktif/nonaktif/terkunci, nama panjang dan beraksen.
     - Teks: nama sangat pendek dan sangat panjang (batas maksimum), huruf beraksen (é, ü), emoji, angka di awal, karakter khusus (`&`, `'`, `<`), ID dan EN.
   - Ambil gambar keadaan kosong **dan** keadaan terisi penuh untuk layar yang sama.
7. Ambil gambar **setelah layar siap**: tunggu elemen/teks hasil (`toBeVisible`, `toHaveAttribute('data-ready', 'true')`), jangan `waitForTimeout`. Peta Visitor punya `data-testid="venue-map"` dengan `data-ready`; peta georeferensi `georef-map`.
8. Periksa setiap gambar dengan mata (bukan hanya lulus test): teks terpotong, elemen tumpang tindih, garis/ikon tak terlihat, warna kontras rendah dicatat sebagai temuan.
9. Sebelum melapor ke pemilik, tinjau test dan perbaikan yang ditulis dengan agent `code-reviewer`; untuk task yang menyentuh auth, RLS, Storage, Edge Function, unggahan, atau snapshot, jalankan juga `security-reviewer` (dengan kategori OWASP). Bila `pnpm check` merah, pakai `build-error-resolver`. Temuan KRITIS/TINGGI diselesaikan atau dicatat sebelum task dinyatakan lulus.
10. Ringkasan per task di `e2e/evidence/T-xxx/README.md`: spec, hasil (lulus/gagal), tabel gambar (ditautkan), temuan.
11. Bug kecil di file task itu diperbaiki di commit yang sama beserta test-nya; bug besar dicatat di `docs/PROGRESS.md` sebagai pekerjaan lanjutan.
12. Setelah task terverifikasi: centang di daftar bawah, tambahkan "diuji E2E, bukti `e2e/evidence/T-xxx/`" di catatan task itu di `PROGRESS.md`, commit `T-307a: verifikasi E2E T-xxx`.
13. Jangan: menggabungkan beberapa task dalam satu spec/commit, memakai `waitForTimeout`, atau melemahkan/menghapus test agar hijau. Test lama yang salah (mis. harapan yang sudah tidak berlaku) diperbaiki dengan alasan di README.

## Contoh README bukti

```
# T-xxx · Judul — bukti E2E

Spec: `e2e/tests/admin/verify/T-xxx-slug.spec.ts`. Hasil: **lulus 3/3** (tanggal).
Test case: TC-VEN-07, TC-VEN-39, TC-SEC-02 …

| Gambar | Langkah | Test case |
| --- | --- | --- |
| [01](01-daftar-kosong.png) | Keadaan kosong | TC-VEN-07 |

Temuan: [KRITIS|TINGGI|SEDANG|RENDAH] judul — langkah reproduksi — status (diperbaiki di commit … / dicatat di PROGRESS).
Tinjauan: code-reviewer [Setuju/…], security-reviewer [Setuju/…/tidak relevan].
```

## Daftar periksa CRUD (per entitas task)

| Langkah | Yang dibuktikan | Gambar |
| --- | --- | --- |
| Kosong | Keadaan kosong punya judul dan arahan | `01-…-kosong` |
| Create | Formulir diisi, disimpan, umpan balik (toast), data muncul di daftar/peta | `02`, `03` |
| Validasi | Isian wajib kosong/format salah/duplikat ditolak dengan pesan per kolom; pesan hilang setelah diperbaiki | `06-error` |
| Read | Data terbaca ulang setelah muat ulang halaman; detail tampil benar | – |
| Update | Ubah satu nilai, simpan, nilai baru tampil (dan di Visitor setelah publish bila relevan) | `04-diubah` |
| Delete | Konfirmasi hapus, data hilang, data turunan ikut sesuai aturan | `05-dihapus` |
| Otorisasi | Role tanpa izin: tombol tidak ada **dan** server menolak (cek lewat `superAdmin`/repository role itu) | `07-role-ditolak` |
| Database | Nilai tersimpan dicek lewat fixture `superAdmin` (bukan hanya lewat UI) | – |

## Daftar periksa UI/UX (`docs/05-desain-ui.md`)

- Teks Admin Bahasa Indonesia; Visitor ID dan EN (ganti bahasa minimal sekali untuk halaman Visitor).
- Keadaan memuat (skeleton), kosong, error, dan sukses semuanya punya tampilan.
- Navigasi keyboard: Tab mencapai semua aksi, fokus terlihat, Esc menutup dialog.
- Target sentuh Visitor ≥ 44 px; teks tidak terpotong di HP 360 px.
- Kontras teks lolos AA (warna branding venue juga); tidak ada warna/gaya default generik.
- Tombol utama nonaktif saat menyimpan; pesan sukses/gagal jelas.
- Desktop Admin 1440 × 900; Visitor HP 360 × 740 dan desktop 1280 × 800.

## Selesai jika

- [ ] Setiap task di daftar punya spec verifikasi yang lulus di `pnpm test:e2e`, atau temuannya tercatat
- [ ] Setiap task punya `e2e/evidence/T-xxx/` berisi screenshot CRUD dan UI/UX serta README
- [ ] Semua spec lulus 3 kali berturut-turut tanpa retry

## Temuan yang sudah diketahui

- `e2e/tests/visitor/search.spec.ts` gagal: masih mengharapkan "Rute ke sini" nonaktif, padahal sudah aktif sejak T-215 (perbaiki saat T-119/T-215).

## Daftar task (urutan pengerjaan)

Format: task · judul — **fokus cek** → folder bukti.

### R0 · Fondasi (`10-R0-fondasi.md`)

- [x] T-001 · Monorepo dan tooling — Bukan CRUD. `pnpm check` hijau; screenshot hasil terminal tidak perlu, cukup catat di README → `e2e/evidence/T-001/`
- [x] T-002 · Scaffold aplikasi Admin dan Visitor — Admin :5173 dan Visitor :5174 terbuka; halaman 404 tiap app → `e2e/evidence/T-002/`
- [x] T-003 · Kerangka paket bersama — Bukan CRUD; dibuktikan lewat T-005/T-007 (app memakai paket bersama) → `e2e/evidence/T-003/`
- [x] T-004 · Supabase lokal dan skema inti — Data seed tampil di Admin (Venue Contoh); `supabase test db` lulus → `e2e/evidence/T-004/`
- [x] T-005 · Lapisan data — Error data tampil sebagai pesan Indonesia (mis. simpan tanpa izin → "tidak memiliki izin") → `e2e/evidence/T-005/`
- [x] T-006 · Sistem desain — Galeri `/_ui`: komponen, fokus keyboard, kontras; screenshot galeri → `e2e/evidence/T-006/`
- [x] T-007 · Kerangka Admin — Menu per role (5 role), pemilih venue diingat, layar sempit diberi pemberitahuan → `e2e/evidence/T-007/`
- [x] T-008 · Login, logout, reset password — Login benar/salah, terkunci setelah gagal berulang, logout, lupa password (Mailpit), sesi idle → `e2e/evidence/T-008/`
- [x] T-009a · Peta aksi per role dan pgTAP per role — Tiap role mencoba aksi terlarang lewat UI → server menolak → `e2e/evidence/T-009a/`
- [x] T-009b · Halaman Pengguna, Edge Function `admin-users`, `<Can>` — CRUD pengguna: undang, ubah role, nonaktifkan; Super Admin terakhir tidak bisa dinonaktifkan → `e2e/evidence/T-009b/`
- [x] T-010 · Pengaturan sistem — Ubah pengaturan sistem + kirim email uji (Mailpit); non-Super Admin tidak melihat tab → `e2e/evidence/T-010/`
- [x] T-011 · Kerangka Visitor — Visitor HP dan desktop: bottom sheet 3 tinggi (drag + keyboard), PWA → `e2e/evidence/T-011/`
- [x] T-012 · Catatan peristiwa penting — Tab Catatan: peristiwa login/role/pengaturan tercatat, filter → `e2e/evidence/T-012/`

### R1 · Inti peta (`11-R1-inti-peta.md`)

- [x] T-101 · Venue dan multi-venue — CRUD venue (buat lewat wizard, ubah, hapus), pindah venue, logo → `e2e/evidence/T-101/`
- [x] T-102 · Gedung dan Area Luar — CRUD gedung + footprint; Area Luar tidak bisa dihapus → `e2e/evidence/T-102/`
- [x] T-103 · Lantai dan default tampilan — CRUD lantai, urutan level, lantai default → `e2e/evidence/T-103/`
- [x] T-104 · Fondasi peta (map-core) — Peta tampil, zoom/rotasi/2D–3D, kontrol peta → `e2e/evidence/T-104/`
- [x] T-105 · Unggah denah PNG/JPG/PDF — Unggah PNG/JPG/PDF (pilih halaman), riwayat versi, tipe salah ditolak → `e2e/evidence/T-105/`
- [x] T-106 · Georeferensi dan opasitas — Georeferensi: geser, ukuran, rotasi, kalibrasi jarak, opasitas, simpan → `e2e/evidence/T-106/`
- [x] T-107 · Lapisan acuan lantai lain — Lapisan acuan lantai lain tampil samar dan tidak bisa disunting → `e2e/evidence/T-107/`
- [x] T-108 · Editor: kanvas, alat gambar, draft — Gambar poligon/garis/titik, draft tersimpan, simpan/buang → `e2e/evidence/T-108/`
- [x] T-109 · Jenis fitur dan atribut unit — Ubah jenis fitur dan atribut unit (kode, status, tinggi); kode ganda ditolak → `e2e/evidence/T-109/`
- [x] T-110 · Edit geometri, multi-select, snapping — Edit titik, multi-select, snapping, hapus fitur → `e2e/evidence/T-110/`
- [x] T-111 · Undo/redo — Undo/redo lewat tombol dan keyboard → `e2e/evidence/T-111/`
- [x] T-112 · Fasilitas dan jenis fasilitas — CRUD fasilitas dan jenis fasilitas (ikon), fasilitas keselamatan → `e2e/evidence/T-112/`
- [x] T-113 · Panel daftar fitur — Panel daftar fitur: cari, pilih → peta fokus → `e2e/evidence/T-113/`
- [x] T-114 · Validasi geometri — Validasi geometri: temuan tampil, klik menuju fitur → `e2e/evidence/T-114/`
- [x] T-115 · Tampilan 2D/3D — 2D/3D di Admin dan Visitor, tinggi per jenis → `e2e/evidence/T-115/`
- [x] T-116 · Lokasi dasar, kategori, tautan unit — CRUD lokasi + kategori + tautan unit; pencarian daftar → `e2e/evidence/T-116/`
- [x] T-117 · Snapshot minimal — Publish → Visitor membaca snapshot; draft tidak tampil sebelum publish → `e2e/evidence/T-117/`
- [ ] T-118 · Visitor: peta, gedung, lantai — Visitor: peta, pemilih gedung dan lantai → `e2e/evidence/T-118/`
- [ ] T-119 · Visitor: cari, kategori, detail, A–Z — Visitor: cari (salah ketik), chip kategori, detail lokasi, A–Z → `e2e/evidence/T-119/`
- [ ] T-120 · Visitor: bahasa ID/EN — Ganti bahasa ID/EN, pilihan diingat, tautan berbahasa → `e2e/evidence/T-120/`

### R2 · Navigasi (`12-R2-navigasi.md`)

- [ ] T-201 · Routing: graf dan A* — Rute A→B di Test route dan Visitor (paket murni: unit test lulus) → `e2e/evidence/T-201/`
- [ ] T-202 · Routing: konektor — Rute lintas lantai lewat lift/eskalator/tangga → `e2e/evidence/T-202/`
- [ ] T-203 · Routing: aksesibel, penutupan, titik masuk — Rute aksesibel menghindari tangga; penutupan dihindari; titik masuk dipakai → `e2e/evidence/T-203/`
- [ ] T-204 · Routing: instruksi — Teks instruksi per langkah (ID/EN) → `e2e/evidence/T-204/`
- [ ] T-205 · Editor graf — CRUD node/edge graf di editor → `e2e/evidence/T-205/`
- [ ] T-206 · Titik masuk unit/fasilitas — Titik masuk unit/fasilitas: tambah, pindah, hapus → `e2e/evidence/T-206/`
- [ ] T-207 · Editor konektor dan aksesibilitas — CRUD konektor + arah eskalator + aksesibilitas → `e2e/evidence/T-207/`
- [ ] T-208 · Tampilan graf — Tampilan graf: tampil/sembunyi, warna aksesibel → `e2e/evidence/T-208/`
- [ ] T-209 · Test route — Test route di Admin: asal/tujuan, langkah, mode aksesibel → `e2e/evidence/T-209/`
- [ ] T-210 · Template instruksi — Ubah template instruksi ID/EN, pratinjau, kembali ke bawaan → `e2e/evidence/T-210/`
- [ ] T-211 · Penutupan dan role Operator — CRUD penutupan oleh Operator; Operator tidak bisa mengubah peta → `e2e/evidence/T-211/`
- [ ] T-212 · QR titik asal — CRUD titik asal + unduh QR; QR membuka Visitor di titik itu → `e2e/evidence/T-212/`
- [ ] T-213 · Spesifikasi deep link — Deep link lokasi/rute/bahasa terbuka dengan keadaan benar → `e2e/evidence/T-213/`
- [ ] T-214 · Visitor: titik asal — Visitor: pilih "Anda di sini" (QR, ketuk peta, daftar) → `e2e/evidence/T-214/`
- [ ] T-215 · Visitor: rute dan instruksi — Visitor: rute + langkah + lintas lantai + aksesibel → `e2e/evidence/T-215/`
- [ ] T-216 · Visitor: penutupan live — Penutupan baru muncul di Visitor tanpa muat ulang; rute dihitung ulang → `e2e/evidence/T-216/`
- [ ] T-217 · Visitor: bagikan — Bagikan lokasi/rute: tautan dibuka di perangkat lain sama → `e2e/evidence/T-217/`

### R3 · Operasional

- [ ] T-301 · Kunci edit per lantai — Dua pengguna di lantai sama: satu baca saja, ambil alih kunci (Super Admin) → `e2e/evidence/T-301/`
- [ ] T-302 · Tipe venue dan template industri — Wizard venue dengan template industri; isi tipe/kategori/fasilitas tersalin → `e2e/evidence/T-302/`
- [ ] T-303 · Tipe lokasi dan field kustom — CRUD tipe lokasi dan field kustom (6 jenis), urutan, field wajib → `e2e/evidence/T-303/`
- [ ] T-304 · Status dan jam operasional — Status lokasi, jam operasional, tanggal khusus; label buka/tutup di Visitor → `e2e/evidence/T-304/`
- [ ] T-305 · Import CSV/Excel — Import CSV/XLSX: template, pratinjau baru/perbarui/gagal, simpan baris valid → `e2e/evidence/T-305/`
- [ ] T-306 · Alias pencarian — Alias pencarian: tambah/ubah/hapus, cari alias di Visitor setelah publish → `e2e/evidence/T-306/`

### Sudah diuji saat dikerjakan (2026-10-02)

- [x] T-313 · Konversi denah CAD — DWG ditolak, DXF: pilih layer, pratinjau, unggah, skala awal → `e2e/evidence/T-313/` (`tests/admin/cad-floor-plan.spec.ts`)
- [x] T-410 · Branding Visitor — simpan/ubah/hapus logo, nama, warna; validasi; Editor baca saja; tampil di Visitor setelah publish → `e2e/evidence/T-410/` (`tests/admin/branding.spec.ts`)
