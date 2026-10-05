# 21 · F2 Fase 2: daftar task

Pecahan `20-F2-fase-2.md` menjadi task yang siap dikerjakan satu per satu. Formatnya sama dengan
`10-R0-fondasi.md` s.d. `14-R4-komersial.md`. Kriteria lengkap setiap FR ada di `docs/spec/`
(cari ID-nya).

**Prasyarat:** R0–R4 sudah di-review pemilik. Urutan yang disarankan: F2-A (siap jual), lalu
F2-B (pengerasan), F2-C (instalasi lanjutan), dan F2-D sampai F2-G (fitur).

**Aturan tetap berlaku:**
- logika di `packages/domain` dan `packages/routing` wajib disertai test;
- skema hanya berubah lewat migrasi baru;
- otorisasi di server;
- teks Admin berbahasa Indonesia;
- teks Visitor lewat i18n ID/EN.

**Gerbang selesai F2-A:** produk tampil sebagai PanduArah. Calon klien bisa meminta trial dari
landing page, vendor menerbitkan lisensi trial, dan semua tabel Admin punya cari, filter, dan
pagination.

---

## F2-A · Siap jual

### T-501 · Nama produk PanduArah

- **Untuk:** keputusan pemilik 2026-10-05 (`20-F2-fase-2.md` §2.3)
- **Bergantung pada:** —
- **Langkah:**
  1. Ganti teks "Indoor Map" yang terlihat pengguna menjadi **PanduArah**:
     - `<title>` dan header Admin dan Visitor;
     - manifest PWA (`name`, `short_name`) dan ikon;
     - template email `auth-email` dan `account-notice`;
     - i18n ID/EN;
     - `deploy/README.md`, `README.md`, dan dokumen produk.
  2. Tagline Inggris di manifest dan halaman tentang: "PanduArah — Indoor Navigation".
  3. Nama paket kode (`@indoor/*`), nama tabel, dan istilah teknis tidak diganti.
  4. Cari sisa teks dengan `rg -i "indoor map"` dan pastikan hanya tersisa di kode internal.
- **File:** `apps/*/index.html`, `apps/*/vite.config.ts`, `apps/visitor/src/i18n/*.json`, `supabase/functions/{auth-email,account-notice}/**`, `apps/*/public/icons/**`, dokumen
- **Selesai jika:**
  - [ ] Tidak ada teks "Indoor Map" yang terlihat di Admin, Visitor, Info Point, email, dan PWA
  - [ ] E2E yang memeriksa judul diperbarui dan lulus
- **Jangan:** mengganti nama paket workspace atau skema database.

### T-502 · Komponen tabel: cari, filter, pagination

- **Untuk:** `20-F2-fase-2.md` §2.5
- **Bergantung pada:** —
- **Langkah:**
  1. `packages/ui`: komponen `DataTable` yang terdiri dari:
     - kolom cari;
     - slot filter (select, multi-select, rentang tanggal);
     - pagination (10/25/50/100 baris per halaman, nomor halaman, total data);
     - keadaan kosong, memuat, dan galat.
  2. Hook `useTableState` menyimpan `q`, filter, `page`, dan `size` di URL (React Router).
  3. `packages/data`: pola `listPage({ q, filters, page, size })` → `{ rows, total }` memakai
     `range()` dan `count: 'exact'`. Pencarian server dengan `ilike` atau `unaccent` sesuai
     indeks yang ada.
  4. Test: hook URL (Vitest) dan pola repository (integrasi untuk satu tabel contoh).
- **File:** `packages/ui/src/components/data-table/**`, `apps/admin/src/hooks/use-table-state.ts`, `packages/data/src/pagination.ts`
- **Selesai jika:**
  - [ ] Galeri UI menampilkan `DataTable` dengan cari, filter, dan pagination
  - [ ] Muat ulang halaman mempertahankan cari, filter, dan halaman dari URL
