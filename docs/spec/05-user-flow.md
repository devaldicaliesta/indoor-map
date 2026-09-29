# User Flow Admin

Enam belas user flow di bawah ini menjabarkan langkah admin di layar untuk setiap tugas utama MVP. Setiap flow mencantumkan layar awal, langkah, hasil, dan kebutuhan yang dipenuhi.

## Struktur menu Admin

| Menu | Isi | Role yang dapat mengubah |
| --- | --- | --- |
| Venue | Daftar venue, pengaturan venue, gedung, lantai, denah | Admin, Super Admin |
| Editor Peta | Kanvas per lantai: fitur, fasilitas, jalur, konektor, test route | Editor, Admin, Super Admin |
| Lokasi | Daftar lokasi, import, tipe lokasi dan field, kategori, alias | Editor, Admin, Super Admin |
| Penutupan | Daftar penutupan aktif dan terjadwal | Operator, Admin, Super Admin |
| Titik Asal | QR titik asal, Info Point, konfigurasi Info Point | Editor, Admin, Super Admin |
| Publish | Validasi, ringkasan perubahan, preview, riwayat versi | Admin, Super Admin (Editor hanya menjalankan validasi) |
| Pengaturan | Tampilan 2D/3D, template instruksi, jenis fasilitas | Admin, Super Admin |
| Pengguna | Kelola pengguna dan role | Super Admin |
| Lisensi | Status, kuota, aktivasi, unggah lisensi | Super Admin |

Viewer dapat membuka semua menu kecuali Pengguna dan Lisensi dalam mode baca. Operator hanya melihat menu Penutupan dan peta dalam mode baca.

Pemilih venue selalu ada di bagian atas; semua menu bekerja pada venue yang sedang dipilih.

## UF-01 Login dan aktivasi pertama

**Layar awal:** URL Admin di instalasi baru · **Memenuhi:** FR-LIC-01, FR-LIC-02, FR-AUTH-01, FR-AUTH-03, FR-SYS-01

1. Sistem mendeteksi belum ada lisensi dan menampilkan halaman Aktivasi.
2. Super Admin memasukkan kunci lisensi, lalu klik **Aktivasi**.
3. Sistem menampilkan ringkasan lisensi (klien, paket, masa berlaku, kuota); Super Admin klik **Lanjut**.
4. Super Admin membuat akun pertamanya (nama, email, password).
5. Super Admin mengisi Pengaturan Sistem (URL publik Visitor, server email) dan menekan uji kirim email; setelah itu sistem masuk ke Dashboard kosong dengan ajakan **Buat venue pertama**.

**Alternatif:** aktivasi online gagal → tombol **Unggah file lisensi** dan tampilan `instance_id` untuk dikirim ke vendor.

## UF-02 Membuat venue dari template

**Layar awal:** Venue → **Tambah venue** · **Memenuhi:** FR-VEN-01, FR-VEN-02, FR-VEN-03

1. Langkah 1 – Data dasar: nama, alamat, zona waktu, logo; lokasi pusat dipilih di peta.
2. Langkah 2 – Tipe venue: pilih kartu rumah sakit, kampus, perkantoran, bandara/stasiun, pabrik/gudang, pusat perbelanjaan, atau kustom; tampil pratinjau isi template.
3. Langkah 3 – Konfirmasi, lalu **Buat venue**.
4. Sistem menyalin template dan membuka halaman venue di tab Gedung.

**Alternatif:** kuota venue penuh → tombol **Tambah venue** nonaktif dengan pesan kuota.

## UF-03 Menambah gedung dan lantai

**Layar awal:** Venue → tab Gedung · **Memenuhi:** FR-VEN-04, FR-VEN-05, FR-VEN-06

1. Klik **Tambah gedung**, isi nama dan kode, gambar footprint gedung di peta, lalu simpan.
2. Buka gedung, klik **Tambah lantai**, isi nama tampilan, nomor level, dan tinggi.
3. Ulangi untuk semua lantai; urutkan dengan drag.
4. Tandai gedung dan lantai default. Lapisan Area Luar sudah tersedia otomatis di setiap venue untuk menggambar area di antara gedung.

## UF-04 Mengunggah dan menempatkan denah

**Layar awal:** Venue → Gedung → Lantai → **Denah** · **Memenuhi:** FR-VEN-07 s.d. FR-VEN-10

1. Klik **Unggah denah** dan pilih file gambar, PDF, DWG, atau DXF.
2. Jika PDF: pilih halaman. Jika CAD: tunggu konversi, lalu pilih layer yang ditampilkan.
3. Denah muncul di atas peta dengan 4 pegangan sudut.
4. Tarik, putar, dan ubah skala sampai pas; gunakan **Ukur jarak** untuk mencocokkan ukuran nyata.
5. Atur opasitas; aktifkan **Tampilkan lantai lain** untuk menyelaraskan lift dan tangga.
6. Klik **Simpan penempatan**.

## UF-05 Menggambar unit dan fasilitas

