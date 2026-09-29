# Kriteria Penerimaan MVP

Setiap kebutuhan MVP dianggap selesai hanya jika semua kriteria di bawahnya lolos saat diuji di lingkungan lokal. Centang kotak saat lolos; jika gagal, tambahkan komentar pada baris tersebut berisi langkah reproduksi dan hasil yang terlihat.

**Data uji yang disarankan:** satu venue dengan 2 gedung, 3 lantai di gedung utama, minimal 20 unit, 1 lift yang tidak melayani semua lantai, 1 eskalator naik dan 1 turun, 1 tangga, 3 QR titik asal, 1 Info Point, serta satu file denah untuk setiap format (PNG, PDF, DWG).

## FR-AUTH Akses admin

- [ ] **FR-AUTH-01** Login dengan kredensial benar berhasil; kredensial salah ditolak dengan pesan umum; sesi berakhir setelah batas waktu tidak aktif.
- [ ] **FR-AUTH-02** Tautan reset terkirim ke email terdaftar, hanya bisa dipakai sekali, dan kedaluwarsa.
- [ ] **FR-AUTH-03** Super Admin dapat menambah, menonaktifkan, dan mengubah role; pengguna nonaktif tidak bisa login.
- [ ] **FR-AUTH-04** Editor tidak melihat tombol Publish, Rollback, Pengguna, dan Lisensi; memanggil aksi tersebut langsung ke server juga ditolak. Operator hanya dapat membuat, memperpanjang, dan mengakhiri penutupan. Viewer dapat membuka semua menu kecuali Pengguna dan Lisensi, tetapi setiap aksi ubah ditolak.
- [ ] **FR-AUTH-05** Saat pengguna A mengedit lantai, pengguna B hanya bisa membaca dan melihat nama A; kunci lepas setelah A keluar atau 30 menit tidak aktif; Super Admin dapat membuka paksa.

* [ ] **FR-SYS-01** URL publik Visitor yang diubah langsung dipakai di QR dan tautan bagikan yang baru; uji kirim email berhasil dengan SMTP valid dan menampilkan pesan jelas jika gagal.

## FR-VEN Struktur venue & gedung

- [ ] **FR-VEN-01** Venue tersimpan dengan semua atribut; zona waktu dipakai untuk semua tampilan waktu venue.
- [ ] **FR-VEN-02** Membuat venue bertipe rumah sakit menghasilkan tipe lokasi, kategori, jenis fasilitas, dan field kustom rumah sakit; mengubahnya tidak memengaruhi template maupun venue lain.
- [ ] **FR-VEN-03** Dua venue dapat dikelola terpisah; data satu venue tidak tampil di venue lain; penambahan melebihi kuota ditolak.
- [ ] **FR-VEN-04** Gedung dapat ditambah, diubah, dan dihapus; venue dengan satu gedung berfungsi normal; setiap venue baru otomatis memiliki lapisan Area Luar.
- [ ] **FR-VEN-05** Lantai dengan level negatif tersimpan dan terurut benar; lantai berisi fitur tidak terhapus tanpa konfirmasi.
- [ ] **FR-VEN-06** Visitor membuka gedung dan lantai default yang diatur.
- [ ] **FR-VEN-07** File PNG, JPG, PDF (halaman terpilih), DWG, dan DXF berhasil diunggah dan tampil; layer CAD dapat dipilih; mengganti denah menyimpan versi lama.
- [ ] **FR-VEN-08** Setelah georeferensi, jarak dua titik yang diketahui di denah terukur dengan selisih maksimal 2% dari ukuran nyata.
- [ ] **FR-VEN-09** Opasitas denah dapat diatur 0–100% dan tersimpan.
- [ ] **FR-VEN-10** Denah lantai lain dapat ditampilkan sebagai acuan; posisi lift yang sama di dua lantai terlihat menumpuk.

## FR-MAP Kartografi

- [ ] **FR-MAP-01** Semua jenis fitur (unit, koridor, dinding, pintu, lift, eskalator, tangga, pintu keluar, area non-akses, area luar gedung) dapat dibuat dan tampil dengan gaya berbeda.
- [ ] **FR-MAP-02** Poligon, garis, dan titik dapat digambar dan tersimpan dengan koordinat yang benar.
- [ ] **FR-MAP-03** Fitur dapat dipindah, diputar, dihapus, dan diubah vertexnya; multi-select memindahkan beberapa fitur sekaligus.
- [ ] **FR-MAP-04** Titik baru menempel ke vertex atau tepi terdekat dan sudut 90°; snapping dapat dimatikan sementara.
- [ ] **FR-MAP-05** Minimal 50 langkah undo dan redo berfungsi dalam satu sesi edit.
- [ ] **FR-MAP-06** Kode unit ganda dalam satu venue ditolak; luas terhitung otomatis dengan selisih maksimal 2% dari hitungan manual.
- [ ] **FR-MAP-07** Admin dapat menambah jenis fasilitas baru dengan ikon unggahan; fasilitas tampil dengan ikon yang benar.
- [ ] **FR-MAP-08** Mencari fitur di panel daftar lalu mengkliknya menyorot fitur tersebut di peta.
- [ ] **FR-MAP-09** Poligon tidak tertutup, tumpang tindih, dan di luar batas lantai ditandai merah beserta alasannya.
- [ ] **FR-MAP-10** Perubahan tersimpan otomatis ke draft; Visitor tetap menampilkan versi published sampai publish.

