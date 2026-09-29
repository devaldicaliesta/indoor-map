# Spesifikasi Kebutuhan Fungsional – Indoor Map & Navigation

Sep 29, 2026 · @devaldicaliesta

## 1. Pendahuluan

Dokumen ini menetapkan semua kebutuhan fungsional aplikasi Admin (tab ini) serta Visitor dan Info Point (tab Visitor & Info Point) agar klien dari industri apa pun (rumah sakit, kampus, perkantoran, bandara, stasiun, pabrik, gedung pemerintahan, pusat perbelanjaan, venue acara) dapat membangun, memelihara, dan menerbitkan indoor map serta indoor navigation di server mereka sendiri, dengan hak pakai yang diatur lisensi berlangganan.

**Lingkup:** struktur venue dan gedung, tipe venue dan template, kartografi, tampilan 2D/3D, jaringan navigasi, lokasi/POI, titik asal (QR titik asal dan Info Point), kontrol kualitas dan publish, serta lisensi. Modul bisnis (event, promo, iklan, portal pemilik lokasi, analitik) dan Vendor Portal (penjualan langganan, pembuatan lisensi, pembayaran) berada di luar lingkup dokumen ini.

**Model distribusi:** seluruh sistem (Admin, Visitor, Info Point, database) dipasang di server klien (on-premise). Hak pakai ditentukan oleh file lisensi bertanda tangan digital yang diterbitkan vendor untuk jangka waktu langganan tertentu. Server klien diasumsikan selalu terhubung internet.

### Aplikasi dalam sistem

| Aplikasi | Pengguna | Fungsi | Platform |
| --- | --- | --- | --- |
| Admin | Tim pengelola gedung milik klien, dengan role (lihat Aktor dan role) | Membangun dan mengelola peta, navigasi, lokasi, titik asal, publish, lisensi | Web desktop |
| Visitor | Pengunjung dengan perangkatnya sendiri, tanpa login | Mencari lokasi dan mengikuti rute dari HP, dibuka lewat tautan atau scan QR titik asal | Web/PWA di HP |
| Info Point | Pengunjung di lokasi, tanpa login | Mode khusus dari aplikasi Visitor: layar penuh, titik "Anda di sini" tetap, reset otomatis saat tidak dipakai | Aplikasi Visitor dalam mode Info Point di browser layar penuh; shell WPF + WebView2 menyusul di F2 |

Info Point bersifat opsional: venue tanpa perangkat layar tetap cukup memakai QR titik asal.

### Istilah

| Istilah | Arti |
| --- | --- |
| Klien | Organisasi yang berlangganan dan memasang sistem |
| Venue | Satu kawasan milik klien, misalnya satu rumah sakit, satu kampus, satu bandara, atau satu kompleks perkantoran |
| Gedung | Bangunan di dalam venue; venue dapat punya satu atau banyak gedung |
| Lokasi/POI | Tujuan di peta: poli, ruang kelas, ruang rapat, gate, gerai, dan sebagainya |
| Tipe lokasi | Jenis lokasi beserta field kustomnya, misalnya Poli, Ruang Kelas, atau Gate |
| Unit | Ruang fisik yang digambar di peta dan ditempati lokasi |
| Pengunjung | Siapa pun yang mencari arah: pasien, mahasiswa, karyawan, tamu, penumpang, pelanggan |
| Info Point | Layar sentuh mandiri yang terpasang di satu titik tetap di venue, dipakai pengunjung untuk mencari lokasi dan rute. Di industri wayfinding juga dikenal sebagai kiosk atau digital directory |

### Aktor dan role

| Role | Hak akses |
| --- | --- |
| Super Admin | Semua modul, kelola pengguna, publish, rollback, kelola lisensi |
| Admin | Semua modul data dan peta, publish, rollback |
| Editor | Mengedit draft peta, rute, lokasi, dan titik asal; tidak dapat publish, rollback, mengelola pengguna, atau lisensi |
| Operator | Membuat, memperpanjang, dan mengakhiri penutupan sementara; melihat peta dan daftar penutupan. Untuk petugas lapangan seperti satpam, teknisi, atau facility staff |
| Viewer | Melihat semua modul kecuali Pengguna dan Lisensi, tanpa dapat mengubah apa pun. Untuk manajemen atau auditor |
| Sistem | Proses otomatis: validasi, pembuatan snapshot, jadwal penutupan, pemeriksaan lisensi |

