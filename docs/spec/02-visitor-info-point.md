# Visitor & Info Point

Tab ini menetapkan apa yang dilihat dan dilakukan pengunjung: 16 kebutuhan MVP untuk Visitor dan 8 kebutuhan MVP untuk Info Point. Keduanya adalah satu aplikasi web yang sama; Info Point hanyalah mode tampilan khusus dengan titik asal tetap.

**Prinsip:**

- Pengunjung tidak perlu login atau memasang aplikasi.
- Visitor dan Info Point hanya membaca versi published, kecuali penutupan sementara yang dibaca langsung agar selalu terkini.
- Tidak ada data pribadi pengunjung yang dikumpulkan.
- Semua teks antarmuka dan instruksi rute tersedia dalam Bahasa Indonesia dan Inggris.

## Kebutuhan fungsional Visitor (FR-VST)

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-VST-01 | Akses tanpa login | Visitor dibuka lewat URL venue atau scan QR titik asal; tampil gedung dan lantai default serta kamera awal (FR-VEN-06, FR-VIS-05). | MVP |
| FR-VST-02 | Data published | Visitor memuat snapshot versi published terbaru dan menyimpannya di perangkat, sehingga kunjungan berikutnya lebih cepat. | MVP |
| FR-VST-03 | Navigasi peta | Pemilih gedung dan lantai, zoom, geser, putar, dan tombol kembali ke tampilan awal. Nama lokasi dan ikon fasilitas tampil di peta; label yang bertumpuk disembunyikan otomatis sesuai tingkat zoom. Mengetuk unit atau fasilitas membuka detailnya. Tombol 2D/3D tampil jika fitur 3D aktif di lisensi (FR-LIC-07). | MVP |
| FR-VST-04 | Pencarian | Mencari berdasarkan nama lokasi, kategori, jenis fasilitas, kode unit, alias, dan field kustom yang dapat dicari. Hasil muncul saat mengetik, toleran terhadap huruf besar/kecil dan salah ketik ringan. Lokasi nonaktif permanen tidak muncul. | MVP |
| FR-VST-05 | Jelajah kategori dan fasilitas | Daftar tipe lokasi, kategori, dan jenis fasilitas; memilih salah satunya menampilkan lokasinya di daftar dan peta. | MVP |
| FR-VST-06 | Detail lokasi | Nama, tipe, kategori, gedung, lantai, kode unit, deskripsi, foto, field kustom yang ditandai tampil, dan status (buka/tutup sekarang menurut jam operasional, segera buka, nonaktif sementara). Tombol **Rute ke sini** dan **Bagikan**. | MVP |
| FR-VST-07 | Titik asal | Titik asal diperoleh dari QR titik asal (otomatis), dengan mencari lokasi atau fasilitas lalu memilih "Saya di sini", atau dengan mengetuk posisi di peta. Titik asal dapat diganti kapan saja. | MVP |
| FR-VST-08 | Hitung rute | Rute terpendek dari titik asal ke tujuan sesuai aturan perhitungan rute (FR-NAV), termasuk penutupan aktif dan arah eskalator. Opsi **Rute aksesibel** (kursi roda). Jika tidak ada rute, tampil pesan beserta alasannya. | MVP |
| FR-VST-09 | Tampilan rute | Garis rute di peta, jarak total, penanda asal dan tujuan, serta penanda perpindahan lantai dan gedung. Peta berpindah lantai otomatis mengikuti langkah yang sedang dilihat. | MVP |
| FR-VST-10 | Instruksi langkah demi langkah | Daftar instruksi dari template (FR-NAV-09) dengan ikon aksi; mode langkah dengan tombol maju/mundur yang menggeser peta ke segmen terkait. | MVP |
| FR-VST-11 | Bahasa | Pilihan Bahasa Indonesia dan Inggris untuk antarmuka dan instruksi; default mengikuti bahasa perangkat, lalu bahasa default venue. | MVP |
| FR-VST-12 | Bagikan | Tautan ke lokasi atau ke rute (asal dan tujuan) yang membuka Visitor pada keadaan yang sama. Tautan memakai parameter URL yang terdokumentasi (deep link): venue, gedung, lantai, lokasi, titik asal, tujuan, mode aksesibel, dan bahasa. Parameter yang sama dipakai QR titik asal dan QR Lanjutkan di HP. | MVP |
| FR-VST-13 | Informasi penutupan | Area dan konektor tertutup ditandai di peta. Jika rute memutar karena penutupan, tampil pemberitahuan singkat. Data penutupan dibaca langsung, tidak menunggu publish. | MVP |
| FR-VST-14 | Pembaruan versi | Saat versi baru dipublish, Visitor memakai versi terbaru pada pembukaan atau refresh berikutnya; rute yang sedang ditampilkan tidak terputus. | MVP |
| FR-VST-15 | Status layanan | Setelah masa tenggang lisensi berakhir, Visitor menampilkan pesan layanan tidak aktif (FR-LIC-09). | MVP |
| FR-VST-16 | Fasilitas terdekat | "Toilet terdekat", "lift terdekat", dan sejenisnya dari titik asal. | F2 |
| FR-VST-17 | Estimasi waktu tempuh | Menampilkan perkiraan menit berjalan (FR-NAV-15). | F2 |
| FR-VST-18 | Konten multi-bahasa | Nama kategori dan deskripsi lokasi dalam bahasa terpilih (FR-LOC-11). | F2 |

