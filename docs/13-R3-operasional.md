# 13 · R3 Operasional

**Tujuan:** sistem siap dipakai klien pertama: template industri, tipe lokasi dengan field kustom, status dan jam operasional, import massal, alias pencarian, validasi publish lengkap, publish berversi, rollback, kunci edit, dan denah CAD.

**Gerbang selesai R3:**
- Venue baru bertipe rumah sakit dibuat dari template, diisi lewat import CSV 100 lokasi (5 baris salah terdeteksi), divalidasi, dipublish, lalu di-rollback ke versi sebelumnya.
- Semua jenis Error validasi memblokir publish; Peringatan tidak.
- Dua pengguna tidak bisa mengedit lantai yang sama bersamaan.
- Role Viewer bisa membuka semua menu kecuali Pengguna/Lisensi, dan setiap aksi ubah ditolak server.
- Denah DWG terkonversi dan bisa ditempatkan.

---

### T-301 · Kunci edit per lantai

- **Untuk:** FR-AUTH-05
- **Bergantung pada:** R2
- **Langkah:**
  1. Membuka editor lantai membuat/memperbarui baris `edit_locks` (heartbeat 60 s). Kunci dianggap lepas setelah 30 menit tanpa aktivitas.
  2. Pengguna lain melihat banner "Sedang diedit oleh X sejak 10.12" dan editor dalam mode baca.
  3. Super Admin bisa "Ambil alih kunci" (dicatat).
  4. Kunci dilepas saat keluar editor atau menutup tab (`beforeunload` + `sendBeacon`).
- **File:** `apps/admin/src/features/editor/lock/**`, `packages/data/src/editLocks.ts`
- **Selesai jika:**
  - [ ] Pengguna B hanya bisa membaca saat A mengedit lantai yang sama
  - [ ] Kunci lepas setelah A keluar atau 30 menit tidak aktif
  - [ ] Super Admin bisa membuka paksa
- **Jangan:** mengunci seluruh venue.

### T-302 · Tipe venue dan template industri

- **Untuk:** FR-VEN-02
- **Bergantung pada:** T-303 (butuh field kustom)
- **Langkah:**
  1. File template di `packages/domain/src/templates/`: `hospital.ts`, `campus.ts`, `office.ts`, `airport_station.ts`, `factory_warehouse.ts`, `shopping_center.ts`, `custom.ts`. Isi: tipe lokasi, kategori, field kustom, jenis fasilitas (termasuk fasilitas keselamatan), alias awal.
  2. Wizard tambah venue: langkah 1 data dasar, langkah 2 pilih tipe dengan pratinjau isi template, langkah 3 konfirmasi.
  3. Fungsi SQL/Edge Function `apply_template(venue_id, template)` dalam satu transaksi.
  4. Template tidak disimpan di database; perubahan setelahnya hanya mengubah salinan di venue.
- **File:** `packages/domain/src/templates/**`, `apps/admin/src/features/venues/CreateVenueWizard.tsx`, `supabase/functions/apply-template/`
- **Selesai jika:**
  - [ ] Venue rumah sakit baru berisi tipe Poli, Lab, Apotek, IGD, Kamar Rawat beserta field dan kategorinya
  - [ ] Mengubah tipe lokasi di satu venue tidak memengaruhi venue lain atau template
- **Jangan:** memakai istilah industri di luar folder `templates/`.

### T-303 · Tipe lokasi dan field kustom

- **Untuk:** FR-LOC-01, FR-LOC-02
- **Bergantung pada:** R2
- **Langkah:**
  1. Lokasi → Tipe lokasi: daftar tipe; tambah/ubah (nama, ikon, warna); kelola field (label, kunci otomatis dari label, jenis, opsi, wajib, tampil di Visitor, dapat dicari, urutan drag); kelola kategori per tipe.
  2. Skema zod dinamis dari definisi field di `packages/domain/src/customFields.ts` (validasi di form dan di validasi publish).
  3. Form lokasi menyesuaikan tipe yang dipilih; mengganti tipe meminta konfirmasi karena nilai field lama bisa hilang.
  4. Menghapus field yang sudah berisi data meminta konfirmasi dengan jumlah lokasi terdampak.
  5. Snapshot: hanya field `is_visible`; field `is_searchable` masuk `searchIndex`.
- **File:** `apps/admin/src/features/location-types/**`, `packages/domain/src/customFields.ts`
- **Selesai jika:**
  - [ ] Keenam jenis field bisa dibuat; wajib/tampil/dapat dicari berfungsi
  - [ ] Form lokasi hanya menampilkan field milik tipenya
  - [ ] Field tidak tampil di Visitor bila `is_visible = false`
- **Jangan:** membuat tabel per tipe; nilai field di `locations.custom_fields`.

### T-304 · Status lokasi dan jam operasional

