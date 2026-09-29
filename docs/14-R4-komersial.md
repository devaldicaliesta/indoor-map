# 14 · R4 Komersial

**Tujuan:** produk siap dijual dan dipasang di server klien: lisensi berlangganan dengan kuota dan fitur per paket, Info Point, branding, paket instalasi, backup, dan pengujian performa.

**Gerbang selesai R4:**
- Instalasi baru dari paket instalasi di mesin bersih: aktivasi dengan kunci lisensi, lalu seluruh skenario gerbang R1–R3 lolos.
- Kuota Info Point 10: yang ke-11 ditolak di UI dan server.
- Lisensi uji yang berakhir kemarin: Admin read-only, Visitor tetap jalan; setelah masa tenggang, Visitor menampilkan pesan layanan tidak aktif.
- Info Point di layar sentuh Windows: cari, rute, QR ke HP, reset setelah idle, tetap jalan saat jaringan diputus.
- Semua target NFR performa terpenuhi dan terdokumentasi.

**Keamanan kunci:** private key vendor **tidak pernah** masuk repo, log, atau CI. Repo hanya berisi public key.

---

### T-401 · Format dan verifikasi lisensi + alat pembuat lisensi

- **Untuk:** FR-LIC-02, FR-LIC-03
- **Bergantung pada:** R3
- **Konteks:** Gunakan model besar. Kesalahan di sini membuka celah pembajakan.
- **Langkah:**
  1. Format lisensi (JSON kanonis): `licenseId`, `client`, `plan`, `validFrom`, `validUntil`, `quota { venues, buildings, floors, infoPoints }`, `features[]`, `instanceId`, `issuedAt`; plus `signature` Ed25519 atas payload kanonis.
  2. `packages/domain/src/license.ts`: skema zod, `canonicalize()`, `verifyLicense(file, publicKey, instanceId, now)` → `{ valid, reason }`.
  3. Public key vendor di `packages/domain/src/license.publicKey.ts` (diganti per build rilis).
  4. Alat vendor `tools/license-cli` (Node): `keygen` (sekali, simpan private key di luar repo), `issue --client ... --plan ... --instance ... --until ...`, `inspect`.
  5. Test: tanda tangan valid, payload diubah 1 karakter, instance berbeda, kedaluwarsa.
- **File:** `packages/domain/src/license.ts`, `tools/license-cli/**`
- **Selesai jika:**
  - [ ] File lisensi yang diubah satu karakter ditolak
  - [ ] Lisensi untuk `instance_id` lain ditolak
  - [ ] `license-cli` bisa menerbitkan dan memeriksa lisensi uji
- **Jangan:** membuat enkripsi sendiri; pakai Ed25519 dari WebCrypto/`node:crypto`.

### T-402 · Aktivasi online dan manual

- **Untuk:** FR-LIC-01
- **Bergantung pada:** T-401
- **Langkah:**
  1. Middleware Admin: tanpa lisensi berlaku, semua route diarahkan ke `/aktivasi`.
  2. Halaman aktivasi: tampilkan `instance_id`; input kunci lisensi → Edge Function `license-activate` menghubungi server vendor (URL di konfigurasi), menerima file, memverifikasi, menyimpan ke `licenses`.
  3. Cadangan: unggah file lisensi manual.
  4. Setelah aktivasi pertama tanpa pengguna: form membuat Super Admin pertama.
  5. Server vendor untuk uji lokal: stub sederhana di `tools/vendor-stub` yang memakai `license-cli`.
- **File:** `apps/admin/src/features/license/Activation.tsx`, `supabase/functions/license-activate/`, `tools/vendor-stub/**`
- **Selesai jika:**
  - [ ] Instalasi baru tidak bisa membuka menu apa pun sebelum aktivasi
  - [ ] Aktivasi online (ke stub) dan unggah manual sama-sama berhasil
- **Jangan:** menyimpan kunci lisensi dalam bentuk yang bisa dipakai ulang di instalasi lain.

