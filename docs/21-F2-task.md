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

## Roadmap rilis F2

F2 dikerjakan bertahap. Setiap rilis bisa dijual atau dipasang sendiri tanpa menunggu rilis
berikutnya. Urutan di dalam satu rilis mengikuti kolom "Bergantung pada" di `PROGRESS.md`.
Paket dan harga ditetapkan pemilik kemudian (keputusan 2026-10-05) dan tidak menghalangi
F2.1–F2.3.

| Rilis | Tujuan | Task |
| --- | --- | --- |
| **F2.1 · Siap jual** | Produk bernama PanduArah bisa didemokan, dicoba (trial), dipasang, dan dijual dengan dokumen yang benar | T-501, T-502, T-503, T-504, T-505, T-511, T-512, T-514, T-521, T-596, T-601, T-602, T-605 |
| **F2.2 · Aman dan terkelola** | Siap tender instansi: keamanan, operasional, rilis tertib, dukungan | T-513, T-592, T-597, T-598, T-603, T-604, T-606, T-595, T-535 |
| **F2.3 · Nilai jual utama** | Fitur pembeda di demo: scan denah, ikon, 3D, papan QR, event, analitik | T-548, T-572, T-571, T-544, T-574, T-581, T-582, T-583, T-591, T-552, T-553, T-554, T-573 |
| **F2.4 · Enterprise dan integrasi** | Korporat, rumah sakit besar, pemerintah | T-593, T-594, T-531, T-532, T-522, T-556, T-557, T-555, T-561, T-562, T-523 |
| **F2.5 · Penyempurnaan** | Fitur spesifikasi F2 lainnya | T-533, T-534, T-536, T-541, T-542, T-543, T-545, T-546, T-547, T-549, T-551, T-563 |

Gerbang setiap rilis:
- `pnpm check` dan E2E alur utama hijau;
- uji paket instalasi (instal, upgrade, rollback) lulus;
- changelog dibuat (setelah T-604 ada).

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
- **Keputusan pemilik (2026-10-05):**
  1. Trial bisa didapat dengan dua cara: **per permintaan** (vendor menerbitkan berkas atau kunci)
     dan **otomatis** (tombol "Mulai trial" di `/aktivasi`).
  2. Masa tenggang trial tetap **14 hari**, sama dengan lisensi biasa.
  3. Selama trial, **input data dibatasi** agar server tidak berat.
- **Konteks trial otomatis:** lisensi selalu terikat ke ID instalasi dan ditandatangani vendor,
  jadi lisensi trial tidak bisa disiapkan di dalam paket. "Otomatis" berarti instalasi meminta
  trial ke layanan lisensi vendor secara online, tanpa menunggu vendor membalas manual. Server
  tanpa internet memakai jalur per permintaan (ID instalasi dikirim ke vendor, berkas lisensi
  diunggah). Untuk mencegah trial berulang lewat instal ulang (ID instalasi baru), vendor
  membatasi trial per email, domain email, dan alamat IP.
- **Batas data selama trial** (kuota paket `trial`, dibaca dari lisensi sehingga vendor bisa
  menyesuaikan per permintaan):

  | Data | Batas trial |
  | --- | --- |
  | Venue | 1 |
  | Gedung | 2 |
  | Lantai (tanpa Area Luar) | 6 |
  | Fitur peta per lantai | 1.000 |
  | Lokasi | 300 |
  | Titik asal (QR) | 20 |
  | Info Point | 2 |
  | Pengguna Admin | 5 |
  | Ruang Storage (denah, foto, ikon, snapshot) | 1 GB |
  | Ukuran satu berkas denah | 20 MB |
  | Impor massal | 500 baris per impor |
  | Publish | 20 kali per hari |

