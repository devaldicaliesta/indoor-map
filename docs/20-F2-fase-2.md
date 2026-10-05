# Fase 2 (F2) dan backlog

Daftar pekerjaan setelah R0–R4. **Jangan dikerjakan tanpa keputusan baru dari pemilik**; setiap item dipecah menjadi task (konteks, langkah, file, kriteria selesai) seperti `10-R0-fondasi.md` s.d. `14-R4-komersial.md` sebelum dikerjakan.

Struktur data dan kode boleh **tidak menghalangi** fitur-fitur ini, tetapi jangan membangunnya lebih awal.

## 1. Fitur dari spesifikasi

ID merujuk ke `docs/spec/`. Item bertanda **BL** adalah backlog (prioritas paling rendah).

- **Akses:** hak akses granular (AUTH-06), audit log lengkap (AUTH-07)
- **Venue:** label kustom (VEN-11), pintu masuk + Google Maps (VEN-12), duplikasi lantai (VEN-13), import vektor CAD (VEN-14), deteksi ruang dengan AI (BL)
- **Peta:** landmark (MAP-11), kontrol label (MAP-12), area temporer (MAP-13), model 3D GLB dengan Three.js (MAP-14, BL), export peta cetak (MAP-15)
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

mode database PostgreSQL milik klien (keputusan pemilik 2026-10-05, F2). Isinya:
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
  (`license-cli issue --plan trial`). Kuota dan fitur mengikuti paket yang ingin diuji.
- Satu trial per ID instalasi: vendor menolak trial kedua untuk instalasi yang sama.
- Admin dan Visitor menandai mode trial: banner "Trial — sisa N hari" di Admin, dan penanda
  kecil opsional di Visitor.
- Saat trial berakhir berlaku alur kedaluwarsa yang sama dengan lisensi biasa (masa tenggang,
  lalu layanan Visitor dihentikan). Pemilik memutuskan apakah masa tenggang dipersingkat atau
  ditiadakan untuk trial.
- Upgrade ke lisensi berbayar cukup dengan memasang lisensi baru; data selama trial tetap ada.
- Masih perlu diputuskan: trial diterbitkan vendor per permintaan (berkas atau kunci online),
  atau otomatis saat instalasi pertama dengan kunci trial bawaan.

### 2.3 Nama produk PanduArah

(keputusan pemilik 2026-10-05):
- Bentuk resmi: **PanduArah** untuk logo dan teks, **panduarah** untuk domain dan email.
  Tagline Inggris untuk pasar luar negeri: "PanduArah — Indoor Navigation".
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