- **Jangan:** memakai library tabel berat (> ±100 kB gzip) tanpa persetujuan.

### T-503 · Terapkan tabel ke semua halaman Admin

- **Untuk:** `20-F2-fase-2.md` §2.5
- **Bergantung pada:** T-502
- **Langkah:**
  1. Terapkan `DataTable` ke tabel berikut, dengan filter yang sesuai:
     - Venue (tipe venue);
     - Gedung;
     - Lantai (gedung);
     - Riwayat denah;
     - Lokasi (status, kategori, tipe, lantai);
     - Kategori;
     - Tipe lokasi dan kolom kustom;
     - Jenis fasilitas (keselamatan);
     - Penutupan (aktif/terjadwal/selesai, rentang tanggal);
     - Titik Asal (lantai);
     - Info Point (lantai, mode);
     - Riwayat publish (rentang tanggal);
     - Pengguna (role, aktif/terkunci);
     - Log audit (aksi, pengguna, tanggal);
     - Template instruksi;
     - Lisensi;
     - pratinjau impor.
  2. Tabel yang bisa > 500 baris (Lokasi, Log audit, Riwayat publish, Penutupan) difilter dan
     dibagi halaman di server; tabel kecil boleh di klien.
  3. E2E: Lokasi dan Log audit (cari, filter, pindah halaman, muat ulang).
- **File:** halaman Admin terkait, repository `packages/data`
- **Selesai jika:**
  - [ ] 17 tabel memakai `DataTable`
  - [ ] Lokasi dengan 2.000 baris tetap responsif (< 500 ms per perubahan filter)
- **Jangan:** menyembunyikan data yang tidak boleh dilihat sebagai pengganti RLS.

### T-504 · Lisensi trial

- **Untuk:** `20-F2-fase-2.md` §2.2
- **Bergantung pada:** —
- **Konteks:** sebelum mulai, pemilik memutuskan dua hal:
  1. Trial diterbitkan vendor per permintaan, atau aktif otomatis saat instalasi?
  2. Masa tenggang trial tetap 14 hari, dipersingkat, atau ditiadakan?
- **Langkah:**
  1. Domain `license.ts`: plan `trial` dengan validasi durasi 14–30 hari, plus test.
  2. `license-cli issue --plan trial --days 14..30`. Vendor-stub menolak trial kedua untuk
     `instanceId` yang sama.
  3. Server: `license_status()` mengembalikan `isTrial`. Masa tenggang trial mengikuti keputusan
     pemilik (migrasi baru bila berubah).
  4. Admin: banner "Trial — sisa N hari" di semua halaman; halaman Lisensi menandai trial.
  5. Upgrade ke berbayar: pasang lisensi baru tanpa menghapus data (uji E2E).
- **File:** `packages/domain/src/license.ts`, `tools/license-cli/**`, `tools/vendor-stub/**`, migrasi baru, `apps/admin/src/features/license/**`
- **Selesai jika:**
  - [ ] Lisensi trial 14 dan 30 hari bisa diterbitkan; 31 hari ditolak
  - [ ] Trial kedua untuk instalasi yang sama ditolak vendor
  - [ ] Banner sisa hari tampil, dan data tetap ada setelah upgrade ke lisensi berbayar
- **Jangan:** menyimpan kunci privat vendor di repo.

### T-505 · Landing page dan form permintaan trial

- **Untuk:** `20-F2-fase-2.md` §2.4
- **Bergantung pada:** T-501, T-504
- **Konteks:** situs vendor, terpisah dari paket instalasi klien. Email tujuan:
  panduarahid@gmail.com.