**Tambahan (terinspirasi praktik platform wayfinding seperti Mappedin):**

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-VST-19 | Direktori A–Z | Daftar semua lokasi berurutan abjad, dapat difilter per gedung, lantai, dan tipe; berguna bagi pengunjung yang lebih suka menelusuri daripada mengetik. | MVP |
| FR-VST-20 | Lapisan keselamatan | Tombol untuk menampilkan fasilitas keselamatan (APAR, pintu darurat, titik kumpul) dan rute ke pintu keluar terdekat. | F2 |
| FR-VST-21 | Mode teks dan pembaca layar | Instruksi rute dan hasil pencarian dapat dipakai tanpa melihat peta, kompatibel dengan pembaca layar; target kepatuhan WCAG 2.2 level AA untuk Visitor. | F2 |
| FR-VST-22 | Embed di website | Kode embed dan tautan langsung agar peta venue dapat dipasang di website klien. | F2 |

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-VST-23 | Rute multi-tujuan | Pengunjung memilih beberapa tujuan (misalnya pendaftaran → poli → apotek) dan mendapat satu rute berurutan. | F2 |
| FR-VST-24 | Minimap | Gambar peta statis yang diperbesar pada satu lokasi, untuk dipasang di halaman website klien; mengklik minimap membuka lokasi itu di Visitor. | F2 |
| FR-VST-25 | Peta privat | Opsi per venue agar Visitor hanya dapat dibuka pengguna yang login lewat sistem autentikasi klien, untuk kantor atau pabrik yang petanya tidak boleh publik. | F2 |

## Kebutuhan fungsional Info Point (FR-IP)