- **Untuk:** FR-LOC-05, FR-LOC-06
- **Bergantung pada:** T-303
- **Langkah:**
  1. Status: aktif, segera buka (dengan tanggal), nonaktif sementara, nonaktif permanen. Saat memilih nonaktif permanen, tampilkan dampak ("unit L1-023 akan menjadi kosong").
  2. Editor jam operasional: per hari (buka/tutup atau libur) dan tanggal khusus.
  3. Fungsi murni `isOpenAt(hours, timezone, instant)` di `packages/domain/src/hours.ts` dengan test lintas zona waktu dan tengah malam.
  4. Visitor: status "Buka · tutup 20.00", "Tutup · buka 07.00", label "Segera buka 12 Okt" atau "Sementara tutup".
- **File:** `apps/admin/src/features/locations/Status.tsx`, `packages/domain/src/hours.ts`, `apps/visitor/src/features/location/OpenStatus.tsx`
- **Selesai jika:**
  - [ ] Lokasi nonaktif permanen hilang dari pencarian Visitor dan unitnya kosong
  - [ ] Status buka/tutup benar menurut zona waktu venue (test)
- **Jangan:** memakai zona waktu perangkat pengunjung.

### T-305 · Import CSV/Excel

- **Untuk:** FR-LOC-08
- **Bergantung pada:** T-303, T-304
- **Langkah:**
  1. Unduh template per tipe lokasi (CSV dan XLSX) berisi kolom standar (kode lokasi, nama, kategori, deskripsi, status, kode unit) + kolom field kustom.
  2. Unggah → parse di browser (Papa Parse / SheetJS) → validasi baris dengan zod dinamis.
  3. Pratinjau: baris baru, baris yang memperbarui (dicocokkan kode lokasi; jika kosong, kode unit), baris gagal beserta alasan per sel.
  4. Pilihan: perbaiki file dan unggah ulang, atau lanjutkan hanya baris valid.
  5. Tulis dalam batch lewat fungsi SQL satu transaksi per batch 200 baris.
- **File:** `apps/admin/src/features/import/**`, `packages/domain/src/importRows.ts`
- **Selesai jika:**
  - [ ] Import 100 baris dengan 5 baris salah menampilkan 5 baris gagal beserta alasan; hanya baris valid tersimpan
  - [ ] Baris dengan kode lokasi yang sudah ada memperbarui, tidak menduplikasi
- **Jangan:** mengunggah file ke server untuk diparse.

### T-306 · Alias pencarian

- **Untuk:** FR-LOC-09
- **Bergantung pada:** T-303
- **Langkah:**
  1. Alias per lokasi (di form lokasi), per kategori, dan per jenis fasilitas (di halamannya masing-masing).
  2. Masuk ke `searchIndex` snapshot.
- **File:** `apps/admin/src/features/aliases/**`, `packages/domain/src/snapshot.ts`
- **Selesai jika:**
  - [ ] Mencari "rontgen" di Visitor menemukan Radiologi setelah publish
- **Jangan:** membuat mesin sinonim otomatis.

### T-307a · Verifikasi E2E bertahap (CRUD dan UI/UX)

- **Untuk:** verifikasi semua task berstatus `review` sebelum validasi publish
- **Bergantung pada:** T-306 (dikerjakan sebelum T-307)
- **Konteks:** Banyak task R0–R3 berstatus `review` dengan catatan "belum diuji browser (tanpa Docker)". Sebelum T-307 dimulai, semua yang sudah dibuat dibuktikan di browser dengan Playwright, bertahap per task, beserta gambar hasil pengecekan. Jalankan dengan Supabase lokal (`supabase start`, `pnpm db:reset`). Pakai Page Object yang ada di `e2e/pages/` dan agent/skill `e2e-runner` / `/ecc-e2e`.
- **Langkah:**
  1. Ambil daftar task berstatus `review` di `docs/PROGRESS.md`, urut per rilis (R0 → R1 → R2 → R3). Kerjakan **satu task per langkah**; jangan lanjut ke task berikutnya sebelum task saat ini lulus atau temuannya dicatat.
  2. Per task, tulis spec Playwright di `e2e/tests/verify/T-xxx-slug.spec.ts` yang mencakup:
     - **CRUD:** buat, baca (tampil di daftar/peta), ubah, hapus untuk entitas task itu; termasuk penolakan (validasi formulir, role tanpa izin ditolak server, bukan hanya tombol tersembunyi).
     - **UI/UX:** sesuai `docs/05-desain-ui.md` — teks Admin Bahasa Indonesia, Visitor ID/EN, keadaan kosong/memuat/error, umpan balik setelah simpan, fokus dan navigasi keyboard, tampilan HP (390 × 844) untuk Visitor dan desktop (1440 × 900) untuk Admin.
  3. **Gambar wajib:** setiap langkah penting diambil screenshot dengan `page.screenshot({ path, fullPage: true })` ke `e2e/evidence/T-xxx/NN-langkah.png` (mis. `01-daftar-kosong.png`, `02-form-isi.png`, `03-tersimpan.png`, `04-dihapus.png`). Sertakan juga screenshot keadaan error.
  4. Tulis ringkasan per task di `e2e/evidence/T-xxx/README.md`: skenario, hasil (lulus/gagal), daftar gambar dengan tautan, dan temuan (bug, ketidaksesuaian UI/UX).
  5. Bug kecil di file task itu diperbaiki di PR yang sama dengan test pembuktiannya; bug besar dicatat di `docs/PROGRESS.md` bagian "Pertanyaan terbuka"/catatan sebagai pekerjaan lanjutan, tidak diperbaiki diam-diam.
  6. Setelah setiap task terverifikasi, perbarui kolom Catatan task itu di `docs/PROGRESS.md` ("diuji E2E T-307a, bukti di `e2e/evidence/T-xxx/`"), commit `T-307a: verifikasi E2E T-xxx`.