### T-403 · Check-in, pencabutan, proteksi waktu

- **Untuk:** FR-LIC-04, FR-LIC-11, FR-LIC-12
- **Bergantung pada:** T-402
- **Langkah:**
  1. Tugas terjadwal (pg_cron atau cron Edge Function) setiap 24 jam: kirim `licenseId` + `instanceId` ke vendor; terima lisensi terbaru atau status `revoked`; simpan waktu server vendor.
  2. Gagal check-in: sistem tetap jalan; setelah 7 hari berturut-turut gagal, banner peringatan di Admin.
  3. Simpan `last_seen_at` (maksimum waktu yang pernah terlihat). Jika jam server mundur > 24 jam dari `last_seen_at`, anggap lisensi tidak valid sampai jam diperbaiki.
  4. `revoked` → status kedaluwarsa langsung, tanpa masa tenggang.
- **File:** `supabase/functions/license-checkin/`, migrasi penjadwalan
- **Selesai jika:**
  - [ ] Perpanjangan di vendor stub diterima otomatis pada check-in berikutnya
  - [ ] Memundurkan jam server membuat lisensi tidak valid
  - [ ] Lisensi dicabut → kedaluwarsa pada check-in berikutnya
- **Jangan:** mematikan sistem hanya karena check-in gagal.

### T-404 · Halaman status dan penegakan kuota

- **Untuk:** FR-LIC-05, FR-LIC-06, NFR-SEC-03
- **Bergantung pada:** T-402
- **Langkah:**
  1. Halaman Lisensi (Super Admin): klien, paket, masa berlaku, sisa hari, fitur, check-in terakhir, pemakaian per kuota ("Info Point 7/10") dengan bar.
  2. Fungsi SQL `app.assert_quota(kind)` + trigger insert pada `venues`, `buildings`, `floors` (bukan Area Luar), `info_points`.
  3. UI: tombol tambah dinonaktifkan saat kuota penuh dengan pesan "Kuota paket tercapai".
- **File:** migrasi kuota, `apps/admin/src/features/license/Status.tsx`
- **Selesai jika:**
  - [ ] Menambah Info Point ke-11 pada kuota 10 ditolak di UI dan lewat API langsung
  - [ ] Pemakaian tampil benar
- **Jangan:** menghitung Area Luar sebagai lantai.

### T-405 · Fitur per paket

- **Untuk:** FR-LIC-07
- **Bergantung pada:** T-404
- **Langkah:**
  1. Daftar fitur berbayar di `packages/domain/src/entitlements.ts`: `3d`, `info_point`, `cad_import`.
  2. Admin: kontrol fitur yang tidak ada di paket terkunci dengan keterangan.
  3. Snapshot: `enabledFeatures` diisi dari lisensi; Visitor menyembunyikan fitur yang tidak ada.
- **File:** `packages/domain/src/entitlements.ts`, `supabase/functions/publish/`
- **Selesai jika:**
  - [ ] Tanpa fitur `3d`, tombol 3D tidak ada di Admin maupun Visitor
- **Jangan:** hanya menyembunyikan di UI; publish juga menghormati lisensi.

### T-406 · Pengingat, masa tenggang, kedaluwarsa, perubahan paket

- **Untuk:** FR-LIC-08, FR-LIC-09, FR-LIC-10, FR-VST-15
- **Bergantung pada:** T-403, T-404
- **Langkah:**
  1. Banner Admin pada H-30, H-7, H-1.
  2. Masa tenggang 14 hari: semua operasi tulis ditolak server (fungsi `app.license_writable()` dipakai di kebijakan RLS tulis); Visitor tetap jalan.
  3. Setelah tenggang: Admin hanya halaman Lisensi; `latest.json` diganti penanda layanan tidak aktif sehingga Visitor menampilkan pesan (ID/EN).
  4. Lisensi baru → langsung aktif kembali tanpa kehilangan data.
  5. Downgrade dengan pemakaian berlebih: data tetap; penambahan dan publish ditolak sampai pemakaian ≤ kuota; halaman Lisensi menunjukkan apa yang harus dikurangi.