Info Point memiliki semua fungsi Visitor (FR-VST-03 sampai FR-VST-15), dengan perbedaan berikut.

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-IP-01 | Mode Info Point | Dibuka lewat URL Info Point (FR-DEV-03): layar penuh, penanda "Anda di sini" tetap, peta diputar sesuai arah hadap. | MVP |
| FR-IP-02 | Titik asal tetap | Semua rute dimulai dari posisi Info Point; titik asal tidak dapat diubah pengunjung. | MVP |
| FR-IP-03 | Antarmuka layar sentuh | Tombol dan teks berukuran besar; keyboard virtual di layar untuk pencarian, tidak bergantung pada keyboard sistem operasi. | MVP |
| FR-IP-04 | Lanjutkan di HP | Setelah rute tampil, tersedia QR yang membuka Visitor di HP pengunjung dengan asal dan tujuan yang sama. | MVP |
| FR-IP-05 | Idle dan reset | Setelah durasi idle (FR-DEV-04), pencarian dan rute dihapus, peta kembali ke tampilan awal dan bahasa default. | MVP |
| FR-IP-06 | Pembaruan otomatis | Info Point memeriksa versi published secara berkala (misalnya setiap 5 menit) dan memuat versi baru hanya saat idle, sehingga pengunjung yang sedang memakai tidak terganggu. | MVP |
| FR-IP-07 | Tahan gangguan jaringan | Jika server tidak terjangkau sementara, Info Point tetap menampilkan versi terakhir yang sudah dimuat. | MVP |
| FR-IP-08 | Paksa 2D | Jika diatur di konfigurasi, tombol 3D disembunyikan dan peta selalu 2D. | MVP |
| FR-IP-09 | Mode aksesibilitas | Tombol untuk menurunkan area antarmuka (jangkauan pengguna kursi roda) serta kontras tinggi dan huruf besar. | F2 |
| FR-IP-10 | Pemantauan perangkat | Heartbeat, pairing, dan perintah reload (FR-DEV-05 sampai FR-DEV-07). | F2 |

## User flow pengunjung

### UV-01 Scan QR titik asal lalu menuju lokasi

**Memenuhi:** FR-VST-01, FR-VST-04, FR-VST-06 s.d. FR-VST-10

1. Pengunjung memindai QR di pilar atau lift; Visitor terbuka dengan "Anda di sini" dan arah hadap yang benar.
2. Mengetik di kolom pencarian, misalnya "radiologi"; hasil muncul saat mengetik.
3. Memilih hasil; detail lokasi tampil dengan status buka/tutup.
4. Menekan **Rute ke sini**; garis rute, jarak, dan instruksi tampil.
5. Mengikuti mode langkah; saat instruksi "naik lift ke Lantai 3", peta berpindah ke Lantai 3.

### UV-02 Membuka Visitor tanpa QR

**Memenuhi:** FR-VST-01, FR-VST-05, FR-VST-07, FR-VST-08

1. Pengunjung membuka tautan venue (dari website, undangan, atau pesan).
2. Memilih tujuan dari kategori atau pencarian, lalu menekan **Rute ke sini**.
3. Visitor meminta titik asal: pengunjung mencari tempat terdekat yang ia kenali (misalnya "Lobi Utama") dan memilih **Saya di sini**, atau mengetuk posisinya di peta.
4. Rute tampil seperti UV-01.

### UV-03 Rute aksesibel

**Memenuhi:** FR-VST-08, FR-VST-13

1. Pada layar rute, pengunjung mengaktifkan **Rute aksesibel**.
2. Rute dihitung ulang hanya lewat lift dan jalur aksesibel.
3. Jika lift yang dibutuhkan sedang ditutup, tampil pesan bahwa rute aksesibel tidak tersedia sementara beserta lokasi penutupannya.

### UV-04 Memakai Info Point lalu melanjutkan di HP

**Memenuhi:** FR-IP-01 s.d. FR-IP-05

1. Info Point menampilkan peta dengan "Anda di sini" sesuai arah pengunjung berdiri.
2. Pengunjung menyentuh kolom pencarian; keyboard di layar muncul.
3. Memilih tujuan; rute dan instruksi tampil dari posisi Info Point.
4. Pengunjung memindai QR **Lanjutkan di HP**; rute yang sama terbuka di HP-nya.
5. Setelah pengunjung pergi dan durasi idle tercapai, Info Point kembali ke tampilan awal.

### UV-05 Membagikan lokasi

**Memenuhi:** FR-VST-06, FR-VST-11, FR-VST-12

1. Pengunjung (atau staf) membuka detail lokasi, misalnya ruang rapat.
2. Menekan **Bagikan** dan mengirim tautannya lewat aplikasi pesan.
3. Penerima membuka tautan; Visitor menampilkan lokasi tersebut dalam bahasa perangkat penerima, siap dihitung rutenya.

## Kriteria penerimaan MVP