**Layar awal:** Editor Peta → pilih gedung dan lantai · **Memenuhi:** FR-AUTH-05, FR-MAP-01 s.d. FR-MAP-10, FR-VIS-06

1. Sistem mengunci lantai untuk pengguna ini; pengguna lain melihat mode baca.
2. Pilih alat **Unit**, klik titik-titik sudut di atas denah (snapping aktif), klik titik awal untuk menutup.
3. Panel samping terbuka: isi kode unit dan status; luas terisi otomatis.
4. Gunakan alat **Dinding**, **Pintu**, **Koridor**, dan **Area non-akses** dengan cara yang sama.
5. Pilih alat **Fasilitas**, klik posisi, pilih jenis fasilitas, dan isi nama.
6. Validasi geometri berjalan langsung; fitur bermasalah diberi garis merah.
7. Klik **3D** di pojok untuk memeriksa hasil; klik **2D** untuk kembali menggambar.
8. Perubahan tersimpan otomatis ke draft; klik **Selesai** untuk melepas kunci lantai.

## UF-06 Membuat jalur navigasi

**Layar awal:** Editor Peta → mode **Jalur** · **Memenuhi:** FR-NAV-01 s.d. FR-NAV-03, FR-NAV-07, FR-NAV-11

1. Pilih alat **Jalur**, gambar garis di sepanjang koridor; node dibuat otomatis di ujung dan persimpangan.
2. Untuk jalur antar-gedung, pilih lapisan Area Luar lalu gambar jalurnya; hubungkan ke setiap gedung dengan konektor pintu gedung (UF-07).
3. Klik edge untuk mengatur aksesibel ya/tidak.
4. Klik **Hubungkan titik masuk**: sistem menyarankan titik masuk dari pintu setiap unit dan fasilitas; setujui atau geser manual.
5. Panel **Tidak terhubung** menampilkan unit dan fasilitas yang belum punya titik masuk; klik untuk menuju ke sana.

## UF-07 Menambah konektor antar-lantai dan menguji rute

**Layar awal:** Editor Peta → mode **Jalur** · **Memenuhi:** FR-NAV-04 s.d. FR-NAV-06, FR-NAV-09, FR-NAV-10

1. Pilih alat **Konektor**, pilih jenis: lift, eskalator, tangga, atau pintu gedung, lalu klik posisinya di lantai ini.
2. Isi nama dan lantai yang dilayani; untuk eskalator, pilih lantai tujuan dan arah (naik, turun, dua arah).
3. Sistem membuat node di setiap lantai terkait pada posisi yang sama; pengguna menyesuaikannya bila perlu dan menghubungkannya ke jalur.
4. Buka **Test route**: pilih asal dan tujuan (lokasi, fasilitas, QR titik asal, Info Point, atau klik di peta), centang **Mode kursi roda** bila perlu.
5. Sistem menggambar rute di peta (termasuk perpindahan lantai), menampilkan jarak dan daftar instruksi dalam ID atau EN.
6. Jika tidak ada rute, sistem menampilkan alasan, misalnya "lantai L3 tidak terhubung lift".

## UF-08 Mengatur tipe lokasi dan field kustom

**Layar awal:** Lokasi → **Tipe lokasi** · **Memenuhi:** FR-LOC-01, FR-LOC-02, FR-LOC-07

1. Daftar tipe bawaan dari template tampil; klik **Tambah tipe** atau pilih tipe yang ada.
2. Isi nama, ikon, dan warna.
3. Di bagian **Field**, klik **Tambah field**: isi label, pilih jenis, lalu atur wajib, tampil di Visitor, dan dapat dicari; untuk jenis pilihan, isi daftar opsinya.
4. Urutkan field dengan drag; urutan ini dipakai di form lokasi dan Visitor.
5. Di bagian **Kategori**, tambah kategori beserta ikon dan urutan.
6. Klik **Simpan**. Menghapus field yang sudah berisi data meminta konfirmasi.

## UF-09 Menambah dan mengubah lokasi

**Layar awal:** Lokasi → **Tambah lokasi** · **Memenuhi:** FR-LOC-03 s.d. FR-LOC-06, FR-LOC-09, FR-LOC-10

1. Pilih tipe lokasi; form menyesuaikan field tipe tersebut.
2. Isi kode lokasi (opsional), nama, kategori, deskripsi, logo/foto, dan field kustom.
3. Di bagian **Unit**, ketik kode unit atau klik **Pilih di peta**; hanya unit kosong yang dapat dipilih.
4. Atur status dan tanggal buka bila "segera buka"; isi jam operasional per hari dan tanggal khusus.
5. Tambah alias pencarian.
6. Klik **Simpan**; lokasi muncul di daftar dengan penanda bila ada field wajib yang kosong.

**Mengubah status:** buka lokasi → ubah **Status** → sistem menjelaskan dampaknya (misalnya "unit L1-023 akan menjadi kosong") → **Simpan**.

## UF-10 Import lokasi massal

**Layar awal:** Lokasi → **Import** · **Memenuhi:** FR-LOC-08