- **Langkah:**
  1. `apps/landing` (Vite statis, desain `05-desain-ui.md`, i18n ID/EN), berisi:
     - pengenalan dan jenis gedung;
     - fitur utama;
     - cara kerja;
     - model on-premise dan lisensi;
     - tangkapan layar.
  2. Form permintaan trial dengan isian:
     - nama, instansi, jabatan, email, dan telepon;
     - jenis dan ukuran gedung;
     - durasi 14–30 hari;
     - ID instalasi (opsional);
     - persetujuan privasi.
  3. Pengiriman form: endpoint kecil (Edge Function di server vendor) yang memvalidasi isian,
     membatasi laju per IP, memasang honeypot, lalu mengirim email ke vendor dan email
     konfirmasi ke pemohon lewat SMTP (App Password atau layanan kirim email).
  4. Halaman kebijakan privasi singkat.
  5. Test: validasi form (unit) dan E2E kirim form ke SMTP tiruan (Mailpit).
- **File:** `apps/landing/**`, fungsi pengirim di server vendor
- **Selesai jika:**
  - [ ] Form terkirim ke email vendor dan pemohon menerima konfirmasi
  - [ ] Spam sederhana (honeypot terisi, > 5 kirim per menit per IP) ditolak
  - [ ] Lighthouse mobile: performa ≥ 90, aksesibilitas ≥ 95
- **Jangan:** menyimpan password Gmail di repo atau di kode klien.

---

## F2-B · Pengerasan lanjutan

### T-511 · Distribusi image Docker jadi

- **Untuk:** `20-F2-fase-2.md` §2.7
- **Bergantung pada:** —
- **Langkah:**
  1. Build rilis di sisi vendor (`deploy/build-release.sh`): menolak kunci dev, lalu build image
     `web`, `functions`, dan `cad` dengan tag versi.
  2. Distribusi image: push ke registry privat vendor, atau `docker save` ke arsip untuk
     klien offline.
  3. Paket untuk klien hanya berisi `compose.yml` (memakai `image:`, tanpa `build:`), skrip
     `deploy/`, dan migrasi SQL, tanpa kode sumber aplikasi.
  4. `install.sh` dan `upgrade.sh` memakai `docker load`/`pull` versi tertentu, bukan
     `git checkout` + build.
  5. README memuat alur rilis vendor dan alur pasang di klien.
- **File:** `deploy/**`
- **Selesai jika:**
  - [ ] Instalasi dari arsip rilis di mesin bersih tanpa internet berhasil
  - [ ] Paket klien tidak memuat `apps/`, `packages/`, maupun kunci lisensi publik yang bisa diganti
  - [ ] Upgrade dan rollback tetap berjalan seperti T-411

### T-512 · Visitor tanpa WebGL

- **Untuk:** `20-F2-fase-2.md` §2.7
- **Bergantung pada:** —
- **Langkah:**
  1. `packages/map-core`: `supportsWebGL()`.
  2. Visitor: bila WebGL tidak tersedia, tampilkan pesan "Perangkat ini tidak mendukung peta"
     (i18n). Pencarian, kartu lokasi, dan daftar langkah rute tetap jalan tanpa peta.
  3. Info Point: pesan yang sama, versi layar besar.
  4. Test: E2E dengan WebGL dimatikan (`--disable-webgl` di Chromium).
- **Selesai jika:**
  - [ ] Tanpa WebGL, cari "Radiologi" dan rute dari titik asal tetap menampilkan langkah
  - [ ] Tidak ada layar "Terjadi kesalahan"

### T-513 · Performa kunjungan ulang dan uji perangkat nyata

- **Untuk:** NFR-PERF-01, NFR-COMP-01/02, `20-F2-fase-2.md` §2.7
- **Bergantung pada:** —
- **Langkah:**
  1. Jalankan `tests/perf/specs/visitor.perf.ts` di HP Android kelas menengah sungguhan (remote
     debugging) dan catat hasilnya di `docs/laporan-performa.md`.
  2. Bila kunjungan ulang masih > 1,5 s:
     - cache indeks pencarian hasil olahan di IndexedDB per versi snapshot;
     - tunda pembuatan daftar A–Z dan chip sampai peta tampil.
  3. Uji manual dengan daftar periksa alur `tests/perf/specs/compat.compat.ts` di Firefox, Edge,
     Safari macOS, iOS 15, dan Android 10.