- **File:** `e2e/tests/verify/**`, `e2e/pages/**`, `e2e/evidence/**`, `docs/PROGRESS.md`
- **Selesai jika:**
  - [ ] Setiap task berstatus `review` punya spec verifikasi yang lulus di `pnpm test:e2e`, atau temuan tercatat
  - [ ] Setiap task punya folder `e2e/evidence/T-xxx/` berisi screenshot langkah CRUD dan UI/UX serta README ringkasan
  - [ ] Spec stabil: lulus 3 kali berturut-turut tanpa retry
- **Jangan:** menggabungkan banyak task dalam satu spec atau satu commit; memakai `waitForTimeout` sebagai pengganti menunggu elemen; menghapus/melemahkan test agar hijau.

### T-307 · Validasi publish lengkap

- **Untuk:** FR-PUB-03, FR-PUB-04
- **Bergantung pada:** T-303, T-307a, R2
- **Konteks:** Gunakan model besar. Validasi adalah fungsi murni yang dipakai Admin (tombol Validasi) dan Edge Function `publish`.
- **Langkah:**
  1. `validateVenue(draft): Finding[]` di `packages/domain/src/validation/publish.ts`.
  2. **Error:** geometri tidak valid/tumpang tindih; kode unit ganda; unit/fasilitas tanpa titik masuk; lokasi aktif tanpa unit; node/area tidak terjangkau dari titik asal mana pun; titik asal tidak terhubung graf; konektor hanya terhubung di satu sisi; eskalator tanpa dua pemberhentian; pemakaian melebihi kuota; lisensi tidak aktif atau masa tenggang (dua terakhir diisi di R4).
  3. **Peringatan:** lantai tanpa akses lift (rute kursi roda terputus); lokasi dengan field wajib kosong; template instruksi EN kosong; denah belum digeoreferensi; status "segera buka" dengan tanggal lewat.
  4. Halaman Publish: tombol Validasi, hasil dikelompokkan Error/Peringatan; klik temuan → editor lantai terkait dengan fitur disorot.
  5. Test per aturan dengan fixture.
- **File:** `packages/domain/src/validation/publish.ts`, `packages/domain/test/validation/publish/**`, `apps/admin/src/features/publish/Validation.tsx`
- **Selesai jika:**
  - [ ] Setiap aturan punya test yang gagal sebelum diperbaiki dan lulus sesudahnya
  - [ ] Klik temuan membuka lantai dan menyorot fitur
  - [ ] Validasi venue contoh ≤ 5 detik
- **Jangan:** menduplikasi aturan di Edge Function; impor dari `domain`.

### T-308 · Ringkasan perubahan

- **Untuk:** FR-PUB-02
- **Bergantung pada:** T-117
- **Langkah:**
  1. Bandingkan draft dengan snapshot aktif: fitur, jalur, lokasi, titik asal yang ditambah/diubah/dihapus.
  2. Fungsi murni `diffSnapshot(prev, next)` di `domain` dengan test.
- **File:** `packages/domain/src/diff.ts`, `apps/admin/src/features/publish/ChangeSummary.tsx`
- **Selesai jika:**
  - [ ] Ringkasan menyebut jumlah dan daftar perubahan per kelompok dengan benar (test)
- **Jangan:** menyimpan diff ke database.

### T-309 · Preview

- **Untuk:** FR-PUB-05
- **Bergantung pada:** T-308
- **Langkah:**
  1. Bangun snapshot draft di memori (tanpa menyimpan) dan buka Visitor dalam iframe dengan mode preview.
  2. Pilihan: tampilan HP (390 × 844), Info Point (1080 × 1920 diskalakan) dari Info Point tertentu, 2D/3D.