- **File:** migrasi `app.license_writable`, `apps/admin/src/features/license/**`, `apps/visitor/src/features/service/**`
- **Selesai jika:**
  - [ ] Banner muncul pada H-30, H-7, H-1 (uji dengan lisensi bertanggal dekat)
  - [ ] Hari ke-1 s.d. 14 setelah berakhir: Admin read-only, Visitor normal
  - [ ] Setelah hari ke-14: Visitor menampilkan pesan layanan tidak aktif
  - [ ] Lisensi baru memulihkan semuanya
- **Jangan:** menghapus data apa pun karena lisensi berakhir.

### T-407 · Info Point di Admin

- **Untuk:** FR-DEV-03, FR-DEV-04
- **Bergantung pada:** T-404
- **Langkah:**
  1. Titik Asal → tab Info Point: tambah (kode, nama, gedung, lantai, posisi, arah hadap), snap ke jalur.
  2. Konfigurasi: mode default 2D/3D, paksa 2D, bahasa default, durasi idle (15–600 s).
  3. Tombol "Salin URL Info Point" (URL publik + `/ip/{code}`) dan "Preview".
- **File:** `apps/admin/src/features/info-points/**`
- **Selesai jika:**
  - [ ] URL Info Point membuka Visitor dalam mode Info Point dengan posisi benar
  - [ ] Kuota Info Point ditegakkan
- **Jangan:** membuat pairing/heartbeat (F2).

### T-408 · Mode Info Point

- **Untuk:** FR-IP-01, FR-IP-02, FR-IP-03, FR-IP-05, FR-IP-08, NFR-COMP-04, NFR-USE-01
- **Bergantung pada:** T-407
- **Langkah:**
  1. Route `/ip/:code`: layar penuh (Fullscreen API bila diizinkan), tata letak potret/lanskap sesuai wireframe.
  2. Titik asal tetap dari Info Point; tidak ada kontrol mengganti titik asal; peta diputar sesuai arah hadap.
  3. Ukuran dasar 20 px, target sentuh ≥ 60 px, keyboard virtual sendiri (QWERTY + angka), tidak memunculkan keyboard OS.
  4. Idle: setelah `idle_seconds` tanpa sentuhan, hapus pencarian/rute, kembali ke tampilan awal dan bahasa default.
  5. Paksa 2D menyembunyikan tombol 3D.
  6. Nonaktifkan seleksi teks, klik kanan, zoom browser dengan pinch di luar peta.
- **File:** `apps/visitor/src/infopoint/**`
- **Selesai jika:**
  - [ ] Pencarian bisa dilakukan seluruhnya dengan keyboard di layar
  - [ ] Setelah idle, tampilan dan bahasa kembali ke default
  - [ ] Tampilan benar di 1080 × 1920 dan 1920 × 1080
- **Jangan:** menampilkan iklan atau konten promosi.

### T-409 · Lanjutkan di HP, pembaruan otomatis, tahan jaringan

- **Untuk:** FR-IP-04, FR-IP-06, FR-IP-07, NFR-REL-03
- **Bergantung pada:** T-408
- **Langkah:**
  1. Setelah rute tampil: QR (≥ 200 px) berisi deep link asal Info Point + tujuan + mode aksesibel + bahasa.
  2. Periksa `latest.json` setiap 5 menit; jika versi baru, unduh di latar dan tukar hanya saat idle.
  3. Snapshot terakhir dan aset disimpan oleh service worker; tanpa jaringan, pencarian dan rute tetap jalan; indikator kecil "offline" untuk teknisi.
- **File:** `apps/visitor/src/infopoint/**`, konfigurasi service worker
- **Selesai jika:**
  - [ ] QR membuka rute yang sama di HP
  - [ ] Versi baru termuat setelah publish, tetapi tidak saat layar sedang dipakai
  - [ ] Dengan server diputus, pencarian dan rute tetap berfungsi