Vendor tidak memiliki akun di instalasi klien; hubungan vendor dan klien hanya melalui file lisensi.

### Konvensi

- **ID kebutuhan:** `FR-<MODUL>-<nomor>`, misalnya FR-NAV-03.
- **Prioritas:** MVP = wajib di versi pertama · F2 = fase 2 · BL = backlog.
- Kata "harus" berarti kebutuhan wajib dipenuhi untuk prioritas yang tercantum.

## 2. Akses Admin (FR-AUTH)

Hanya pengguna terdaftar yang dapat masuk, dan setiap perubahan peta terlindung dari bentrok antar-editor.

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-AUTH-01 | Login | Masuk dengan email dan password. Sesi berakhir otomatis setelah tidak aktif. | MVP |
| FR-AUTH-02 | Reset password | Pengguna menerima tautan reset melalui email. | MVP |
| FR-AUTH-03 | Kelola pengguna | Super Admin dapat menambah, menonaktifkan, dan mengubah role pengguna. | MVP |
| FR-AUTH-04 | Otorisasi per role | Menu dan aksi mengikuti matriks role pada Bab 1; aksi terlarang ditolak di server (RLS), bukan hanya disembunyikan di UI. | MVP |
| FR-AUTH-05 | Kunci edit per lantai | Saat pengguna membuka editor sebuah lantai, lantai terkunci dan pengguna lain melihat "sedang diedit oleh X" dalam mode baca. Kunci lepas saat keluar atau setelah 30 menit tidak aktif; Super Admin dapat membukanya paksa. | MVP |
| FR-AUTH-06 | Hak akses granular | Izin per modul (misalnya hanya lokasi, hanya rute). | F2 |
| FR-AUTH-07 | Audit log | Mencatat siapa mengubah data apa dan kapan. | F2 |

**Pengaturan sistem (FR-SYS)** — dibutuhkan karena sistem dipasang di server klien:

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-SYS-01 | Pengaturan sistem | Super Admin mengatur URL publik Visitor (dipakai semua QR, tautan bagikan, dan URL Info Point), server email/SMTP (untuk reset password), serta zona waktu dan bahasa default. Tersedia tombol uji kirim email. | MVP |

## 3. Struktur Venue & Gedung (FR-VEN)

Admin mendefinisikan hierarki Venue → Gedung → Lantai, memilih tipe venue beserta templatenya, lalu menempatkan denah setiap lantai secara tepat di peta.

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-VEN-01 | Data venue | Nama, alamat, koordinat pusat, logo, zona waktu. | MVP |
| FR-VEN-02 | Tipe venue dan template | Saat membuat venue, admin memilih tipe: rumah sakit, kampus, perkantoran, bandara/stasiun, pabrik/gudang, pusat perbelanjaan, atau kustom. Sistem mengisi tipe lokasi, kategori, jenis fasilitas, dan field kustom bawaan dari template; semuanya tetap dapat diubah. Template disediakan vendor di dalam paket aplikasi; klien hanya mengubah salinannya di venue, bukan template aslinya. | MVP |
| FR-VEN-03 | Multi-venue | Klien dapat mengelola lebih dari satu venue, dibatasi kuota lisensi (FR-LIC-06). | MVP |
| FR-VEN-04 | Kelola gedung | Tambah, ubah, hapus gedung dalam venue: nama, kode, dan posisi/footprint di peta. Venue dengan satu gedung tetap memakai struktur yang sama. Setiap venue juga otomatis memiliki satu lapisan Area Luar di level dasar untuk menggambar jalan, taman, parkir, dan jalur antar-gedung. | MVP |
| FR-VEN-05 | Kelola lantai | Lantai milik satu gedung: nama tampilan (B1, GF, L1), nomor level (bilangan bulat, boleh negatif), tinggi lantai (meter), urutan. Lantai yang masih punya fitur tidak dapat dihapus tanpa konfirmasi. | MVP |
| FR-VEN-06 | Default tampilan | Gedung dan lantai yang tampil pertama kali di Visitor. | MVP |
| FR-VEN-07 | Upload denah | Unggah denah per lantai dalam format gambar (PNG, JPG), PDF (halaman dipilih), atau CAD (DWG, DXF). File CAD dikonversi otomatis di server menjadi gambar resolusi tinggi untuk dijiplak, dan admin dapat memilih layer CAD yang ditampilkan. Denah dapat diganti; versi lama tetap tersimpan. | MVP |
| FR-VEN-08 | Georeferensi | Menempatkan denah di peta dengan menarik 4 sudut, memutar (arah utara), dan mengatur skala. Untuk CAD, skala dapat diambil dari satuan file. Tersedia pengukur jarak untuk mencocokkan skala dengan ukuran nyata. | MVP |
| FR-VEN-09 | Opasitas denah | Transparansi denah dapat diatur agar mudah menjiplak di editor. | MVP |
| FR-VEN-10 | Keselarasan antarlantai | Menampilkan denah lantai lain sebagai lapisan acuan untuk memastikan lift, eskalator, dan tangga menumpuk tepat. | MVP |
| FR-VEN-11 | Label kustom | Nama menu dan istilah dapat diganti per venue, misalnya "Lokasi" menjadi "Poli & Ruangan" di rumah sakit. | F2 |
| FR-VEN-12 | Pintu masuk venue | Menandai pintu masuk dan titik drop-off, masing-masing dengan tautan Google Maps. | F2 |
| FR-VEN-13 | Duplikasi lantai | Menyalin geometri dan jalur sebuah lantai ke lantai baru. | F2 |
| FR-VEN-14 | Import vektor CAD | Layer CAD terpilih (dinding, ruang) diimpor langsung menjadi fitur peta, lalu dirapikan admin, sehingga tidak perlu menjiplak manual. Pengembangan lanjut (backlog): deteksi otomatis ruang dan dinding dari denah gambar atau PDF dengan bantuan AI. | F2 |

