# Fase 2 (F2) dan backlog

Daftar pekerjaan setelah R0–R4. **Status: perencanaan final (2026-10-06).** Semua item sudah
dipecah menjadi task T-501 s.d. T-607 di `21-F2-task.md`, dengan verifikasi E2E di
`22-F2-verifikasi-e2e.md` dan test case di `16-test-case.md` §15. Pengerjaan dimulai setelah
pemilik selesai me-review R0–R4. Item baru di luar dokumen ini butuh keputusan baru dari pemilik.

Struktur data dan kode boleh **tidak menghalangi** fitur-fitur ini, tetapi jangan membangunnya lebih awal.

## 1. Fitur dari spesifikasi

ID merujuk ke `docs/spec/`. Item bertanda **BL** adalah backlog (prioritas paling rendah).

- **Akses:** hak akses granular (AUTH-06), audit log lengkap (AUTH-07)
- **Venue:** label kustom (VEN-11), pintu masuk + Google Maps (VEN-12), duplikasi lantai (VEN-13), import vektor CAD (VEN-14); deteksi ruang otomatis dari gambar dipindah ke F2 (§2.8)
- **Peta:** landmark (MAP-11), kontrol label (MAP-12), area temporer (MAP-13), model 3D GLB dengan Three.js (MAP-14; dipindah ke F2, §2.9; Three.js disetujui pemilik 2026-10-06), export peta cetak (MAP-15)
- **Tampilan:** warna per kategori (VIS-08), lantai bertumpuk (VIS-09)
- **Navigasi:** instruksi landmark (NAV-12), edge satu arah dan berjam buka (NAV-13), bobot preferensi (NAV-14), estimasi waktu (NAV-15), mode evakuasi (NAV-16, BL)
- **Lokasi:** konten multi-bahasa (LOC-11)
- **Titik asal:** pairing perangkat (DEV-05), status Info Point (DEV-06), reload jarak jauh (DEV-07), shell WPF (DEV-08), beacon (DEV-09, BL)
- **Publish:** publish terjadwal (PUB-09)
- **Lisensi:** riwayat lisensi (LIC-13)
- **Visitor:** fasilitas terdekat (VST-16), estimasi waktu (VST-17), konten multi-bahasa (VST-18), lapisan keselamatan (VST-20), mode teks/pembaca layar WCAG 2.2 AA (VST-21), embed (VST-22), rute multi-tujuan (VST-23), minimap (VST-24), peta privat (VST-25)
- **Info Point:** mode aksesibilitas (IP-09), pemantauan perangkat (IP-10)

## 2. Tambahan keputusan pemilik (2026-10-05)

### 2.1 Instalasi dengan database PostgreSQL milik klien

Keputusan pemilik 2026-10-05. Isinya:
- `install.sh --database external`: paket tanpa container database, cek PostgreSQL 15+ beserta
  PostGIS, pg_cron, dan pg_net, lalu buat role dan skema `auth`, `storage`, `app` memakai akun
  superuser khusus instalasi;
- migrasi ke database klien;
- backup paket hanya untuk file dan konfigurasi, sedangkan database di-backup lewat prosedur
  DBA klien;
- `upgrade.sh` meminta konfirmasi backup DBA sebelum migrasi;
- daftar periksa DBA di `deploy/README.md`.

Database selain PostgreSQL di luar cakupan. Mode bawaan (database ikut paket, T-411) tetap
menjadi default.

### 2.2 Lisensi trial

(keputusan pemilik 2026-10-05). Klien bisa menguji aplikasi 14 hari sampai
1 bulan sebelum membeli:
- Paket lisensi `trial` dengan durasi 14–30 hari, ditentukan vendor saat menerbitkan
  (`license-cli issue --plan trial`). Fitur mengikuti paket yang ingin diuji, tetapi kuotanya
  memakai batas trial (lihat di bawah).
- Satu trial per ID instalasi: vendor menolak trial kedua untuk instalasi yang sama.
- Admin dan Visitor menandai mode trial: banner "Trial — sisa N hari" di Admin, dan penanda
  kecil opsional di Visitor.
- Saat trial berakhir berlaku alur kedaluwarsa yang sama dengan lisensi biasa (masa tenggang,
  lalu layanan Visitor dihentikan). Masa tenggang trial **14 hari**, sama dengan lisensi biasa
  (diputuskan pemilik 2026-10-05).