- **Langkah:**
  1. Domain `license.ts`:
     - plan `trial` dengan durasi 14–30 hari;
     - kuota diperluas: `features`, `locations`, `originPoints`, `users`, `storageMb`,
       `maxUploadMb`, `importRows`, `publishPerDay`. Kuota yang tidak diisi berarti tidak
       dibatasi, sehingga lisensi berbayar lama tetap sah;
     - test.
  2. `license-cli issue --plan trial --days 14..30` memakai batas trial bawaan di atas, yang bisa
     ditimpa per opsi. Vendor-stub menyediakan endpoint `POST /v1/trial` untuk trial otomatis,
     yang menolak trial kedua untuk `instanceId`, email, atau domain yang sama, dan membatasi
     laju per IP.
  3. Server (migrasi baru):
     - `app.enforce_quota` diperluas ke fitur per lantai, lokasi, titik asal, dan pengguna
       (advisory lock seperti T-404);
     - batas Storage per bucket lewat fungsi pemeriksa sebelum unggah dan ukuran berkas di Edge
       Function atau policy;
     - batas publish per hari di `publish_begin`;
     - batas baris impor di repository dan di server;
     - semua penolakan memakai kode IM422 dengan pesan "Batas trial tercapai: … n/n".
  4. `license_status()` mengembalikan `isTrial`; masa tenggang 14 hari seperti lisensi biasa.
  5. Admin:
     - `/aktivasi`: tombol **Mulai trial 14 hari** (online; isian nama, instansi, email) dan
       petunjuk trial per permintaan untuk server offline;
     - banner "Trial — sisa N hari";
     - halaman Lisensi menampilkan pemakaian setiap batas trial dengan bar (memakai tampilan
       kuota T-404);
     - tombol tambah nonaktif dengan pesan saat batas tercapai.
  6. Upgrade ke berbayar: pasang lisensi baru, batas trial langsung terangkat, dan data tetap
     ada (uji E2E).
- **File:** `packages/domain/src/license.ts`, `packages/domain/src/license-quota.ts`, `tools/license-cli/**`, `tools/vendor-stub/**`, migrasi baru, `supabase/functions/{license-activate,publish}/**`, `packages/data/src/repositories/license.ts`, `apps/admin/src/features/license/**`
- **Selesai jika:**
  - [ ] Trial 14 dan 30 hari bisa diterbitkan; 31 hari ditolak
  - [ ] Trial otomatis dari `/aktivasi` aktif dalam < 1 menit; trial kedua untuk instalasi, email, atau domain yang sama ditolak
  - [ ] Lokasi ke-301, lantai ke-7, unggah 21 MB, dan publish ke-21 dalam sehari ditolak server dengan pesan batas trial (pgTAP dan E2E)
  - [ ] Masa tenggang trial 14 hari, lalu layanan Visitor berhenti seperti lisensi biasa
  - [ ] Setelah lisensi berbayar dipasang, batas terangkat dan semua data trial tetap ada
- **Jangan:**
  - menyimpan kunci privat vendor di repo;
  - menaruh lisensi trial siap pakai di dalam paket instalasi.

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

### T-557 · Rute khusus kelompok pengguna (jalur terbatas)

- **Untuk:** `20-F2-fase-2.md` §2.9 ("rute berbeda untuk pengguna berbeda")
- **Bergantung pada:** T-556 (login Visitor untuk peta privat), T-551
- **Konteks:** jalur khusus karyawan atau petugas, misalnya lorong servis, pintu staf, atau area
  steril, tidak boleh dipakai atau terlihat oleh pengunjung umum. Rute aksesibel untuk
  pengguna kursi roda sudah ada sejak R2.
- **Langkah:**
  1. Data:
     - kelompok akses per venue (mis. "Staf", "Keamanan");
     - edge, konektor, dan area dapat ditandai "terbatas" untuk kelompok tertentu;
     - migrasi dan RLS.
  2. Snapshot publik **tidak** memuat elemen terbatas. Graf terbatas diterbitkan sebagai berkas
     terpisah yang hanya bisa dibaca pengguna login dari kelompok itu (policy Storage), mengikuti
     pola graf terpisah dari "Snapshot ringan".
  3. `packages/routing`: rute memakai graf publik + graf kelompok bila pengguna berhak, dengan
     test agar pengunjung umum tidak pernah mendapat langkah lewat jalur terbatas.
  4. Visitor: setelah login (SSO/akun klien, T-556), pilihan "Rute staf". Info Point dan
     pengunjung tanpa login tetap memakai rute publik.
  5. Estimasi durasi ikut tampil (T-552).