## 4. Kartografi (FR-MAP)

Admin menggambar seluruh isi lantai di atas denah dalam mode 2D; hasilnya menjadi peta yang tampil di Visitor dan Info Point.

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-MAP-01 | Jenis fitur | Tersedia jenis: unit, koridor/area jalan, dinding, pintu, lift, eskalator, tangga, pintu keluar, area non-akses (void, ruang servis), serta area luar gedung (jalan, trotoar, taman, area parkir) untuk venue dengan beberapa gedung. | MVP |
| FR-MAP-02 | Alat gambar | Poligon (unit, area), garis (dinding), dan titik (pintu, fasilitas). | MVP |
| FR-MAP-03 | Edit geometri | Pindah, ubah vertex, tambah/hapus vertex, putar, hapus fitur; multi-select. | MVP |
| FR-MAP-04 | Snapping | Titik menempel ke vertex dan tepi fitur terdekat serta sudut 90°. | MVP |
| FR-MAP-05 | Undo/redo | Minimal 50 langkah selama sesi edit. | MVP |
| FR-MAP-06 | Atribut unit | Kode unit berformat bebas dan unik per venue (misalnya L1-023, R-301, Poli-A2), luas m² (dihitung otomatis, dapat dikoreksi), status unit: terisi, kosong, renovasi. | MVP |
| FR-MAP-07 | Fasilitas umum | Titik fasilitas dengan jenis yang dapat ditambah admin; jenis bawaan berasal dari template tipe venue (misalnya toilet, musala, ATM, P3K, pusat informasi, serta fasilitas keselamatan seperti APAR, titik kumpul, dan pintu darurat). Setiap fasilitas punya nama, ikon, dan lantai; ikon dapat diunggah sendiri. | MVP |
| FR-MAP-08 | Panel daftar fitur | Daftar semua fitur per lantai dengan pencarian; klik untuk menyorot fitur di peta. | MVP |
| FR-MAP-09 | Validasi geometri | Sistem menandai poligon tidak tertutup, saling tumpang tindih, berada di luar batas lantai, atau kode unit ganda. | MVP |
| FR-MAP-10 | Simpan draft | Perubahan tersimpan otomatis ke draft; tidak memengaruhi peta yang sudah publish. | MVP |
| FR-MAP-11 | Landmark | Menandai fitur sebagai landmark (lobi utama, air mancur, taman, loket pendaftaran) untuk instruksi rute. | F2 |
| FR-MAP-12 | Kontrol label | Posisi label, prioritas, dan rentang zoom tampil. | F2 |
| FR-MAP-13 | Area temporer | Booth/pop-up dengan tanggal mulai dan selesai; tampil dan hilang otomatis. | F2 |
| FR-MAP-14 | Model 3D | Unggah model GLB dan tempatkan dengan posisi, skala, rotasi. | BL |

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-MAP-15 | Export peta cetak | Export peta per lantai ke PDF atau SVG beresolusi tinggi dengan legenda, untuk papan denah statis, peta evakuasi, atau brosur. | F2 |