- **Selesai jika:**
  - [ ] Angka di HP sungguhan tercatat; target terpenuhi atau selisihnya dijelaskan
  - [ ] Hasil uji manual tiap browser dan perangkat tercatat di laporan

### T-514 · Perbaikan lisensi dan audit dari R4

- **Untuk:** `20-F2-fase-2.md` §2.7
- **Bergantung pada:** —
- **Langkah:**
  1. **E2E `cad-floor-plan`:** spec memasang lisensi dengan fitur `cad_import` lewat
     `devLicenseFile({ features })`, lalu memulihkan lisensi semula.
  2. **`cad_import` di server:** `cad-converter` memeriksa fitur lisensi lewat RPC
     `license_features()` dengan sesi pemanggil. Tanpa fitur itu, layanan membalas 403.
  3. **Masa tenggang di Admin:** tombol tulis dinonaktifkan dengan keterangan "masa tenggang".
     Penegakan server tetap.
  4. **Pelaku audit aktivasi:** `license_install` menerima `actor_id` dari Edge Function
     `license-activate` sehingga log mencatat nama Super Admin.
- **Selesai jika:**
  - [ ] `cad-floor-plan.spec.ts` lulus
  - [ ] Konversi DXF ditolak server tanpa `cad_import`
  - [ ] Log audit aktivasi menyebut nama Super Admin

---

## F2-C · Instalasi lanjutan

### T-521 · Panduan Windows lewat VM Ubuntu

- **Untuk:** `20-F2-fase-2.md` §2.6 opsi 1
- **Bergantung pada:** —
- **Langkah:** tambahkan ke `deploy/README.md` bagian "Server Windows" yang memuat:
  - Hyper-V dan VMware: membuat VM Ubuntu beserta spesifikasinya;
  - jaringan VM (bridge, atau NAT dengan port forwarding 80/443);
  - firewall Windows;
  - VM menyala otomatis saat host reboot;
  - backup VM ditambah backup aplikasi;
  - pemecahan masalah umum.
- **Selesai jika:**
  - [ ] Instalasi di VM Hyper-V mengikuti panduan berhasil, dan Visitor bisa dibuka dari jaringan kantor

### T-522 · Database PostgreSQL milik klien

- **Untuk:** `20-F2-fase-2.md` §2.1
- **Bergantung pada:** T-511 (disarankan)
- **Langkah:**
  1. `install.sh --database external`:
     - isian host, port, nama database, akun instalasi, dan SSL;
     - cek versi 15+ dan ekstensi PostGIS, pg_cron, pg_net;
     - membuat role Supabase dan skema `auth`, `storage`, `app` dengan password acak.
  2. `compose.yml` dengan profil tanpa layanan `db`.
  3. Backup hanya file Storage dan `.env`. `upgrade.sh` meminta konfirmasi bahwa DBA sudah
     membuat backup sebelum migrasi; rollback aplikasi tetap otomatis.
  4. `deploy/README.md`: daftar periksa DBA (`shared_preload_libraries`, `cron.database_name`,
     `pg_hba`, SSL).
- **Selesai jika:**
  - [ ] Instalasi ke PostgreSQL 17 terpisah (container lain) berhasil sampai Visitor tampil
  - [ ] Installer berhenti dengan pesan jelas bila salah satu ekstensi tidak ada
- **Jangan:** mendukung database selain PostgreSQL.

### T-523 · Dukungan Windows Server langsung

- **Untuk:** `20-F2-fase-2.md` §2.6 opsi 2
- **Bergantung pada:** T-521, T-511
- **Langkah:**
  1. Padanan PowerShell untuk `install`, `backup`, `restore`, dan `upgrade` (`deploy/windows/*.ps1`).
  2. Docker di WSL2 atau Docker Desktop. Cek lisensi Docker Desktop untuk perusahaan besar dan
     tulis rekomendasinya.
  3. Jadwal backup lewat Task Scheduler; layanan menyala otomatis setelah reboot.
  4. Uji di Windows Server 2022/2025.