- **Selesai jika:**
  - [ ] Pengunjung umum tidak pernah mendapat langkah lewat jalur terbatas, dan berkas grafnya tidak bisa diunduh tanpa login
  - [ ] Staf yang login mendapat rute lebih pendek lewat jalur terbatas
- **Konteks keamanan:** jalankan `ecc-security-review` (policy Storage, RLS) sebelum PR.

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

## F2-H · Kesetaraan produk (referensi Situm Indoor Maps)

### T-571 · Elemen 3D: pustaka objek dan model GLB

- **Untuk:** FR-MAP-14 (dinaikkan dari backlog), `20-F2-fase-2.md` §2.9
- **Bergantung pada:** —
- **Konteks:** ADR-05 menyatakan Three.js hanya untuk model 3D, jadi task ini yang membawa
  Three.js masuk lewat custom layer MapLibre. Three.js berlisensi MIT, tetapi ukurannya besar
  (±150 kB gzip), sehingga perlu persetujuan pemilik dan wajib dimuat terpisah (lazy), hanya
  saat mode 3D dibuka.
- **Langkah:**
  1. Domain: fitur `model3d` (titik + `modelId`, skala, rotasi, tinggi dasar) dengan validasi dan test.
  2. Pustaka objek bawaan berlisensi permisif atau buatan sendiri, ringan dan low-poly, untuk
     menonjolkan POI:
     - tangga, lift, dan eskalator;
     - taksi, mobil, dan halte;
     - pohon, tanaman, dan pot;
     - bangku, meja, kios, dan tanda.
  2b. Elemen ikonik gedung (patung, lobi khas, menara) dibuat sebagai GLB khusus per klien dan
     diunggah lewat langkah 3. Ini bisa menjadi layanan tambahan vendor.
  3. Unggah model GLB (≤ 5 MB, divalidasi), disimpan di Storage `public-assets`.
  4. Editor: tempatkan, geser, putar, dan ubah skala.
  5. `map-core` dan Visitor: custom layer Three.js di mode 3D. Objek disembunyikan di 2D dan pada
     Info Point yang memakai paksa 2D.
  6. Snapshot membawa daftar model per lantai.
  7. Ukur ulang performa (`tests/perf`): menambah 200 objek tidak boleh menurunkan FPS editor
     lebih dari 20%.
- **Selesai jika:**
  - [ ] Objek pustaka dan GLB unggahan tampil di Visitor mode 3D pada posisi dan skala yang benar
  - [ ] Bundel awal Visitor tidak bertambah (Three.js dimuat saat 3D dipakai)
- **Jangan:** memasang Three.js di jalur muat awal Visitor.

### T-572 · Pustaka ikon POI lengkap

- **Untuk:** `20-F2-fase-2.md` §2.9
- **Bergantung pada:** —
- **Langkah:**
  1. Perluas `PICTOGRAM_KEYS` dari 14 menjadi ±150 ikon bergaya seragam (garis 1,75 px seperti
     ikon UI), dikelompokkan dalam kategori:
     - layanan umum;
     - transportasi dan parkir;
     - makanan dan minuman;
     - belanja;
     - kesehatan;
     - pendidikan;
     - kantor;
     - keselamatan;
     - aksesibilitas;
     - hiburan;
     - fasilitas gedung.

     Sumbernya buatan sendiri, atau set berlisensi permisif (mis. MIT/Apache) yang dicatat di
     `packages/ui/src/pictograms/LICENSES.md`.
  2. Pemilih ikon di Admin: cari (ID/EN, alias), filter kategori, dan pratinjau di peta. Dipakai
     untuk jenis fasilitas, kategori, tipe lokasi, dan POI.
  3. Sprite peta dibangkitkan dari pustaka yang sama, dengan kontras AA dan ukuran target sentuh
     sesuai `05-desain-ui.md`.
  4. Ada ikon umum (lintas sektor) dan set khusus sektor (kesehatan, pendidikan, perkantoran,
     transportasi, industri, ritel), dipakai oleh template tipe venue yang sesuai.
  4b. Pustaka bisa bertambah lewat rilis tanpa migrasi data, karena kunci ikon tersimpan sebagai
     teks. Klien tetap bisa memakai ikon unggahan sendiri.
  5. Test: semua kunci ikon punya bentuk dan label ID/EN; snapshot lama dengan kunci lama tetap
     tampil.