## 5. Tampilan 2D/3D (FR-VIS)

2D dan 3D memakai data yang sama; admin hanya mengatur tinggi, warna, dan kamera.

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-VIS-01 | Tinggi default | Tinggi 3D per jenis fitur (contoh: unit 4 m, dinding 5 m, koridor 0 m). | MVP |
| FR-VIS-02 | Override tinggi | Tinggi dapat diubah per fitur. | MVP |
| FR-VIS-03 | Warna | Warna lantai, dinding, unit, koridor, dan fasilitas per jenis fitur. | MVP |
| FR-VIS-04 | Mode default | Mode awal venue: 2D atau 3D. | MVP |
| FR-VIS-05 | Kamera awal | Pitch, zoom, dan rotasi awal diatur dengan menggeser peta lalu menekan "simpan sebagai tampilan awal". | MVP |
| FR-VIS-06 | Preview 3D | Tombol beralih 2D/3D di editor untuk memeriksa hasil. | MVP |
| FR-VIS-07 | Branding Visitor | Logo venue, warna utama, dan nama tampilan yang dipakai di Visitor dan Info Point, agar peta terasa sebagai bagian dari identitas klien. | MVP |
| FR-VIS-08 | Warna per kategori | Warna unit mengikuti tipe atau kategori lokasi. | F2 |
| FR-VIS-09 | Lantai bertumpuk | Jarak antarlantai dan tingkat transparansi lantai non-aktif. | F2 |

## 6. Jaringan Navigasi (FR-NAV)

Admin membangun graf jalur (node dan edge) yang dipakai untuk menghitung rute terpendek dan instruksi langkah demi langkah, termasuk perpindahan lantai.

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-NAV-01 | Gambar jalur | Admin menggambar garis jalur di koridor; node dibuat otomatis di ujung dan persimpangan, edge di antaranya. Panjang edge dihitung otomatis dalam meter. Jalur juga dapat digambar di lapisan Area Luar untuk menghubungkan antar-gedung dalam satu venue; pintu masuk gedung menjadi penghubung antara jalur lantai dasar gedung dan jalur Area Luar. | MVP |
| FR-NAV-02 | Edit graf | Pindah dan hapus node/edge, gabungkan node yang berdekatan, pisahkan edge. | MVP |
| FR-NAV-03 | Titik masuk tujuan | Setiap unit dan fasilitas punya minimal satu titik masuk yang terhubung ke graf; bisa diatur manual atau disarankan otomatis dari pintu unit. | MVP |
| FR-NAV-04 | Lift | Konektor antar-lantai dengan daftar lantai yang dilayani; hanya lantai itu yang terhubung. | MVP |
| FR-NAV-05 | Eskalator | Konektor antara dua lantai dengan arah: naik, turun, atau dua arah. Rute tidak boleh melawan arah. | MVP |
| FR-NAV-06 | Tangga | Konektor antar-lantai dua arah. | MVP |
| FR-NAV-07 | Aksesibilitas | Setiap edge dan konektor punya flag aksesibel. Rute kursi roda hanya memakai elemen aksesibel (lift, bukan eskalator/tangga). | MVP |
| FR-NAV-08 | Penutupan sementara | Menandai area, edge, lift, atau eskalator sebagai tertutup dengan alasan, waktu mulai, dan waktu selesai (opsional). Selama berlaku, rute menghindarinya; setelah selesai, otomatis dibuka kembali. | MVP |
| FR-NAV-09 | Template instruksi | Teks instruksi per bahasa (ID/EN) untuk aksi: mulai, lurus, belok kiri/kanan, naik/turun lift, eskalator, tangga, keluar gedung, masuk gedung, tiba. Teks dapat diedit admin. | MVP |
| FR-NAV-10 | Test route | Admin memilih asal dan tujuan (unit, fasilitas, QR titik asal, Info Point, atau titik bebas), lalu melihat garis rute, jarak, dan daftar instruksi, dengan opsi mode aksesibel. | MVP |
| FR-NAV-11 | Tampilan graf | Node dan edge dapat disembunyikan/ditampilkan; edge tertutup dan tidak aksesibel diberi warna berbeda. | MVP |
| FR-NAV-12 | Instruksi berbasis landmark | Instruksi menyebut landmark terdekat ("belok kiri setelah Atrium Utama"). | F2 |
| FR-NAV-13 | Aturan jalur | Edge satu arah dan edge dengan jam buka tertentu. | F2 |
| FR-NAV-14 | Bobot preferensi | Penalti per jenis konektor (misalnya utamakan eskalator, hindari tangga). | F2 |
| FR-NAV-15 | Estimasi waktu | Kecepatan jalan dan waktu per konektor untuk menampilkan "± 3 menit". | F2 |
| FR-NAV-16 | Mode evakuasi | Rute ke pintu keluar terdekat, diaktifkan dari admin. | BL |