- **Selesai jika:**
  - [ ] Instalasi, backup, restore, dan upgrade-rollback lulus di Windows Server sungguhan

---

## F2-D · Admin dan data

### T-531 · Hak akses granular

- **Untuk:** FR-AUTH-06
- **Langkah:**
  - matriks izin per modul (lokasi, peta, rute, penutupan, publish, pengguna) per pengguna, di
    samping role;
  - fungsi izin SQL membaca matriks;
  - UI Pengguna;
  - pgTAP per modul.
- **Selesai jika:** pengguna dengan izin "hanya lokasi" ditolak server saat mengubah peta.

### T-532 · Audit log lengkap

- **Untuk:** FR-AUTH-07
- **Konteks:** log audit dasar sudah ada (Pengaturan → Log audit). Lengkapi cakupannya.
- **Langkah:**
  - semua tabel yang bisa diubah tercatat (siapa, apa, kapan, nilai sebelum dan sesudah);
  - retensi yang bisa diatur;
  - export CSV.
- **Selesai jika:** perubahan di setiap modul muncul di log, lengkap dengan diff.

### T-533 · Label kustom per venue

- **Untuk:** FR-VEN-11
- **Langkah:**
  - kamus istilah per venue (mis. "Lokasi" → "Poli & Ruangan");
  - dipakai di Admin dan Visitor (ID/EN);
  - nilai bawaan dari template tipe venue.
- **Selesai jika:** istilah yang diganti tampil di menu Admin dan di Visitor.

### T-534 · Duplikasi lantai

- **Untuk:** FR-VEN-13
- **Langkah:** fungsi SQL atomik yang menyalin fitur, node, dan edge lantai ke lantai baru (id
  baru, konektor tidak disalin), dengan tombol di daftar lantai.
- **Selesai jika:** lantai hasil salinan lolos validasi publish dan rute di dalamnya jalan.

### T-535 · Riwayat lisensi

- **Untuk:** FR-LIC-13
- **Langkah:** daftar lisensi yang pernah aktif (waktu, sumber check-in atau manual, paket) di
  halaman Lisensi, memakai `DataTable`.
- **Selesai jika:** pergantian lisensi tercatat berurutan.

### T-536 · Publish terjadwal

- **Untuk:** FR-PUB-09
- **Langkah:**
  - jadwal publish (tanggal dan jam, zona waktu venue) disimpan di tabel;
  - `pg_cron` menjalankannya lewat Edge Function `publish` dengan identitas penjadwal;
  - gagal validasi → batal, ada notifikasi, dan tercatat di audit.
- **Selesai jika:** draft terbit otomatis pada waktunya, dan jadwal bisa dibatalkan.

---

## F2-E · Peta dan tampilan

### T-541 · Landmark dan instruksi berbasis landmark