- Upgrade ke lisensi berbayar cukup dengan memasang lisensi baru; data selama trial tetap ada.
- **Cara mendapatkan trial** (diputuskan pemilik 2026-10-05): **per permintaan** (vendor
  menerbitkan berkas atau kunci) dan **otomatis** (tombol "Mulai trial" di `/aktivasi`, yang
  meminta trial ke layanan lisensi vendor secara online). Server tanpa internet memakai jalur
  per permintaan. Trial berulang dicegah per instalasi, email, domain, dan IP.
- **Batas input data selama trial** (diputuskan pemilik 2026-10-05), agar server tidak berat:

  | Data | Batas |
  | --- | --- |
  | Venue | 1 |
  | Gedung | 2 |
  | Lantai | 6 |
  | Fitur per lantai | 1.000 |
  | Lokasi | 300 |
  | Titik asal | 20 |
  | Info Point | 2 |
  | Pengguna | 5 |
  | Storage | 1 GB |
  | Berkas denah | 20 MB |
  | Impor | 500 baris |
  | Publish | 20 kali per hari |

  Batasnya dibaca dari lisensi, sehingga vendor bisa menyesuaikan per permintaan. Rincian
  teknis ada di T-504.

### 2.3 Nama produk PanduArah

(keputusan pemilik 2026-10-05):
- Bentuk resmi: **PanduArah** untuk logo dan teks, **panduarah** untuk domain dan email.
  Tagline Inggris untuk pasar luar negeri: "PanduArah — Indoor Navigation".
- **Logo resmi** (diberikan pemilik 2026-10-06), berkas sumber di `docs/brand/`:
  - simbol: penanda arah biru yang menyapu ke kanan atas di atas bingkai biru dan kuning;
  - tulisan: "Pandu" tebal dan "Arah" reguler, berwarna hitam;
  - warna dari berkas: biru ±`#0F4A91`, kuning ±`#FEC409` (setara token `--signal`),
    hitam ±`#04080B` (setara `--ink`);
  - `panduarah-logo.webp` adalah versi utama; `panduarah-logo-alt.png` versi kedua dengan
    tepi lebih kasar, sebagai cadangan.
- Ganti nama "Indoor Map" di semua tempat yang terlihat pengguna:
  - judul dan header Admin dan Visitor;
  - manifest PWA dan ikon;
  - template email Auth dan pemberitahuan akun;
  - teks i18n ID/EN;
  - landing page;
  - `deploy/README.md` dan dokumen produk.
- Nama paket kode (`@indoor/*`) dan istilah teknis tidak wajib diganti.
- Email vendor: **panduarahid@gmail.com** dipakai untuk kontak, permintaan trial dari landing
  page, dukungan, dan lisensi (keputusan pemilik 2026-10-05). Bila domain panduarah.id sudah
  dimiliki, alamat berdomain (`halo@`, `trial@`, `support@`, `lisensi@`, `no-reply@`) bisa
  menggantikan atau meneruskan ke alamat ini.
- Perlindungan IP oleh pemilik, di luar kode:
  - cek dan daftarkan domain panduarah.id, .co.id, dan .com;
  - daftarkan merek di DJKI kelas 9 dan 42;
  - daftarkan hak cipta program komputer.

### 2.4 Landing page produk dan permintaan trial

(keputusan pemilik 2026-10-05). Ini situs vendor,
bukan bagian paket instalasi klien.
- Isi pengenalan aplikasi:
  - jenis gedung (rumah sakit, kampus, perkantoran, bandara, pabrik, pusat perbelanjaan);
  - fitur utama: editor peta, 2D/3D, rute antar-lantai dan aksesibel, Info Point, penutupan
    jalur, publish berversi;
  - cara kerja (gambar peta, publish, pengunjung memindai QR);
  - model on-premise dan lisensi berlangganan;
  - tangkapan layar Admin, Visitor, dan Info Point.
- Form permintaan trial berisi:
  - nama, instansi, jabatan, email, dan nomor telepon;
  - jenis dan ukuran gedung (jumlah gedung dan lantai);
  - durasi trial yang diinginkan (14 hari sampai 1 bulan);
  - ID instalasi bila sudah memasang;
  - persetujuan kebijakan privasi.