**Aturan perhitungan rute:** rute terpendek berdasarkan jarak (dan waktu konektor pada F2), mengabaikan elemen tertutup, mematuhi arah eskalator, dan memakai hanya elemen aksesibel bila mode kursi roda aktif. Jika tujuan memiliki beberapa unit atau titik masuk, rute menuju titik masuk yang terdekat dari titik asal. Jika tidak ada rute, sistem menampilkan pesan dan alasannya.

## 7. Lokasi/POI (FR-LOC)

Lokasi adalah tujuan yang dicari pengunjung. Jenis dan datanya diatur lewat tipe lokasi dan field kustom, sehingga satu sistem melayani berbagai industri tanpa perubahan kode.

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-LOC-01 | Tipe lokasi | Kelola tipe lokasi: nama, ikon, warna. Tipe bawaan berasal dari template tipe venue (rumah sakit: Poli, Lab, Apotek · kampus: Ruang Kelas, Lab, Fakultas · perkantoran: Ruang Rapat, Divisi · bandara: Gate, Konter, Lounge · pusat perbelanjaan: Gerai, F&B). | MVP |
| FR-LOC-02 | Field kustom | Setiap tipe lokasi punya field sendiri dengan jenis: teks, angka, pilihan, jam operasional, gambar, tautan. Setiap field dapat diatur wajib/opsional, tampil di Visitor atau tidak, dan dapat dicari atau tidak. | MVP |
| FR-LOC-03 | Data lokasi | Kode lokasi unik (opsional), nama, tipe, kategori (bisa lebih dari satu), deskripsi singkat, logo/foto, lalu field kustom sesuai tipenya. Form menyesuaikan tipe yang dipilih. | MVP |
| FR-LOC-04 | Tautan ke unit | Lokasi ditautkan ke satu atau beberapa unit melalui kode unit. Satu unit hanya boleh dimiliki satu lokasi aktif. | MVP |
| FR-LOC-05 | Status lokasi | Aktif, segera buka (dengan tanggal), nonaktif sementara (renovasi, tutup), nonaktif permanen. Lokasi nonaktif permanen tidak muncul di pencarian dan unitnya berstatus kosong. | MVP |
| FR-LOC-06 | Jam operasional | Untuk tipe yang memakai field jam operasional: jam per hari dalam seminggu dan pengecualian tanggal tertentu. | MVP |
| FR-LOC-07 | Kategori | Kelola kategori per tipe lokasi beserta ikon dan urutan tampil (misalnya spesialisasi di rumah sakit, fakultas di kampus). | MVP |
| FR-LOC-08 | Import massal | Sistem membuat template CSV/Excel per tipe lokasi, termasuk kolom field kustom. Baris dicocokkan ke lokasi yang sudah ada lewat kode lokasi (jika kosong, lewat kode unit), dan ditautkan ke unit lewat kode unit; tampil pratinjau, baris gagal beserta alasannya, lalu konfirmasi. | MVP |
| FR-LOC-09 | Alias pencarian | Kata kunci tambahan per lokasi, kategori, atau fasilitas ("kopi" → kafe, "rontgen" → radiologi). | MVP |
| FR-LOC-10 | Daftar dan filter | Tabel lokasi dengan pencarian, filter tipe/kategori/status/gedung/lantai, dan penanda lokasi yang belum tertaut ke unit. | MVP |
| FR-LOC-11 | Multi-bahasa | Nama tipe, kategori, dan deskripsi dalam ID/EN. | F2 |

## 8. Titik Asal Navigasi (FR-DEV)