- **Jangan:** memakai Realtime/WebSocket.

### T-410 · Branding Visitor

- **Untuk:** FR-VIS-07
- **Bergantung pada:** T-117
- **Langkah:**
  1. Pengaturan → Branding: logo, warna utama, warna rute, nama tampilan; pratinjau Visitor langsung.
  2. Cek kontras otomatis; jika warna teks di atas warna utama tidak lolos AA, pakai `--ink` atau putih.
  3. Disertakan di snapshot (`venue.branding`) dan dipakai Visitor serta Info Point.
- **File:** `apps/admin/src/features/settings/Branding.tsx`, `packages/ui/src/theme/applyBranding.ts`
- **Selesai jika:**
  - [ ] Logo, warna, dan nama tampil di Visitor dan Info Point setelah publish
  - [ ] Warna kuning muda sebagai warna utama tetap menghasilkan teks yang terbaca
- **Jangan:** mengizinkan font kustom (di luar lingkup).

### T-411 · Paket instalasi, HTTPS, backup, pembaruan

- **Untuk:** NFR-MNT-01, NFR-SEC-01, NFR-REL-01, NFR-REL-02
- **Bergantung pada:** T-402
- **Langkah:**
  1. `deploy/`: Docker Compose berisi Supabase self-host (komponen yang dipakai saja), build statis Admin dan Visitor di balik reverse proxy (Caddy) dengan HTTPS otomatis atau sertifikat klien, layanan `cad-converter`.
  2. `deploy/install.sh`: cek prasyarat, buat `.env` dari input, jalankan migrasi, tampilkan URL aktivasi.
  3. Backup harian database + Storage ke folder lokal (retensi 14 hari) dan `deploy/restore.sh`.
  4. `deploy/upgrade.sh`: backup otomatis → tarik versi baru → migrasi → health check → rollback otomatis jika gagal.
  5. `deploy/README.md`: spesifikasi server minimum, port, langkah instalasi, pembaruan, pemulihan.
- **File:** `deploy/**`
- **Selesai jika:**
  - [ ] Instalasi dari nol di VM bersih (Ubuntu LTS) berhasil mengikuti README
  - [ ] Restore dari backup mengembalikan data
  - [ ] Upgrade gagal (migrasi rusak disengaja) kembali ke versi sebelumnya tanpa kehilangan data
- **Jangan:** menyertakan private key vendor atau kredensial default yang lemah.

### T-412 · Pengujian performa, kompatibilitas, dan pengerasan

- **Untuk:** NFR-PERF-01, NFR-PERF-02, NFR-PERF-03, NFR-CAP-01, NFR-COMP-01, NFR-COMP-02, NFR-USE-01
- **Bergantung pada:** T-409, T-411
- **Langkah:**
  1. Fixture besar: venue 10 lantai, 2.000 fitur, graf 20.000 edge.
  2. Ukur: muat awal Visitor (4G tersimulasi) ≤ 3 s, kunjungan ulang ≤ 1,5 s, rute ≤ 500 ms (HP kelas menengah), editor lancar dengan 1.000 fitur.
  3. Uji beban sederhana (k6): 200 pengunjung + 20 admin bersamaan pada paket instalasi.
  4. Matriks browser: Chrome, Edge, Safari, Firefox (dua versi terbaru); Android 10+, iOS 15+.
  5. Audit aksesibilitas (axe) untuk Admin dan Visitor.
  6. Laporan hasil di `docs/laporan-performa.md`.
- **File:** `tests/perf/**`, `docs/laporan-performa.md`
- **Selesai jika:**
  - [ ] Semua target terpenuhi atau selisihnya dijelaskan dengan rencana perbaikan
  - [ ] Tidak ada pelanggaran axe tingkat serius
- **Jangan:** menurunkan target tanpa keputusan tertulis.