- Pengiriman form: dikirim ke email vendor lewat layanan kirim email, dengan validasi,
  pembatasan laju, dan perlindungan spam (honeypot atau captcha). Pemohon menerima email
  konfirmasi. Vendor menerbitkan lisensi trial secara manual dengan `license-cli`.
- Desain mengikuti `docs/05-desain-ui.md`, bahasa ID/EN, dan halaman ramah HP.
- Bergantung pada fitur lisensi trial di atas.

### 2.5 Filter, pencarian, dan pagination di setiap tabel Admin

(keputusan pemilik 2026-10-05).
Pagination: pilihan jumlah baris per halaman (mis. 10/25/50/100), nomor halaman, dan total data.
Setiap tabel mendapat kolom cari teks dan filter sesuai kolomnya (status, jenis, role, lantai, tanggal),
dengan pola komponen yang sama dari `packages/ui`. Filter, kata kunci, dan halaman tersimpan di URL agar
bisa dibagikan dan bertahan saat halaman dimuat ulang. Tabel besar memfilter dan membagi halaman
di server lewat repository `packages/data` (`range` + jumlah total). Tabel yang dicakup: Venue, Gedung, Lantai, Riwayat denah, Lokasi,
Kategori, Tipe lokasi dan kolom kustom, Jenis fasilitas, Penutupan, Titik Asal, Info Point,
Riwayat publish, Pengguna, Log audit, Template instruksi, Lisensi, serta pratinjau impor.

### 2.6 Instalasi di server Windows

(keputusan pemilik 2026-10-05). Linux (Ubuntu Server LTS)
sudah didukung sejak T-411. Dikerjakan berurutan:
1. **Panduan Windows lewat VM Ubuntu** (Hyper-V atau VMware), dikerjakan lebih dulu. Paket
   instalasi tidak berubah; `deploy/README.md` ditambah langkah:
   - membuat VM beserta spesifikasi minimumnya;
   - jaringan VM (bridge atau NAT dan port forwarding 80/443) serta firewall Windows;
   - VM menyala otomatis saat host reboot;
   - backup VM ditambah backup aplikasi.
2. **Dukungan Windows Server langsung**, dikerjakan setelah opsi 1:
   - padanan PowerShell untuk `install`, `backup`, `restore`, dan `upgrade`;
   - Docker di WSL2 atau Docker Desktop (cek lisensi Docker Desktop untuk perusahaan besar);
   - jadwal backup lewat Task Scheduler;
   - layanan menyala otomatis setelah reboot;
   - uji di Windows Server 2022/2025 sungguhan.

### 2.7 Pengerasan lanjutan

(temuan R4, keputusan pemilik 2026-10-05):
- **Distribusi image Docker jadi.** Vendor mengirim image hasil build, bukan kode sumber,
  agar kunci publik lisensi tidak bisa diganti lalu di-build ulang di server klien.
- **Visitor tanpa WebGL.** Tampilkan pesan "perangkat tidak mendukung peta", sementara
  pencarian dan langkah rute tetap bisa dipakai. Penting untuk PC Info Point dengan GPU lama.
- **Performa kunjungan ulang.** Ukur di HP kelas menengah sungguhan. Bila tetap > 1,5 s,
  simpan indeks pencarian di cache IndexedDB per versi snapshot (`docs/laporan-performa.md`).
- **Uji perangkat dan browser manual:** Firefox, Edge, Safari/iOS 15, Android 10 fisik.
- **E2E `cad-floor-plan` diperbaiki.** Pasang lisensi dengan fitur `cad_import` di spec,
  atau tambahkan fitur itu ke lisensi seed.
- **`cad_import` ditegakkan di server**, tidak hanya dikunci di UI Admin (T-405).
- **Masa tenggang di Admin.** Tombol tulis ikut dinonaktifkan atau diberi tanda selama masa
  tenggang (T-406); penegakan server sudah ada.
- **Pelaku audit aktivasi** tercatat sebagai Super Admin yang mengaktifkan, bukan "Sistem"
  (T-402).

### 2.8 Scan otomatis denah gambar

Keputusan pemilik 2026-10-05; sebelumnya backlog FR-VEN-14 lanjutan.

Pengguna mengunggah gambar denah (PNG/JPG, atau PDF yang dirender jadi gambar), lalu menekan
**Scan**. Sistem langsung membuat garis dinding dan blok ruang sesuai gambar sebagai draft fitur
yang bisa diperiksa dan dirapikan, sehingga pengguna tidak perlu menjiplak manual.