- **Selesai jika:**
  - [ ] ±150 ikon tersedia dan bisa dicari di pemilih
  - [ ] Ikon tampil tajam di peta pada zoom tinggi dan rendah
- **Jangan:** memakai set ikon berlisensi non-komersial.

### T-573 · Penguatan CMS: media, edit massal, dasbor

- **Untuk:** `20-F2-fase-2.md` §2.9
- **Bergantung pada:** T-502/T-503 (tabel)
- **Langkah:**
  1. **Pustaka media per venue:**
     - logo, foto lokasi, ikon unggahan, dan denah dalam satu tempat (cari, filter, pemakaian);
     - pakai ulang aset;
     - aset yang tidak terpakai bisa dihapus.
  2. **Edit massal:** ubah status, kategori, jam operasional, atau tipe untuk banyak lokasi
     sekaligus, dengan pratinjau perubahan dan undo. Tercatat di audit.
  3. **Dasbor venue:**
     - jumlah lokasi per status;
     - fitur yang belum lengkap (unit tanpa lokasi, lokasi tanpa unit);
     - temuan validasi publish;
     - versi terbit terakhir;
     - penutupan aktif;
     - status Info Point (bila T-561 ada).
- **Selesai jika:**
  - [ ] Mengubah status 100 lokasi sekaligus dari tabel Lokasi berhasil dan tercatat di audit
  - [ ] Dasbor menunjukkan angka yang sama dengan data sebenarnya (test integrasi)

### T-574 · Papan "Anda di sini" cetak dengan QR

- **Untuk:** `20-F2-fase-2.md` §2.9 (wayfinding statis tanpa aplikasi)
- **Bergantung pada:** T-544 (export peta cetak)
- **Langkah:**
  1. Dari daftar Titik Asal, tombol **Cetak papan** menghasilkan PDF (A4, A3, A2) berisi:
     - peta lantai berorientasi sesuai arah hadap titik asal;
     - penanda "Anda di sini" dan legenda ikon;
     - daftar lokasi utama;
     - QR besar yang membuka Visitor dengan asal titik itu;
     - branding venue.
  2. Cetak massal: satu PDF untuk semua titik asal di satu lantai atau gedung.
  3. **Stiker QR per lokasi tujuan** (mis. 5 × 5 cm, lembar A4 berisi banyak stiker), untuk
     ditempel di brosur, meja informasi, atau papan.
     - Isi: QR deep link `to=` lokasi itu dan nama lokasinya.
     - Saat dipindai, Visitor meminta titik asal lalu memberi rute langkah demi langkah.
     - Pilihan lokasi lewat `DataTable` (cari dan filter).
  4. Teks sesuai bahasa bawaan venue (ID/EN).
- **Selesai jika:**
  - [ ] PDF A3 tercetak jelas, QR terbaca dari jarak 1 m, dan memindainya membuka rute dari titik itu
  - [ ] Lembar stiker A4 untuk 20 lokasi; tiap QR membuka lokasi yang benar

---

## F2-I · Event dan promosi

### T-581 · Event dan promosi: data dan Admin

- **Untuk:** `20-F2-fase-2.md` §2.10
- **Bergantung pada:** T-502 (tabel)
- **Langkah:**
  1. Migrasi:
     - tabel `events`: `venue_id`, `kind` (`event`/`promotion`), judul/ringkasan/deskripsi
       ID/EN, `image_path`, `starts_at`, `ends_at`, aturan berulang sederhana, `link_url`,
       `status`, titik peta opsional;
     - tabel `event_locations`;
     - RLS: Editor ke atas menulis, anon hanya membaca yang aktif dan belum selesai;
     - indeks waktu;
     - pgTAP.
  2. Fitur lisensi `events` (`PAID_FEATURES`). Server menolak penulisan tanpa fitur itu.
  3. Domain: validasi (selesai > mulai, maksimal 1 tahun, judul ID wajib) dan perhitungan
     kemunculan berulang, dengan test.
  4. Repository `events` di `packages/data`, termasuk `listCurrent` untuk Visitor.
  5. Admin, menu **Event & Promo**:
     - tabel `DataTable` (cari, filter jenis/status/tanggal/lokasi, pagination);
     - form dengan unggah gambar (pustaka media T-573 bila ada);
     - pemilih lokasi dan titik peta;
     - pratinjau kartu.