- **File:** `apps/admin/src/features/publish/Preview.tsx`, `apps/visitor/src/preview/**`
- **Selesai jika:**
  - [ ] Preview menampilkan perubahan draft yang belum dipublish
- **Jangan:** menulis snapshot preview ke Storage.

### T-310 · Publish berversi, riwayat, rollback

- **Untuk:** FR-PUB-01, FR-PUB-06, FR-PUB-07, FR-PUB-08, NFR-PERF-04
- **Bergantung pada:** T-307, T-308
- **Langkah:**
  1. Edge Function `publish` versi penuh: periksa role, jalankan `validateVenue` (Error → tolak dengan daftar temuan), bangun snapshot, simpan `v{n}.json` + `latest.json`, catat `publications` (aktif), nonaktifkan versi lama, `app.log_event('publish')`. Semua atau tidak sama sekali.
  2. Dialog publish dengan catatan rilis.
  3. Riwayat versi: nomor, waktu, penerbit, catatan, asal (publish/rollback).
  4. Rollback: buat versi baru yang menyalin snapshot lama, set aktif, perbarui `latest.json`, catat `rollback`. Draft tidak berubah.
  5. Hapus tombol "Terbitkan (dev)" dari T-117.
- **File:** `supabase/functions/publish/`, `apps/admin/src/features/publish/**`
- **Selesai jika:**
  - [ ] Editor tidak bisa publish/rollback (server menolak)
  - [ ] Publish dengan Error ditolak; dengan Peringatan saja berhasil
  - [ ] Rollback mengaktifkan isi versi lama sebagai versi baru; draft tetap
  - [ ] Validasi + publish venue contoh ≤ 60 detik
- **Jangan:** mengubah format snapshot tanpa menaikkan `schemaVersion`.

### T-311 · Visitor: pembaruan versi

- **Untuk:** FR-VST-14
- **Bergantung pada:** T-310
- **Langkah:**
  1. Saat dibuka atau di-refresh, Visitor memakai `latest.json` terbaru (service worker memperbarui cache di latar).
  2. Rute yang sedang tampil tidak terputus; versi baru dipakai setelah pengguna menutup rute atau memuat ulang.
- **File:** `apps/visitor/src/data/**`
- **Selesai jika:**
  - [ ] Setelah publish, refresh menampilkan versi baru
  - [ ] Rute yang sedang terbuka tidak berubah sebelum refresh
- **Jangan:** memaksa reload saat pengguna sedang mengikuti rute.

### T-312 · Role Viewer dan verifikasi otorisasi menyeluruh

- **Untuk:** FR-AUTH-04 (lengkap), NFR-SEC-03
- **Bergantung pada:** T-310
- **Langkah:**
  1. Audit semua halaman Admin dengan akun Viewer: semua kontrol ubah disembunyikan atau nonaktif.
  2. Test pgTAP untuk setiap tabel × setiap role × setiap operasi (dibangkitkan dari matriks di `permissions.ts`).
  3. Test Playwright singkat: login Viewer, buka semua menu, pastikan tidak ada tombol ubah aktif.
- **File:** `supabase/tests/permissions_matrix.test.sql`, `e2e/tests/admin/viewer.spec.ts`
- **Selesai jika:**
  - [ ] Matriks role × tabel × operasi lulus seluruhnya
  - [ ] Viewer tidak bisa mengubah apa pun lewat UI maupun API
- **Jangan:** melonggarkan kebijakan RLS untuk membuat test lulus.

### T-313 · Konversi denah CAD (DWG/DXF)

- **Untuk:** FR-VEN-07 (bagian CAD)
- **Bergantung pada:** T-105
- **Konteks:** Konversi CAD tidak bisa berjalan di Edge Function. Dibutuhkan layanan kecil terpisah yang ikut dalam paket instalasi.
- **Langkah:**
  1. **Keputusan dulu:** pilih konverter (misalnya LibreDWG atau ODA File Converter) setelah memeriksa lisensinya untuk didistribusikan ke klien. Tulis opsi dan rekomendasi di "Pertanyaan terbuka"; lanjut setelah disetujui.
  2. Layanan `services/cad-converter` (container): terima file, konversi DWG → DXF → SVG/PNG per layer, kembalikan daftar layer dan satuan.
  3. Admin: setelah unggah DWG/DXF, tampilkan daftar layer untuk dipilih; raster hasil dipakai seperti PNG; skala awal dari satuan file.
- **File:** `services/cad-converter/**`, `apps/admin/src/features/floor-plans/CadLayers.tsx`
- **Selesai jika:**
  - [ ] DWG dan DXF contoh terkonversi, layer bisa dipilih, dan bisa digeoreferensi
  - [ ] Keputusan lisensi konverter tercatat
- **Jangan:** mengimpor layer CAD sebagai fitur vektor (F2).