- **Tahap 1, computer vision klasik** di layanan `cad-converter` (Python):
  - pembersihan gambar (grayscale, threshold, buang teks dan noise);
  - deteksi garis dinding dan penyederhanaan;
  - deteksi kontur ruang tertutup menjadi poligon.

  Hasilnya diubah ke koordinat peta memakai georeferensi denah (T-105/T-106).
- **Tahap 2, peningkatan dengan model AI** (segmentasi dinding, pintu, ruang) bila hasil tahap 1
  belum cukup untuk denah yang rumit. Model berjalan lokal di server klien, tanpa layanan cloud.
  **Hanya model gratis** (diputuskan pemilik 2026-10-06): bobot dan dataset latihnya berlisensi
  terbuka yang mengizinkan pemakaian komersial. Tidak membeli lisensi model dan tidak melatih
  model sendiri dengan biaya pelabelan atau GPU sewaan. Bila tidak ada model gratis yang cukup
  baik, tahap 2 ditunda dan tahap 1 tetap dipakai.
- Hasil scan tidak langsung menjadi data final. Pengguna melihat pratinjau di atas denah (dinding,
  ruang, tingkat keyakinan), memilih bagian yang diterima, lalu impor sebagai draft. Validasi
  geometri dan publish tetap berlaku.
- Dependensi pengolahan gambar (OpenCV, Apache-2.0) hanya di container `cad-converter`, tidak
  di aplikasi web. **Disetujui pemilik 2026-10-06** walaupun ukurannya besar.

### 2.9 Kesetaraan dengan produk indoor maps komersial (referensi: Situm Indoor Maps)

Keputusan pemilik 2026-10-05. Lima kemampuan yang dipasarkan Situm, dibandingkan dengan keadaan
PanduArah setelah R4:

| Kemampuan | Keadaan PanduArah | Yang ditambahkan |
| --- | --- | --- |
| Elemen 3D di peta | Sebagian: 3D gedung dan ruang (`fill-extrusion`), tinggi per jenis/fitur, 2D/3D di Visitor | Pustaka objek 3D (perabot, pohon, kios, kendaraan, tanda) dan unggah model GLB (FR-MAP-14 dinaikkan dari backlog) — T-571 |
| Pustaka ikon lengkap untuk POI | Sebagian: 14 piktogram bawaan + unggah ikon sendiri | Pustaka ±150 ikon bergaya seragam, berkategori, bisa dicari, berlisensi permisif, dipakai untuk fasilitas, kategori, tipe lokasi, dan POI — T-572 |
| CMS indoor mapping yang lengkap | Ada: Admin (editor peta, lokasi, field kustom, impor massal, penutupan, publish berversi, pratinjau, rollback, pengguna, audit) | Pustaka media, edit massal, dasbor ringkasan venue; ditambah item F2 lain (hak akses granular, publish terjadwal, tabel cari/filter/pagination) — T-573 |
| Wayfinding statis lintas platform tanpa posisi real-time dan tanpa aplikasi | Ada: Visitor web/PWA tanpa instal, QR titik asal "Anda di sini", Info Point, tautan bagikan | Generator papan/poster cetak "Anda di sini" dengan QR per titik asal (memakai export cetak T-544) — T-574 |
| Lanjutkan peta di smartphone | Ada: QR "Lanjutkan di HP" di Info Point (T-409), tautan bagikan rute | Tidak ada tambahan inti; bagikan lewat WhatsApp sudah lewat Web Share |

Rincian dari teks halaman Situm yang diberikan pemilik (2026-10-05) dan tambahannya:

- **Wayfinding tanpa aplikasi** lewat website, kiosk, dan HP, termasuk navigasi luar dan dalam
  gedung. Sudah ada: Visitor PWA, Info Point, Area Luar, dan tautan Google Maps ke pintu masuk
  (T-546).
- **Rute ke POI untuk pengguna berbeda.** Rute aksesibel sudah ada; estimasi durasi ada di
  T-552. Yang **baru** adalah jalur khusus karyawan di area terbatas: T-557.
- **Bagikan rute lewat QR** dari peta di website (embed, T-556) atau stiker fisik di venue.
  Sudah ada QR titik asal dan QR "Lanjutkan di HP". Yang **baru** adalah stiker QR per lokasi
  tujuan, masuk ke T-574.