- **Selesai jika:**
  - [ ] Event baru tampil di daftar Admin dan bisa dibaca anon hanya selama aktif
  - [ ] Tanpa fitur lisensi `events`, server menolak dan menu terkunci dengan keterangan

### T-582 · Event dan promosi di Visitor

- **Untuk:** `20-F2-fase-2.md` §2.10
- **Bergantung pada:** T-581
- **Langkah:**
  1. Event dibaca langsung tiap menit seperti penutupan (`useLiveClosures`), tanpa publish dan
     disaring menurut waktu sekarang.
  2. Tampilan Visitor:
     - chip atau tab "Event & Promo" (berlangsung, segera);
     - kartu event dengan gambar, waktu, dan lokasi;
     - lencana di kartu lokasi;
     - penanda di peta pada lantai yang tampil;
     - tombol "Rute ke sini";
     - bagikan dengan deep link `ev=`.
  3. i18n ID/EN; teks EN jatuh ke ID bila kosong.
  4. E2E: event aktif tampil dan rute ke lokasinya jalan; event yang sudah selesai hilang
     tanpa publish.
- **Selesai jika:**
  - [ ] Event muncul dan hilang sesuai jadwal tanpa publish ulang
  - [ ] Muat awal Visitor tidak melambat (data event dimuat setelah peta tampil)

### T-583 · Playlist promosi di Info Point

- **Untuk:** `20-F2-fase-2.md` §2.10
- **Bergantung pada:** T-582, T-408
- **Langkah:**
  1. Pengaturan Info Point:
     - aktifkan playlist saat idle;
     - durasi per slide;
     - pilih event tertentu atau semua yang aktif.
  2. Saat idle, Info Point menampilkan slide layar penuh (gambar, judul, waktu, lokasi, QR ke
     detail). Sentuhan pertama menutup playlist dan membuka Visitor di event tersebut atau di
     tampilan awal.
  3. Gambar di-cache service worker agar tetap tampil saat offline (T-409).
- **Selesai jika:**
  - [ ] Setelah idle, playlist berputar; sentuhan membuka rute ke lokasi event
  - [ ] Tanpa jaringan, slide yang sudah dimuat tetap tampil

## F2-J · Operasional, integrasi, dan dukungan

### T-591 · Analitik penggunaan

- **Untuk:** `20-F2-fase-2.md` §2.11
- **Bergantung pada:** T-502 (tabel)
- **Konteks:** data anonim (tanpa IP, tanpa identitas pengunjung), tetap di server klien, dan
  dikirim secara batch agar tidak membebani Visitor. Pengunjung bisa menolak (opt-out).
- **Langkah:**
  1. Event yang dicatat:
     - kata kunci yang dicari, termasuk pencarian tanpa hasil;
     - lokasi yang dibuka;
     - rute yang dihitung (asal dan tujuan);
     - sumber kunjungan (QR titik asal, Info Point, tautan, embed);
     - bahasa;
     - jenis perangkat.
  2. Endpoint penerima dengan batas laju; agregasi harian dengan `pg_cron`; retensi data mentah
     90 hari.
  3. Dasbor Admin:
     - grafik tren;
     - 10 lokasi dan pencarian teratas;
     - pencarian tanpa hasil (bahan alias baru);
     - pemakaian per Info Point dan per QR;
     - export CSV dan PDF.
  4. Pengaturan Sistem: aktif/nonaktif analitik dan teks pemberitahuan privasi di Visitor.
- **Selesai jika:**
  - [ ] Dasbor menunjukkan angka yang cocok dengan event uji
  - [ ] Tidak ada data pribadi yang tersimpan (diperiksa test)