Titik asal adalah posisi "Anda di sini" yang dipakai untuk menghitung rute. MVP menyediakan dua jenis: QR titik asal (murah, untuk semua venue) dan Info Point (opsional, layar tetap). Pengunjung juga selalu dapat memilih posisinya secara manual di Visitor.

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-DEV-01 | QR titik asal | Admin membuat titik asal: nama, gedung, lantai, posisi di peta, dan arah hadap. Sistem menghasilkan QR yang membuka Visitor dengan posisi dan arah tersebut. QR dapat diunduh (PNG/PDF) untuk dicetak dan ditempel di pilar, lift, atau pintu masuk. | MVP |
| FR-DEV-02 | Snap ke jalur | Setiap QR titik asal dan Info Point otomatis terhubung ke node jalur terdekat sebagai titik awal rute. | MVP |
| FR-DEV-03 | Info Point | Admin mendaftarkan Info Point: nama/kode, gedung, lantai, posisi, dan arah hadap. Sistem menghasilkan URL mode Info Point (layar penuh, titik asal tetap, peta diputar sesuai arah hadap) untuk dibuka di perangkat layar sentuh. | MVP |
| FR-DEV-04 | Konfigurasi Info Point | Mode 2D/3D, paksa 2D (untuk hardware lemah), bahasa default, dan durasi idle sebelum reset. | MVP |
| FR-DEV-05 | Pairing perangkat | Kode pairing sekali pakai; perangkat menerima token yang dapat dicabut, sehingga hanya perangkat resmi yang memuat mode Info Point. | F2 |
| FR-DEV-06 | Status Info Point | Online/offline berdasarkan heartbeat, waktu terakhir aktif, dan versi peta yang dimuat. | F2 |
| FR-DEV-07 | Reload jarak jauh | Perintah muat ulang ke satu atau semua Info Point. | F2 |
| FR-DEV-08 | Shell WPF | Aplikasi Windows pembungkus: auto-start, layar penuh terkunci, watchdog jika crash. | F2 |
| FR-DEV-09 | Beacon | Inventaris beacon: posisi, ID, baterai, terakhir terdeteksi (untuk blue dot). | BL |

## 9. Kontrol Kualitas & Publish (FR-PUB)

Semua perubahan dikerjakan di draft, diperiksa otomatis, lalu diterbitkan sebagai satu snapshot berversi yang dibaca Visitor dan Info Point.

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-PUB-01 | Draft vs published | Admin selalu mengedit draft; Visitor dan Info Point hanya membaca versi published. | MVP |
| FR-PUB-02 | Ringkasan perubahan | Sebelum publish, tampil daftar perubahan sejak versi terakhir (fitur, rute, lokasi, titik asal). | MVP |
| FR-PUB-03 | Validasi otomatis | Pemeriksaan wajib, dibagi Error (memblokir publish) dan Peringatan (boleh lanjut). Rincian di bawah tabel. | MVP |
| FR-PUB-04 | Klik untuk memperbaiki | Setiap temuan validasi dapat diklik untuk langsung menuju lantai dan fitur terkait. | MVP |
| FR-PUB-05 | Preview | Melihat draft seperti tampilan Info Point (dari posisi Info Point tertentu) dan HP, dalam 2D dan 3D. | MVP |
| FR-PUB-06 | Publish | Hanya Admin dan Super Admin. Sistem membuat snapshot JSON bernomor versi, dengan catatan rilis opsional; Info Point memuat versi baru pada pemeriksaan berkala berikutnya (FR-IP-06). | MVP |
| FR-PUB-07 | Riwayat versi | Daftar versi: nomor, waktu, penerbit, catatan. | MVP |
| FR-PUB-08 | Rollback | Mengaktifkan kembali versi lama sebagai versi published terbaru; draft tidak ikut berubah. | MVP |
| FR-PUB-09 | Publish terjadwal | Menerbitkan draft otomatis pada tanggal dan jam tertentu. | F2 |

**Daftar validasi (FR-PUB-03):**

- **Error:** geometri tidak valid atau tumpang tindih; nomor unit ganda; unit atau fasilitas tanpa titik masuk ke graf; lokasi aktif tanpa unit; node/area terisolasi yang tidak dapat dijangkau dari titik asal (QR atau Info Point) mana pun; titik asal tidak terhubung ke graf; konektor antar-lantai hanya terhubung di satu sisi; pemakaian melebihi kuota lisensi; lisensi tidak aktif atau dalam masa tenggang.
- **Peringatan:** lantai tanpa akses lift (rute kursi roda terputus); lokasi dengan field wajib yang belum diisi; template instruksi belum diterjemahkan; denah lantai belum digeoreferensi.