## FR-VIS Tampilan 2D/3D

- [ ] **FR-VIS-01** Mengubah tinggi default satu jenis fitur mengubah semua fitur jenis itu yang belum di-override.
- [ ] **FR-VIS-02** Tinggi override per fitur tetap berlaku walau tinggi default diubah.
- [ ] **FR-VIS-03** Perubahan warna per jenis fitur tampil di preview dan di Visitor setelah publish.
- [ ] **FR-VIS-04** Visitor terbuka dalam mode default yang diatur.
- [ ] **FR-VIS-05** Kamera awal (pitch, zoom, rotasi) yang disimpan dipakai saat Visitor dibuka.
- [ ] **FR-VIS-06** Tombol 2D/3D di editor beralih tanpa memuat ulang halaman dan tanpa kehilangan perubahan.

* [ ] **FR-VIS-07** Logo, warna utama, dan nama tampilan yang diatur muncul di Visitor dan Info Point setelah publish.

## FR-NAV Jaringan navigasi

- [ ] **FR-NAV-01** Menggambar garis yang bersilangan membuat node di titik persimpangan; panjang edge sesuai ukuran nyata dengan selisih maksimal 2%; jalur di lapisan Area Luar terhubung ke dua gedung lewat konektor pintu gedung.
- [ ] **FR-NAV-02** Node dapat dipindah, dihapus, dan digabung; edge dapat dipisah; graf tetap terhubung setelah edit.
- [ ] **FR-NAV-03** Setiap unit dan fasilitas dapat diberi titik masuk; saran otomatis dari pintu unit muncul dan dapat disetujui.
- [ ] **FR-NAV-04** Lift yang tidak melayani L2 tidak pernah dipakai rute menuju atau dari L2.
- [ ] **FR-NAV-05** Rute dari lantai atas ke bawah tidak pernah memakai eskalator arah naik.
- [ ] **FR-NAV-06** Tangga dapat dilalui naik dan turun.
- [ ] **FR-NAV-07** Dengan mode kursi roda, rute tidak memakai eskalator, tangga, atau edge tidak aksesibel; jika tidak ada alternatif, muncul pesan rute aksesibel tidak tersedia.
- [ ] **FR-NAV-08** Penutupan langsung membuat rute memutar tanpa publish; setelah waktu selesai, rute kembali normal secara otomatis.
- [ ] **FR-NAV-09** Mengubah teks template instruksi ID atau EN langsung tampil di test route.
- [ ] **FR-NAV-10** Test route menampilkan garis rute, jarak total, dan instruksi berurutan, termasuk perpindahan lantai dan gedung; rute yang dihasilkan adalah rute terpendek yang valid.
- [ ] **FR-NAV-11** Node dan edge dapat disembunyikan; edge tertutup dan tidak aksesibel tampil dengan warna berbeda.

**Skenario uji rute wajib:**

- [ ] Rute satu lantai antar-dua unit.
- [ ] Rute antar-lantai via eskalator (naik) dan kembali via eskalator lain (turun).
- [ ] Rute antar-gedung melalui jalur di luar gedung.
- [ ] Rute kursi roda ke lantai yang hanya dilayani satu lift, lalu ulangi saat lift tersebut ditutup.
- [ ] Rute dari QR titik asal dan dari Info Point ke lokasi di gedung lain.

* [ ] Rute ke lokasi yang menempati dua unit (atau punya dua titik masuk) menuju titik masuk yang terdekat dari titik asal.
* [ ] Rute antar-gedung memakai instruksi "keluar gedung" dan "masuk gedung".

## FR-LOC Lokasi/POI

- [ ] **FR-LOC-01** Tipe lokasi dapat dibuat, diubah, dan dihapus; tipe bawaan dari template tersedia.
- [ ] **FR-LOC-02** Keenam jenis field (teks, angka, pilihan, jam operasional, gambar, tautan) dapat dibuat; pengaturan wajib, tampil di Visitor, dan dapat dicari berfungsi.
- [ ] **FR-LOC-03** Kode lokasi ganda dalam satu venue ditolak; form lokasi hanya menampilkan field milik tipe yang dipilih; nilai tersimpan dan tampil kembali dengan benar.
- [ ] **FR-LOC-04** Lokasi dapat ditautkan ke lebih dari satu unit; menautkan unit yang dimiliki lokasi aktif lain ditolak.
- [ ] **FR-LOC-05** Lokasi nonaktif permanen hilang dari pencarian Visitor dan unitnya otomatis berstatus kosong; nonaktif sementara tetap tampil dengan label.
- [ ] **FR-LOC-06** Jam per hari dan pengecualian tanggal tersimpan; Visitor menampilkan status buka/tutup yang benar menurut zona waktu venue.
- [ ] **FR-LOC-07** Kategori dengan ikon dan urutan tampil sesuai urutan di Visitor.
- [ ] **FR-LOC-08** Template CSV berisi kolom field kustom; baris dengan kode lokasi yang sudah ada memperbarui lokasi itu, bukan membuat lokasi baru; import 100 baris dengan 5 baris salah menampilkan 5 baris gagal beserta alasan, dan hanya baris valid yang tersimpan.
- [ ] **FR-LOC-09** Mencari alias (misalnya "kopi") di Visitor menampilkan lokasi atau kategori yang dituju.
- [ ] **FR-LOC-10** Filter tipe, kategori, status, gedung, dan lantai bekerja bersamaan; lokasi tanpa unit diberi penanda.