### T-592 · Login Admin aman: 2FA dan SSO

- **Untuk:** `20-F2-fase-2.md` §2.11
- **Langkah:**
  1. **TOTP 2FA** (GoTrue MFA): Admin bisa mengaktifkannya sendiri, dan Super Admin bisa
     mewajibkan 2FA untuk role tertentu.
  2. **SSO** lewat OIDC/SAML (Google Workspace, Microsoft Entra ID) dan opsi LDAP/AD untuk
     jaringan tertutup. Akun SSO dipetakan ke role.
  3. Kode cadangan dan reset 2FA oleh Super Admin, tercatat di audit.
- **Konteks:** jalankan `ecc-security-review` sebelum PR.
- **Selesai jika:**
  - [ ] Role yang diwajibkan 2FA tidak bisa masuk tanpa kode
  - [ ] Login SSO berhasil ke IdP uji dan role terpetakan

### T-593 · API dan webhook integrasi

- **Untuk:** `20-F2-fase-2.md` §2.11
- **Langkah:**
  1. Kunci API per sistem (scope baca/tulis per modul, bisa dicabut, tercatat di audit) yang
     dikelola Super Admin.
  2. API REST terdokumentasi (OpenAPI) untuk: lokasi, kategori, jam operasional, status, dan
     penutupan, termasuk upsert massal berdasarkan kode lokasi. Deep link Visitor juga
     terdokumentasi.
  3. Webhook keluar untuk peristiwa `publish`, perubahan penutupan, dan perubahan lokasi.
     Isinya ditandatangani HMAC, dengan retry dan log pengiriman.
  4. Contoh integrasi sinkronisasi dari sistem klien (CSV/JSON terjadwal).
- **Selesai jika:**
  - [ ] Sistem uji bisa mengubah jam operasional lewat API, dan perubahan tampil setelah publish
  - [ ] Kunci tanpa scope tulis ditolak server

### T-594 · Export GeoJSON dan IMDF

- **Untuk:** `20-F2-fase-2.md` §2.11
- **Langkah:**
  1. Export per venue ke GeoJSON (fitur, lokasi, graf) dan IMDF (paket zip berisi venue,
     building, level, unit, opening, amenity, occupant, anchor), dari snapshot versi aktif.
  2. Validasi keluaran IMDF dengan validator resmi atau skema yang dipublikasikan.
  3. Tombol export di halaman Publish (Admin/Super Admin).
- **Selesai jika:**
  - [ ] Paket IMDF venue contoh lolos validasi tanpa error

### T-595 · Vendor Portal minimal

- **Untuk:** `20-F2-fase-2.md` §2.11
- **Bergantung pada:** T-504 (trial), T-505 (landing)
- **Konteks:** aplikasi vendor, bukan bagian paket klien. Ini pengganti pemakaian manual
  `license-cli` dan `vendor-stub`.
- **Langkah:**
  1. Data klien dan instalasi (ID instalasi, versi, paket, masa berlaku).
  2. Terbitkan, perpanjang, ubah paket, dan cabut lisensi. Kunci privat disimpan di layanan
     terpisah atau HSM, bukan di basis data portal.
  3. Antrean permintaan trial dari landing page: setujui → lisensi trial terbit dan terkirim
     lewat email.
  4. Riwayat check-in instalasi dan unduh rilis per versi.
- **Selesai jika:**
  - [ ] Permintaan trial dari landing page bisa disetujui dan menghasilkan lisensi yang lolos aktivasi
  - [ ] Kunci privat tidak pernah tersimpan di database portal

### T-596 · Bantuan dan dokumentasi pengguna

- **Untuk:** `20-F2-fase-2.md` §2.11
- **Langkah:**
  1. Tur singkat saat pertama masuk Admin (buat venue → gambar peta → publish → QR).
  2. Tooltip pada istilah penting; tautan "Bantuan" per halaman ke artikel yang sesuai.
  3. Halaman bantuan di dalam Admin, dari Markdown yang ikut dalam rilis sehingga bisa dibuka
     offline.
  4. Manual PDF untuk Admin dan untuk teknisi instalasi.