- **Untuk:** FR-MAP-11, FR-NAV-12
- **Langkah:**
  - tanda landmark pada fitur;
  - `packages/routing` menyebut landmark terdekat di instruksi ("belok kiri setelah Atrium
    Utama"), dengan test;
  - template instruksi baru.
- **Selesai jika:** rute melewati landmark dan menyebut landmark itu di langkahnya.

### T-542 · Kontrol label

- **Untuk:** FR-MAP-12
- **Langkah:** posisi label, prioritas, dan rentang zoom per fitur, diatur di editor dan
  diterapkan di `map-core`.
- **Selesai jika:** label prioritas tinggi tetap tampil saat label lain bertabrakan.

### T-543 · Area temporer

- **Untuk:** FR-MAP-13
- **Langkah:**
  - fitur dengan tanggal mulai dan selesai;
  - Visitor menyaring menurut waktu sekarang tanpa publish ulang (seperti penutupan);
  - test domain.
- **Selesai jika:** booth tampil dan hilang sesuai jadwal.

### T-544 · Export peta cetak

- **Untuk:** FR-MAP-15
- **Langkah:** export per lantai ke PDF atau SVG resolusi tinggi dengan legenda, judul, dan arah
  utara, dibuat di browser dari `map-core`.
- **Selesai jika:** PDF A3 terbaca jelas saat dicetak.

### T-545 · Warna per kategori dan lantai bertumpuk

- **Untuk:** FR-VIS-08, FR-VIS-09
- **Langkah:**
  - warna unit dari tipe atau kategori lokasi;
  - pengaturan jarak antarlantai dan transparansi lantai non-aktif pada mode 3D;
  - pratinjau di Pengaturan Tampilan.
- **Selesai jika:** perubahan warna dan transparansi terlihat di Visitor setelah publish.

### T-546 · Pintu masuk venue

- **Untuk:** FR-VEN-12
- **Langkah:**
  - menandai pintu masuk dan titik drop-off, masing-masing dengan tautan Google Maps;
  - tampil di info venue Visitor.
- **Selesai jika:** pengunjung bisa membuka arah ke pintu masuk lewat Google Maps.

### T-547 · Import vektor CAD

- **Untuk:** FR-VEN-14
- **Bergantung pada:** T-313
- **Langkah:**
  - `cad-converter` mengekspor layer terpilih ke GeoJSON (dinding sebagai garis, ruang sebagai
    poligon) dengan georeferensi denah;
  - pratinjau lalu impor menjadi draft fitur yang bisa dirapikan.
- **Selesai jika:** denah DXF contoh menghasilkan unit yang lolos validasi geometri setelah dirapikan.

### T-548 · Scan otomatis denah gambar (tahap 1)

- **Untuk:** `20-F2-fase-2.md` §2.8 (FR-VEN-14 lanjutan)
- **Bergantung pada:** T-105/T-106 (denah dan georeferensi), T-313 (`cad-converter`)
- **Konteks:** pengguna mengunggah gambar denah lalu menekan Scan; garis dinding dan blok ruang
  dibuat otomatis sebagai draft. Tambah `opencv-python-headless` (Apache-2.0) ke `cad-converter`.
  Ukurannya besar, jadi tulis alasannya di PR dan minta persetujuan pemilik sebelum
  menambahkannya.
- **Langkah:**
  1. Endpoint `cad-converter` `POST /scan` menerima gambar denah (PNG/JPG; PDF dirender di Admin
     seperti T-105) dan parameter kepekaan. Langkah pengolahannya:
     - grayscale, threshold adaptif, morfologi untuk menutup celah pintu kecil;
     - buang teks dan simbol kecil (komponen di bawah ukuran minimum);
     - dinding: skeleton atau garis Hough, digabung dan disederhanakan (Douglas–Peucker),
       sudut diluruskan ke 0/90° bila dekat;
     - ruang: kontur tertutup dalam piksel → poligon, luas minimum, tanpa lubang kecil;
     - keluaran JSON dalam koordinat piksel dan skor keyakinan per objek.
  2. `packages/domain`: ubah piksel ke WGS84 memakai transformasi georeferensi denah
     (`transform.ts`), lalu periksa hasilnya dengan validasi geometri yang ada. Test dengan
     fixture gambar sederhana.
  3. Admin (editor denah):
     - tombol **Scan** dengan kepekaan rendah, sedang, atau tinggi;
     - pratinjau dinding dan ruang di atas denah, diwarnai menurut keyakinan;
     - pilih semua, pilih per objek, atau buang;
     - impor sebagai draft fitur (ruang → unit, dinding → garis) yang bisa diundo.
  4. Batas: gambar ≤ 50 MB atau ≤ 8000 px sisi terpanjang, waktu proses ≤ 30 s, dengan pesan
     jelas bila melewati batas.
  5. Fixture uji: 3 denah (sederhana, sedang, dengan banyak teks), disimpan di
     `services/cad-converter/tests/fixtures/`.
  6. Hormati fitur lisensi `cad_import` seperti konversi DXF (T-514).
- **File:** `services/cad-converter/app/scan.py`, `services/cad-converter/tests/**`, `packages/domain/src/scan-import.ts`, `packages/data/src/repositories/cad-converter.ts`, `apps/admin/src/features/floor-plans/scan/**`
- **Selesai jika:**
  - [ ] Denah sederhana: ≥ 90% ruang terdeteksi sebagai poligon dengan posisi sesuai gambar (± 0,5 m setelah georeferensi)
  - [ ] Hasil scan bisa dipilih sebagian, diimpor sebagai draft, lalu diundo
  - [ ] Unit hasil impor lolos validasi publish setelah dirapikan
  - [ ] Gambar di luar batas ditolak dengan pesan, tanpa membuat layanan crash
- **Jangan:** mengirim gambar denah ke layanan pihak ketiga atau cloud; semua diproses di server klien.

### T-549 · Scan otomatis denah dengan model AI (tahap 2)

- **Untuk:** `20-F2-fase-2.md` §2.8
- **Bergantung pada:** T-548
- **Konteks:** dikerjakan hanya bila evaluasi T-548 menunjukkan hasil kurang untuk denah rumit
  (miring, foto, banyak arsiran). Butuh keputusan pemilik soal model dan lisensinya.
- **Lisensi model (wajib dicek lebih dulu):** banyak model deteksi denah dilatih dengan dataset
  berlisensi **non-komersial** (mis. CubiCasa5K), sehingga tidak boleh dipakai di produk yang
  dijual. Pilihan, sesuai urutan:
  1. model yang lisensi bobot dan dataset latihnya mengizinkan pemakaian komersial;
  2. melatih model sendiri dengan denah yang izin pemakaiannya jelas (biaya pelabelan dan GPU
     sekali saat pelatihan);
  3. membeli lisensi model komersial.

  Layanan AI cloud berbayar per pemakaian tidak dipakai, karena denah klien tidak boleh keluar
  dari server klien.
- **Langkah:**
  1. Evaluasi model segmentasi denah sumber terbuka berlisensi permisif yang bisa jalan di CPU
     server (ONNX Runtime), dengan kelas dinding, pintu, jendela, dan ruang.
  2. Mode **Scan (AI)** memakai keluaran model, dilanjutkan pascaproses yang sama dengan T-548.
     Pintu terdeteksi menjadi fitur pintu.
  3. Bandingkan dengan tahap 1 di set fixture yang sama, lalu catat akurasi dan waktu di laporan.
- **Selesai jika:**
  - [ ] Akurasi ruang pada denah rumit naik nyata dibanding T-548 (angka di laporan)
  - [ ] Proses ≤ 60 s per denah di CPU 4 inti
- **Jangan:** memakai model atau API yang mengirim data ke luar server klien.

---

## F2-F · Navigasi dan Visitor

### T-551 · Aturan jalur dan bobot preferensi

- **Untuk:** FR-NAV-13, FR-NAV-14
- **Langkah:**
  - edge satu arah;
  - edge dengan jam buka (zona waktu venue);
  - penalti per jenis konektor (utamakan eskalator, hindari tangga);
  - test A* di `packages/routing`.
- **Selesai jika:** rute menghindari edge yang tutup pada jamnya dan tidak melawan arah satu arah.

### T-552 · Estimasi waktu tempuh

- **Untuk:** FR-NAV-15, FR-VST-17
- **Langkah:**
  - kecepatan jalan bawaan dan aksesibel;
  - waktu per jenis konektor;
  - ditampilkan di ringkasan rute (i18n).
- **Selesai jika:** ringkasan rute menampilkan perkiraan menit yang konsisten dengan jarak.

### T-553 · Fasilitas terdekat dan rute multi-tujuan

- **Untuk:** FR-VST-16, FR-VST-23
- **Langkah:**
  - "Toilet/lift terdekat" dari titik asal (jarak rute, bukan garis lurus);
  - beberapa tujuan berurutan dalam satu rute, dengan langkah per segmen.
- **Selesai jika:** "Toilet terdekat" memilih toilet dengan rute terpendek, dan rute 3 tujuan tampil berurutan.

### T-554 · Konten multi-bahasa

- **Untuk:** FR-LOC-11, FR-VST-18
- **Langkah:**
  - kolom terjemahan EN untuk nama kategori dan deskripsi lokasi;
  - masuk snapshot;
  - Visitor memakai bahasa terpilih dan jatuh ke ID bila kosong.
- **Selesai jika:** Visitor EN menampilkan deskripsi EN.

### T-555 · Lapisan keselamatan dan mode teks

- **Untuk:** FR-VST-20, FR-VST-21
- **Langkah:**
  - tombol lapisan keselamatan (APAR, pintu darurat, titik kumpul) dan rute ke pintu keluar
    terdekat;
  - mode teks: instruksi dan hasil cari bisa dipakai tanpa peta;
  - audit WCAG 2.2 AA.
- **Selesai jika:** axe dan uji pembaca layar (NVDA/VoiceOver) lulus untuk alur cari dan rute.

### T-556 · Embed, minimap, dan peta privat

- **Untuk:** FR-VST-22, FR-VST-24, FR-VST-25
- **Langkah:**
  - kode embed (iframe) dan tautan langsung;
  - minimap statis per lokasi yang membuka Visitor saat diklik;
  - opsi venue privat: Visitor hanya untuk pengguna login. Snapshot privat tidak boleh ada di
    bucket publik, jadi butuh desain akses Storage baru.
- **Konteks:** peta privat menyentuh keamanan. Jalankan `ecc-security-review` sebelum PR.
- **Selesai jika:** embed tampil di halaman HTML lain, dan venue privat menolak akses tanpa login.

---

## F2-G · Perangkat Info Point

### T-561 · Pairing, status, dan reload jarak jauh

- **Untuk:** FR-DEV-05, FR-DEV-06, FR-DEV-07, FR-IP-10
- **Langkah:**
  - pairing perangkat dengan kode sekali pakai;
  - heartbeat berkala (online/offline, terakhir aktif, versi peta);
  - perintah reload dari Admin;
  - daftar perangkat memakai `DataTable`.
- **Selesai jika:** perangkat yang dimatikan tampil offline dalam ≤ 2 menit, dan reload dari Admin dijalankan perangkat.

### T-562 · Shell Windows (WPF)

- **Untuk:** FR-DEV-08
- **Bergantung pada:** T-561
- **Langkah:** aplikasi Windows pembungkus WebView2 dengan:
  - auto-start;
  - layar penuh terkunci;
  - watchdog bila crash;
  - konfigurasi URL Info Point.
- **Selesai jika:** perangkat Windows menyala langsung ke Info Point dan pulih sendiri setelah crash.

### T-563 · Mode aksesibilitas Info Point

- **Untuk:** FR-IP-09
- **Langkah:** tombol yang menurunkan area antarmuka (jangkauan kursi roda), kontras tinggi, dan
  huruf besar; kembali normal saat idle.
- **Selesai jika:** semua kontrol penting berada di sepertiga bawah layar potret saat mode aktif.

---

## Backlog (tidak dijadwalkan)

| ID | Fitur |
| --- | --- |
| FR-MAP-14 | Model 3D GLB dengan Three.js (posisi, skala, rotasi) |
| FR-NAV-16 | Mode evakuasi diaktifkan dari Admin |
| FR-DEV-09 | Beacon dan blue dot |