## 10. Lisensi (FR-LIC)

Sistem hanya berjalan penuh dengan file lisensi yang sah dan masih berlaku. Server klien selalu terhubung internet sehingga aktivasi dan pembaruan lisensi berjalan otomatis, sementara verifikasi tetap lokal. Lisensi menentukan masa langganan, kuota, serta fitur yang aktif.

| ID | Kebutuhan | Deskripsi dan aturan | Prioritas |
| --- | --- | --- | --- |
| FR-LIC-01 | Aktivasi | Instalasi baru hanya menampilkan halaman aktivasi. Aktivasi online: Super Admin memasukkan kunci lisensi, sistem mengirim `instance_id` (sidik instalasi) ke server vendor dan menerima file lisensi otomatis. Unggah file lisensi manual tetap tersedia sebagai cadangan. | MVP |
| FR-LIC-02 | Verifikasi lisensi | Sistem memverifikasi tanda tangan digital dengan public key vendor yang tertanam di aplikasi, mencocokkan `instance_id`, dan memeriksa masa berlaku. Verifikasi dilakukan lokal sehingga gangguan internet sementara tidak menghentikan sistem. | MVP |
| FR-LIC-03 | Isi lisensi | Lisensi memuat: ID lisensi, nama klien, paket, tanggal mulai dan berakhir, kuota (venue, gedung, lantai, Info Point), daftar fitur, `instance_id`, dan tanda tangan. | MVP |
| FR-LIC-04 | Check-in online | Sistem memeriksa status lisensi ke server vendor setiap 24 jam (perpanjangan, perubahan paket, pencabutan) dan memperbarui file lisensi otomatis. Jika check-in gagal, sistem tetap berjalan dengan lisensi lokal; setelah 7 hari berturut-turut gagal, Admin menampilkan peringatan. | MVP |
| FR-LIC-05 | Halaman status | Super Admin melihat klien, paket, masa berlaku, sisa hari, fitur aktif, dan waktu check-in terakhir. | MVP |
| FR-LIC-06 | Penegakan kuota | Penambahan venue, gedung, lantai, atau Info Point yang melebihi kuota ditolak di server; tombol di UI dinonaktifkan dengan pesan "kuota paket tercapai". Pemakaian ditampilkan per jenis, misalnya Info Point 7/10. | MVP |
| FR-LIC-07 | Fitur per paket | Fitur di luar paket (misalnya mode 3D, Info Point) terkunci di Admin dan tidak disertakan dalam snapshot publish. | MVP |
| FR-LIC-08 | Pengingat | Banner di seluruh Admin pada H-30, H-7, dan H-1 sebelum lisensi berakhir. | MVP |
| FR-LIC-09 | Masa tenggang dan kedaluwarsa | Perilaku setelah lisensi berakhir mengikuti tabel di bawah. | MVP |
| FR-LIC-10 | Perpanjangan dan perubahan paket | Lisensi baru diterima otomatis lewat check-in (atau unggah manual) tanpa kehilangan data. Jika paket baru lebih kecil dan pemakaian melebihi kuota, data tidak dihapus, tetapi penambahan dan publish diblokir sampai pemakaian sesuai kuota. | MVP |
| FR-LIC-11 | Proteksi manipulasi waktu | Sistem memakai waktu dari server vendor saat check-in dan menyimpan waktu terakhir yang terlihat; jika jam server klien mundur secara tidak wajar, lisensi dianggap tidak valid sampai jam diperbaiki. | MVP |
| FR-LIC-12 | Pencabutan | Lisensi yang dicabut vendor (misalnya pelanggaran kontrak) langsung masuk status kedaluwarsa pada check-in berikutnya. | MVP |
| FR-LIC-13 | Riwayat lisensi | Daftar lisensi yang pernah aktif beserta waktu dan sumbernya (check-in atau unggah manual). | F2 |

**Perilaku setelah lisensi berakhir (FR-LIC-09):**

| Periode | Admin | Visitor dan Info Point |
| --- | --- | --- |
| H-30 sampai hari berakhir | Normal, dengan banner pengingat | Normal |
| Masa tenggang 14 hari | Read-only: tidak dapat mengedit atau publish | Tetap berjalan dengan versi published terakhir |
| Setelah masa tenggang | Hanya halaman Lisensi | Menampilkan pesan "layanan tidak aktif" |