- **Selesai jika:**
  - [ ] Setiap menu Admin punya artikel bantuan
  - [ ] Tur bisa dilewati dan diulang

### T-597 · Monitoring server di Admin

- **Untuk:** `20-F2-fase-2.md` §2.11
- **Bergantung pada:** T-411
- **Langkah:**
  1. Halaman **Kesehatan sistem** (Super Admin):
     - status layanan;
     - versi aplikasi;
     - ruang disk;
     - backup terakhir (berhasil/gagal);
     - check-in lisensi terakhir;
     - sertifikat HTTPS dan sisa harinya.
  2. Agen kecil di `deploy/` menulis status ke database secara berkala (cron).
  3. Email peringatan ke Super Admin bila backup gagal 2 kali, disk > 85%, atau sertifikat
     tinggal < 14 hari.
- **Selesai jika:**
  - [ ] Backup yang sengaja digagalkan memunculkan peringatan di halaman dan email

### T-598 · Notifikasi email operasional

- **Untuk:** `20-F2-fase-2.md` §2.11
- **Bergantung pada:** T-591 (untuk ringkasan)
- **Langkah:**
  1. Preferensi notifikasi per pengguna.
  2. Jenis notifikasi:
     - ringkasan mingguan (pemakaian, pencarian tanpa hasil, temuan validasi);
     - pengingat lisensi H-30/H-7/H-1 ke email Super Admin;
     - pemberitahuan publish dan penutupan baru ke peran terkait.
  3. Lewat SMTP Pengaturan Sistem, dengan template ID dan tautan berhenti berlangganan.
- **Selesai jika:**
  - [ ] Email terkirim sesuai preferensi (Mailpit di test) dan bisa dimatikan per jenis

## F2-K · Kesiapan komersial

### T-601 · Kepatuhan UU PDP

- **Untuk:** `20-F2-fase-2.md` §2.13
- **Langkah:**
  1. Inventaris data pribadi beserta tujuan, dasar pemrosesan, dan masa simpannya:
     - akun Admin;
     - log audit;
     - analitik (T-591), yang dirancang anonim;
     - form trial (T-505);
     - email.
  2. Dokumen kebijakan privasi untuk Visitor dan landing page, serta pemberitahuan di Visitor
     bila analitik aktif.
  3. Fitur Admin: export dan hapus data akun pengguna atas permintaan; retensi log audit dan
     analitik bisa diatur.
  4. Prosedur insiden kebocoran data, termasuk pemberitahuan ke klien dan pihak berwenang.
  5. Template perjanjian pemrosesan data (DPA) vendor–klien.
- **Selesai jika:**
  - [ ] Dokumen privasi, inventaris data, dan prosedur insiden ada di `docs/legal/`
  - [ ] Data akun bisa diekspor dan dihapus dari Admin, dan tercatat di audit
- **Konteks:** naskah legal final ditinjau konsultan hukum; repo hanya menyimpan draf dan
  template.

### T-602 · Dokumen legal penjualan

- **Untuk:** `20-F2-fase-2.md` §2.13
- **Langkah:**
  1. Draf perjanjian lisensi pengguna akhir (EULA) on-premise: hak pakai per instalasi,
     larangan rekayasa balik dan pemindahan, serta batas tanggung jawab.
  2. Syarat layanan berlangganan, SLA dukungan (jam layanan, waktu respons per tingkat masalah,
     saluran panduarahid@gmail.com), dan ketentuan trial.
  3. Template kontrak berlangganan dan berita acara instalasi.
  4. Teks EULA ditampilkan dan harus disetujui saat aktivasi pertama di `/aktivasi`.
- **Selesai jika:**
  - [ ] Draf di `docs/legal/`, siap ditinjau konsultan hukum
  - [ ] Aktivasi pertama meminta persetujuan EULA, dan persetujuannya tercatat di audit

### T-603 · Uji keamanan