- **Pustaka ikon** lintas sektor dan khusus sektor yang terus bertambah, dengan kustomisasi.
  Rinciannya masuk ke T-572.
- **Elemen 3D** untuk menonjolkan POI (tangga, lift, taksi, tanaman) dan replika elemen ikonik
  gedung. Rinciannya masuk ke T-571.
- **CMS di browser:** unggah dan ubah denah serta POI, branding (logo dan warna). Sudah ada:
  editor dan denah (R1), branding (T-410). Penguatannya di T-573.

Kelima kemampuan ini juga menjadi bahan utama halaman fitur landing page (§2.4).

### 2.10 Event dan promosi

Keputusan pemilik 2026-10-05. Sebelumnya "modul bisnis" di luar lingkup spesifikasi
(`docs/spec/01-kebutuhan-fungsional.md`).

Venue bisa mengumumkan acara dan promosi yang terikat waktu dan tempat. Contoh lintas industri:
seminar kesehatan di rumah sakit, wisuda atau pameran di kampus, diskon di pusat perbelanjaan,
dan pengumuman di perkantoran.

- **Data:**
  - judul, ringkasan, deskripsi, gambar, kategori (acara atau promosi), ID/EN;
  - waktu mulai dan selesai, plus jadwal berulang sederhana;
  - lokasi yang ditautkan (satu atau beberapa), atau titik di peta untuk acara di area umum;
  - tautan luar opsional;
  - status draft, aktif, atau selesai.
- **Tanpa publish ulang:** event dan promosi dibaca langsung dari server oleh Visitor seperti
  penutupan jalur (T-216), dan tampil atau hilang otomatis menurut waktu (zona waktu venue).
- **Visitor:**
  - daftar "Event & Promo" (sedang berlangsung dan akan datang);
  - lencana di kartu lokasi;
  - penanda di peta;
  - tombol rute ke tempat acara;
  - bagikan.
- **Info Point:** playlist promosi di layar saat idle (attract mode). Sentuhan pertama menutup
  playlist dan membuka Visitor biasa.
- **Admin:** CRUD dengan cari, filter, dan pagination (T-502), pratinjau, serta jadwal.
  Role Editor ke atas bisa mengelola. Hak per modul ikut T-531 bila tersedia.
- **Lisensi:** fitur paket `events` agar bisa dijual sebagai tambahan. Server menolak tanpa fitur
  itu.
- Istilah di kode tetap netral (`event`, `promotion`, `location`).

### 2.11 Operasional, integrasi, dan dukungan

Keputusan pemilik 2026-10-05. Kebutuhan saat produk dijual dan dipakai klien:

- **Analitik penggunaan.** Pencarian (termasuk tanpa hasil), lokasi dan rute populer, pemakaian
  Info Point dan QR. Data anonim dan tetap di server klien.
- **Login Admin aman.** 2FA TOTP dan SSO (OIDC/SAML, LDAP/AD).
- **API dan webhook** untuk integrasi dengan sistem klien (SIMRS, sistem akademik, HR).
- **Export GeoJSON dan IMDF**, agar klien tidak terkunci ke satu produk.
- **Vendor Portal minimal:** klien, lisensi, antrean trial, rilis.
- **Bantuan dan dokumentasi pengguna** di dalam Admin, ditambah manual PDF.
- **Monitoring server** di Admin, dengan peringatan email.
- **Notifikasi email operasional.**

Task: T-591 s.d. T-598 (`21-F2-task.md`, F2-J).

### 2.12 Backlog tambahan

Keputusan pemilik 2026-10-05; tidak dijadwalkan:

- lokasi unggulan dan slot iklan;
- portal pemilik lokasi;
- tema musiman;
- jadwal layar dan screenshot Info Point;
- asisten pencarian bahasa alami (model lokal);
- aplikasi native dan SDK;
- dasbor multi-venue;
- survei kepuasan.

### 2.13 Kesiapan komersial

Keputusan pemilik 2026-10-05. Pekerjaan di luar fitur aplikasi yang dibutuhkan sebelum produk
dijual:
- kepatuhan UU PDP;
- dokumen legal (EULA, syarat layanan, SLA, kontrak);
- uji keamanan dan pentest;
- proses rilis dan dukungan versi;
- lingkungan demo penjualan;
- materi pelatihan klien.

Task: T-601 s.d. T-606 (F2-K). **Paket dan harga** ditunda; ditetapkan pemilik kemudian.