Masa tenggang 14 hari sudah disepakati sebagai default dan dapat diatur per paket di Vendor Portal.

## 11. Aturan Lintas Modul, Di Luar Lingkup, dan Ringkasan

### Aturan bisnis lintas modul

1. Tidak ada perubahan yang tampil ke pengunjung sebelum publish, kecuali penutupan sementara (FR-NAV-08) yang langsung berlaku agar pengunjung tidak diarahkan ke area tertutup.
2. Menghapus unit yang masih tertaut lokasi atau Info Point harus meminta konfirmasi dan melepas tautannya.
3. Mengubah status lokasi menjadi nonaktif permanen otomatis mengubah status unitnya menjadi kosong.
4. Kode unit unik per venue dan menjadi kunci pencocokan saat import.
5. Semua jarak disimpan dalam meter; waktu disimpan dalam zona waktu venue. Visitor dan Info Point mendukung Bahasa Indonesia (default) dan Inggris; antarmuka Admin berbahasa Indonesia.
6. Semua data menyimpan `venue_id`; gedung dan lantai selalu terikat ke venue.
7. Setiap aksi yang menambah data berkuota atau memakai fitur berbayar diperiksa terhadap lisensi di server.
8. Tidak ada istilah khusus industri di kode; perbedaan antar-industri hanya diatur lewat template, tipe lokasi, field kustom, dan label.

### Di luar lingkup dokumen ini

- **Modul bisnis:** event dan promo, slot iklan, lokasi unggulan, portal pemilik lokasi, analitik, tema musiman, playlist promo Info Point, jadwal layar Info Point, screenshot Info Point, export GeoJSON/IMDF, integrasi eksternal (API, webhook, sinkronisasi data lokasi dari sistem klien seperti SIMRS atau sistem akademik).
- **Vendor Portal** (dokumen terpisah): data klien, paket langganan, pembuatan dan perpanjangan lisensi, pembayaran, distribusi rilis.
- **Instalasi dan pemeliharaan** (dokumen terpisah): paket Docker, pembaruan versi dan migrasi, backup dan restore.

### Ringkasan jumlah kebutuhan

| Modul | MVP | F2 | BL |
| --- | --- | --- | --- |
| FR-AUTH Akses admin | 5 | 2 | 0 |
| FR-SYS Pengaturan sistem | 1 | 0 | 0 |
| FR-VEN Struktur venue & gedung | 10 | 4 | 0 |
| FR-MAP Kartografi | 10 | 4 | 1 |
| FR-VIS Tampilan 2D/3D | 7 | 2 | 0 |
| FR-NAV Jaringan navigasi | 11 | 4 | 1 |
| FR-LOC Lokasi/POI | 10 | 1 | 0 |
| FR-DEV Titik asal | 4 | 4 | 1 |
| FR-PUB Kontrol kualitas & publish | 8 | 1 | 0 |
| FR-LIC Lisensi | 12 | 1 | 0 |
| FR-VST Visitor (tab Visitor & Info Point) | 16 | 9 | 0 |
| FR-IP Info Point (tab Visitor & Info Point) | 8 | 2 | 0 |
| **Total** | **102** | **34** | **3** |

Modul terberat untuk dikerjakan: FR-MAP, FR-NAV, dan FR-PUB. Fondasi yang harus benar sejak awal: hierarki venue-gedung-lantai, tipe lokasi dengan field kustom, dan pemeriksaan lisensi di server.

### Keputusan yang sudah disepakati

| Topik | Keputusan |
| --- | --- |
| Model deploy | On-premise saja; vendor tidak menyediakan hosting cloud. Seluruh sistem harus dapat dijalankan dengan paket yang sama di server klien maupun di komputer lokal untuk pengembangan dan testing. |
| Koneksi server klien | Selalu terhubung internet; aktivasi dan check-in lisensi online (FR-LIC-01, FR-LIC-04) |
| Bahasa | Indonesia dan Inggris |
| Masa tenggang | 14 hari (FR-LIC-09) |
| Format denah | Gambar (PNG, JPG), PDF, dan CAD (DWG, DXF) (FR-VEN-07) |

Semua pertanyaan terbuka sudah terjawab.