- **Untuk:** `20-F2-fase-2.md` §2.13
- **Langkah:**
  1. Pemindaian kerentanan di CI:
     - dependency (`pnpm audit`, pip-audit untuk `cad-converter`);
     - image Docker (mis. Trivy);
     - rahasia yang tertinggal di repo.
  2. Daftar periksa OWASP ASVS level 2 untuk Admin, Visitor, Edge Function, dan paket instalasi,
     memakai `ecc-security-review` per area.
  3. Pentest independen oleh pihak ketiga sebelum rilis komersial pertama. Temuan kritis dan
     tinggi wajib diperbaiki sebelum dijual.
  4. Halaman `SECURITY.md`: cara melaporkan celah keamanan.
- **Selesai jika:**
  - [ ] CI gagal bila ada kerentanan tingkat tinggi yang belum ditangani
  - [ ] Laporan pentest dan status perbaikannya tercatat

### T-604 · Proses rilis dan dukungan versi

- **Untuk:** `20-F2-fase-2.md` §2.13
- **Bergantung pada:** T-511
- **Langkah:**
  1. Penomoran versi semantik (mis. `2026.1.0`); tag git dan image Docker mengikuti versi itu.
  2. Changelog untuk klien (bahasa awam, ID) di setiap rilis, juga ditampilkan di halaman
     Kesehatan sistem (T-597).
  3. Kebijakan dukungan: berapa lama versi lama menerima perbaikan keamanan, jalur upgrade yang
     didukung, dan jadwal rilis rutin.
  4. Skrip rilis vendor:
     - jalankan `pnpm check`, E2E, dan uji paket instalasi;
     - build image;
     - buat changelog;
     - arsip rilis.
- **Selesai jika:**
  - [ ] Satu rilis percobaan berjalan dari tag sampai arsip rilis lengkap dengan changelog
  - [ ] Kebijakan dukungan versi tertulis di `docs/`

### T-605 · Lingkungan demo penjualan

- **Untuk:** `20-F2-fase-2.md` §2.13
- **Bergantung pada:** T-501, T-511
- **Langkah:**
  1. Instalasi demo dengan venue contoh per industri (rumah sakit, kampus, pusat perbelanjaan,
     perkantoran, bandara), memakai data `demo-venues` yang sudah ada dan fitur paket lengkap.
  2. Reset otomatis setiap malam ke keadaan awal; akun demo per role; banner "Demo".
  3. Skrip presentasi 15 menit (alur Admin, Visitor, dan Info Point).
- **Selesai jika:**
  - [ ] Demo bisa direset dengan satu perintah dan pulih dalam < 5 menit
  - [ ] Setiap industri punya venue contoh yang bisa dipublish dan dirutekan

### T-606 · Materi pelatihan klien

- **Untuk:** `20-F2-fase-2.md` §2.13
- **Bergantung pada:** T-596
- **Langkah:**
  1. Modul pelatihan per peran:
     - Super Admin/Admin: setup venue, pengguna, lisensi, publish;
     - Editor: gambar peta, lokasi, impor;
     - Operator: penutupan dari HP;
     - teknisi: instalasi, backup, upgrade.
  2. Video singkat per modul (3–7 menit) dan lembar ringkas satu halaman.
  3. Kuis atau daftar periksa kelulusan pelatihan untuk berita acara serah terima.
- **Selesai jika:**
  - [ ] Setiap peran punya modul, video, dan lembar ringkas

## Backlog (tidak dijadwalkan)

| ID | Fitur |
| --- | --- |
| FR-NAV-16 | Mode evakuasi diaktifkan dari Admin |
| FR-DEV-09 | Beacon dan blue dot |
| BL-01 | Lokasi unggulan dan slot iklan (monetisasi venue komersial) |
| BL-02 | Portal pemilik lokasi: pengelola lokasi memperbarui data dan promo sendiri |
| BL-03 | Tema musiman (Ramadan, HUT RI, Natal, dan lainnya) |
| BL-04 | Jadwal layar Info Point (nyala/mati, konten per jam) dan screenshot jarak jauh |
| BL-05 | Asisten pencarian bahasa alami dengan model lokal |
| BL-06 | Aplikasi native dan SDK untuk aplikasi klien |
| BL-07 | Multi-venue dalam satu dasbor untuk grup klien |
| BL-08 | Survei kepuasan singkat di Visitor atau Info Point |