## FR-DEV Titik asal

- [ ] **FR-DEV-01** QR titik asal tersimpan dengan gedung, lantai, posisi, dan arah hadap; QR yang diunduh (PNG dan PDF) saat dipindai membuka Visitor dengan posisi dan arah tersebut.
- [ ] **FR-DEV-02** QR titik asal dan Info Point terhubung ke node terdekat; rute dari keduanya dimulai dari posisinya.
- [ ] **FR-DEV-03** URL Info Point membuka Visitor dalam layar penuh dengan titik asal tetap, peta diputar sesuai arah hadap, dan kembali ke tampilan awal setelah durasi idle.
- [ ] **FR-DEV-04** Perubahan konfigurasi (2D/3D, paksa 2D, bahasa, durasi idle) diterapkan di Info Point setelah dimuat ulang, tanpa perlu mengganti URL.

## FR-PUB Kontrol kualitas & publish

- [ ] **FR-PUB-01** Perubahan di draft tidak terlihat di Visitor dan Info Point sampai publish.
- [ ] **FR-PUB-02** Ringkasan perubahan mencantumkan fitur, rute, lokasi, dan titik asal yang ditambah, diubah, atau dihapus sejak versi terakhir.
- [ ] **FR-PUB-03** Setiap jenis Error dalam daftar validasi terdeteksi dan memblokir publish; setiap Peringatan terdeteksi tetapi tidak memblokir.
- [ ] **FR-PUB-04** Mengklik temuan membuka lantai dan menyorot fitur terkait.
- [ ] **FR-PUB-05** Preview menampilkan draft dari posisi Info Point yang dipilih dan tampilan HP, dalam 2D dan 3D.
- [ ] **FR-PUB-06** Editor tidak dapat publish; publish oleh Admin membuat nomor versi baru dan Info Point memuatnya pada pemeriksaan berkala berikutnya tanpa dimuat ulang manual.
- [ ] **FR-PUB-07** Riwayat versi menampilkan nomor, waktu, penerbit, dan catatan untuk setiap publish dan rollback.
- [ ] **FR-PUB-08** Rollback mengaktifkan isi versi lama sebagai versi baru; draft tidak berubah.

## FR-LIC Lisensi

- [ ] **FR-LIC-01** Instalasi baru tidak bisa mengakses menu apa pun sebelum aktivasi; aktivasi online dengan kunci valid berhasil; unggah file manual juga berhasil.
- [ ] **FR-LIC-02** File lisensi yang diubah satu karakter pun ditolak; lisensi untuk `instance_id` lain ditolak; internet diputus sementara tidak menghentikan sistem.
- [ ] **FR-LIC-03** Semua atribut lisensi terbaca dan tampil di halaman status.
- [ ] **FR-LIC-04** Check-in terjadi setiap 24 jam dan menerima perubahan dari vendor; setelah 7 hari gagal berturut-turut, peringatan tampil.
- [ ] **FR-LIC-05** Halaman status menampilkan paket, masa berlaku, sisa hari, fitur, dan check-in terakhir dengan benar.
- [ ] **FR-LIC-06** Menambah Info Point ke-11 pada kuota 10 ditolak di UI dan di server; pemakaian tampil sebagai 10/10.
- [ ] **FR-LIC-07** Fitur di luar paket (misalnya 3D) terkunci di Admin dan tidak muncul di Visitor.
- [ ] **FR-LIC-08** Banner muncul pada H-30, H-7, dan H-1 (diuji dengan lisensi uji bertanggal dekat).
- [ ] **FR-LIC-09** Setelah tanggal berakhir, Admin read-only selama 14 hari sementara Visitor tetap berjalan; setelah itu Admin hanya menampilkan Lisensi dan Visitor menampilkan pesan layanan tidak aktif.
- [ ] **FR-LIC-10** Lisensi baru memulihkan sistem tanpa kehilangan data; downgrade dengan pemakaian berlebih memblokir penambahan dan publish sampai pemakaian sesuai.
- [ ] **FR-LIC-11** Memundurkan jam server secara tidak wajar membuat lisensi tidak valid sampai jam diperbaiki.
- [ ] **FR-LIC-12** Lisensi yang dicabut vendor berstatus kedaluwarsa pada check-in berikutnya.