### 2.14 Tur panduan di setiap halaman (driver.js)

Keputusan pemilik 2026-10-05. Setiap halaman Admin dan Visitor punya tur panduan langkah demi
langkah memakai **driver.js** (gratis, MIT): elemen penting disorot satu per satu dengan penjelasan singkat,
agar pengguna baru paham halaman tanpa pelatihan.

- **Cakupan:**
  - semua halaman Admin, termasuk Aktivasi, Venue (tab Gedung dan Lantai), Georeferensi denah,
    Editor Peta, Lokasi, Penutupan, Titik Asal, Publish, Pengaturan, Pengguna, dan Lisensi;
  - halaman Visitor (beranda dan peta venue: cari, kartu lokasi, rute, ganti lantai, 2D/3D,
    bahasa, bagikan) dan Info Point;
  - setiap halaman baru di F2 (mis. event, analitik, kesehatan sistem, bantuan) wajib ikut
    membawa turnya.
- **Perilaku:**
  - tur berjalan otomatis saat pengguna pertama kali membuka halaman itu;
  - tur bisa dilewati dan bisa diulang lewat tombol "Tur halaman";
  - status "sudah dilihat" disimpan per pengguna (Admin) atau per perangkat (Visitor);
  - di Info Point tur tidak berjalan otomatis dan ditutup saat reset idle.
- **Langkah tur mengikuti role:** tombol yang tidak boleh dipakai role itu tidak ikut ditunjuk.
- **Teks:** Admin berbahasa Indonesia; Visitor lewat i18n ID/EN.
- **Tampilan:** gaya mengikuti `docs/05-desain-ui.md` (bukan tema bawaan driver.js), ramah HP,
  dan bisa dipakai dengan keyboard.
- **Pustaka tur** (diputuskan pemilik 2026-10-06: pakai yang gratis): **driver.js** (MIT).
  intro.js versi gratis berlisensi AGPL-3.0, yang mewajibkan kode sumber PanduArah dibuka ke
  klien, sedangkan versi komersialnya berbayar. driver.js memberi pola tur yang sama tanpa biaya
  dan tanpa kewajiban itu.

Task: T-599 (`21-F2-task.md`, F2-J). Tur lintas halaman untuk pengguna baru di T-596 memakai
mesin yang sama.

### 2.15 Uji beban saat banyak diakses

Keputusan pemilik 2026-10-06. Aplikasi harus tetap melayani saat banyak orang mengakses
bersamaan, misalnya jam besuk, hari pertama kuliah, acara besar, atau banyak pengunjung memindai
QR serentak. NFR-CAP-01 (200 pengunjung + 20 Admin) sudah dibuktikan di T-412; F2 menambah beban
baru dan perlu diuji ulang.

- **Jenis uji:** smoke, beban normal, puncak (1.000 pengunjung), lonjakan (0 → 500 dalam
  10 detik), ketahanan 4 jam, titik batas, dan kelebihan beban. Angka ini target awal dan bisa
  diubah pemilik.
- **Setiap fitur baru** yang menambah endpoint, pembacaan berkala, atau proses berat membawa
  skenario uji bebannya sendiri.
- **Saat kelebihan beban,** server menolak dengan rapi ("server sedang sibuk") dan pulih sendiri;
  Visitor tetap memakai peta tersimpan; Admin tidak kehilangan draft.
- **Hasilnya** menjadi panduan ukuran server untuk klien (jumlah pengunjung per spesifikasi).
- Uji beban smoke dan normal menjadi gerbang setiap rilis F2.

Task: T-607 (`21-F2-task.md`, F2-K). Test case: `16-test-case.md` §15.14.

### 2.16 Verifikasi E2E Fase 2

Keputusan pemilik 2026-10-06. Berbeda dengan R0–R3 (diverifikasi belakangan di T-307a), setiap
task F2 membawa spec E2E, test case, dan bukti gambarnya sendiri. Setiap rilis F2.1–F2.5 punya
spec alur gabungan dan gerbang rilis. Alurnya di `22-F2-verifikasi-e2e.md`; test case di
`16-test-case.md` §15 (187 test case, termasuk uji beban dan matriks keamanan F2).

Urutan pengerjaan seluruh F2 ada di bagian **Roadmap rilis F2** di `21-F2-task.md`
(F2.1 siap jual s.d. F2.5 penyempurnaan).