1. Pilih tipe lokasi, lalu klik **Unduh template**; file berisi kolom standar dan kolom field kustom.
2. Isi file, lalu unggah kembali.
3. Sistem menampilkan pratinjau: baris baru, baris yang akan memperbarui data yang ada (dicocokkan lewat kode lokasi, atau kode unit jika kode lokasi kosong), dan baris gagal beserta alasannya.
4. Perbaiki file dan unggah ulang, atau lanjutkan dengan hanya baris yang valid.
5. Klik **Import**; sistem menampilkan ringkasan jumlah data yang dibuat dan diperbarui.

## UF-11 Membuat penutupan sementara

**Layar awal:** Penutupan → **Tambah penutupan**, atau klik kanan elemen di Editor Peta · **Memenuhi:** FR-NAV-08

1. Pilih target di peta: area, jalur, lift, atau eskalator.
2. Isi alasan, waktu mulai (default sekarang), dan waktu selesai (opsional).
3. Sistem menampilkan dampak, misalnya "rute kursi roda ke L2 tidak tersedia selama penutupan".
4. Klik **Terapkan**; penutupan langsung berlaku tanpa publish.
5. Dari daftar Penutupan, admin dapat **Akhiri sekarang** atau **Ubah waktu selesai**.

## UF-12 Membuat titik asal (QR dan Info Point)

**Layar awal:** Titik Asal · **Memenuhi:** FR-DEV-01 s.d. FR-DEV-04

**QR titik asal:**

1. Klik **Tambah QR titik asal**, isi nama, pilih gedung dan lantai.
2. Klik posisi di peta, lalu putar panah arah hadap; sistem menghubungkannya ke jalur terdekat.
3. Klik **Simpan**, lalu **Unduh QR** (PNG atau PDF siap cetak, berisi nama titik dan petunjuk "Pindai untuk petunjuk arah").
4. Klik **Coba** untuk membuka Visitor dari titik tersebut dan memastikan posisi serta arahnya benar.

**Info Point:**

1. Klik **Tambah Info Point**, isi kode dan nama, pilih gedung dan lantai.
2. Klik posisi di peta dan putar panah arah hadap.
3. Atur mode 2D/3D, paksa 2D, bahasa default, dan durasi idle; klik **Simpan**.
4. Klik **Salin URL Info Point**; buka URL tersebut di perangkat layar sentuh dengan browser layar penuh.
5. Klik **Preview** untuk melihat tampilan persis seperti di perangkat.

## UF-13 Validasi dan publish

**Layar awal:** Publish · **Memenuhi:** FR-PUB-01 s.d. FR-PUB-06

1. Halaman menampilkan ringkasan perubahan sejak versi terakhir.
2. Klik **Jalankan validasi**; hasil dikelompokkan menjadi Error dan Peringatan.
3. Klik sebuah temuan untuk langsung menuju lantai dan fitur terkait; perbaiki, lalu jalankan validasi lagi.
4. Jika tidak ada Error, klik **Preview**: pilih tampilan HP atau Info Point tertentu, 2D atau 3D.
5. Klik **Publish**, isi catatan rilis, dan konfirmasi.
6. Sistem menampilkan nomor versi baru; Visitor memakainya pada pembukaan berikutnya dan Info Point pada pemeriksaan berkala berikutnya.

## UF-14 Rollback versi

**Layar awal:** Publish → **Riwayat versi** · **Memenuhi:** FR-PUB-07, FR-PUB-08

1. Daftar versi menampilkan nomor, waktu, penerbit, dan catatan rilis.
2. Pilih versi, klik **Preview** untuk memastikan.
3. Klik **Aktifkan versi ini** dan konfirmasi; sistem membuat versi baru hasil rollback.
4. Draft tetap berisi pekerjaan terakhir dan dapat diperbaiki untuk publish berikutnya.

## UF-15 Mengelola lisensi

**Layar awal:** Lisensi · **Memenuhi:** FR-LIC-04 s.d. FR-LIC-10

1. Halaman menampilkan klien, paket, masa berlaku, sisa hari, fitur aktif, check-in terakhir, dan pemakaian kuota per jenis.
2. Klik **Periksa sekarang** untuk check-in manual setelah perpanjangan dibayar.
3. Alternatif: klik **Unggah file lisensi** dan pilih file dari vendor.
4. Jika pemakaian melebihi kuota setelah downgrade, halaman menampilkan item yang harus dikurangi.

## UF-16 Mengatur tampilan dan instruksi

**Layar awal:** Pengaturan · **Memenuhi:** FR-VIS-01 s.d. FR-VIS-05, FR-VIS-07, FR-NAV-09

1. Tab **Tampilan**: atur tinggi dan warna per jenis fitur; pratinjau berubah langsung.
2. Pilih mode default 2D atau 3D; geser dan putar peta, lalu klik **Simpan sebagai tampilan awal**.
3. Tab **Branding**: unggah logo, pilih warna utama, dan isi nama tampilan untuk Visitor dan Info Point; pratinjau Visitor berubah langsung.

   Tab **Instruksi**: ubah teks instruksi per aksi dalam ID dan EN; pratinjau menampilkan contoh kalimat.