Diuji dengan data uji yang sama seperti tab Kriteria Penerimaan, di satu HP Android, satu iPhone, dan satu layar sentuh untuk Info Point.

### Visitor

- [ ] **FR-VST-01** Membuka URL venue tanpa login menampilkan gedung, lantai, dan kamera default; membuka dari QR menampilkan titik asal QR tersebut.
- [ ] **FR-VST-02** Kunjungan kedua memuat peta lebih cepat dari kunjungan pertama dan tetap menampilkan versi published terbaru.
- [ ] **FR-VST-03** Pemilih gedung dan lantai, zoom, geser, dan putar berfungsi; nama lokasi dan ikon fasilitas tampil tanpa saling menumpuk; mengetuk unit membuka detailnya; tombol 3D hilang bila fitur 3D tidak aktif di lisensi.
- [ ] **FR-VST-04** Pencarian menemukan lokasi lewat nama, kode unit, kategori, alias, dan field yang dapat dicari; "radilogi" tetap menemukan "Radiologi"; lokasi nonaktif permanen tidak muncul.
- [ ] **FR-VST-05** Memilih kategori atau jenis fasilitas menampilkan semua anggotanya di daftar dan peta.
- [ ] **FR-VST-06** Detail lokasi hanya menampilkan field yang ditandai tampil; status buka/tutup sesuai jam operasional dan zona waktu venue.
- [ ] **FR-VST-07** Ketiga cara menentukan titik asal (QR, pilih lokasi, ketuk peta) berfungsi dan titik asal dapat diganti.
- [ ] **FR-VST-08** Hasil rute sama dengan test route di Admin untuk asal dan tujuan yang sama, termasuk mode aksesibel.
- [ ] **FR-VST-09** Rute antar-lantai menampilkan penanda perpindahan lantai; peta berpindah lantai mengikuti langkah.
- [ ] **FR-VST-10** Mode langkah maju/mundur menggeser peta ke segmen yang benar; teks sama dengan template instruksi.
- [ ] **FR-VST-11** Perangkat berbahasa Inggris membuka Visitor dalam Bahasa Inggris; pilihan bahasa manual berfungsi.
- [ ] **FR-VST-12** Tautan bagikan lokasi dan rute membuka keadaan yang sama di perangkat lain.
- [ ] **FR-VST-13** Membuat penutupan di Admin langsung tampil di Visitor yang sedang terbuka tanpa publish, dan rute memutar dengan pemberitahuan.
- [ ] **FR-VST-14** Setelah publish, refresh menampilkan versi baru; rute yang sedang terbuka tidak terputus sebelum refresh.
- [ ] **FR-VST-15** Setelah masa tenggang berakhir, Visitor menampilkan pesan layanan tidak aktif.

* [ ] **FR-VST-19** Direktori menampilkan semua lokasi aktif berurutan abjad; filter gedung, lantai, dan tipe bekerja; memilih lokasi membuka detailnya.

### Info Point

- [ ] **FR-IP-01** URL Info Point membuka layar penuh dengan penanda "Anda di sini" dan orientasi peta sesuai arah hadap.
- [ ] **FR-IP-02** Semua rute dimulai dari Info Point; tidak ada kontrol untuk mengganti titik asal.
- [ ] **FR-IP-03** Pencarian dapat dilakukan seluruhnya dengan keyboard di layar; tombol mudah disentuh.
- [ ] **FR-IP-04** QR Lanjutkan di HP membuka rute yang sama di HP.
- [ ] **FR-IP-05** Setelah durasi idle, pencarian dan rute hilang, dan tampilan serta bahasa kembali ke default.
- [ ] **FR-IP-06** Versi baru termuat setelah publish, tetapi tidak saat pengunjung sedang memakai layar.
- [ ] **FR-IP-07** Dengan server diputus, Info Point tetap bisa mencari dan menampilkan rute dari versi terakhir.
- [ ] **FR-IP-08** Dengan paksa 2D aktif, tombol 3D tidak tampil.
