# 16 · Katalog test case (QA)

Katalog ini adalah daftar test case yang wajib dijalankan **sebelum dan selama** verifikasi E2E bertahap (`15-verifikasi-e2e.md`, T-307a). Sumber: kriteria penerimaan (`spec/06-kriteria-penerimaan.md`), NFR (`spec/07-non-fungsional-rilis.md`), user flow (`spec/05-user-flow.md`), desain (`05-desain-ui.md`), dan daftar periksa keamanan repo (`.claude/skills/ecc-security-checklist`).

## 1. Cara memakai

- Setiap spec atau test menyebut ID test case yang dibuktikannya di nama test, misalnya `test('TC-VEN-03 hapus gedung …')`.
- Kolom **Level** menunjuk lapisan uji tempat test case itu paling murah dibuktikan:
  - **U**: unit Vitest (`packages/domain`, `packages/routing`, model formulir di app)
  - **D**: pgTAP (`supabase/tests`, `supabase test db`)
  - **I**: integrasi lewat repository (`pnpm test:integration`)
  - **E**: E2E Playwright (`pnpm test:e2e`), wajib dengan gambar di `e2e/evidence/T-xxx/`
  - **M**: manual/eksplorasi (dicatat di README bukti)
- **Prioritas**: **P1** blokir rilis (data hilang, keamanan, alur utama), **P2** fungsi penting, **P3** kosmetik/kenyamanan.
- Hasil dicatat di README bukti task: `Lulus`, `Gagal (langkah reproduksi)`, atau `Ditunda (alasan)`.
- **Satu task per putaran:** setiap selesai menguji satu task, laporkan hasilnya ke pemilik dan tunggu konfirmasi sebelum menguji task berikutnya (lihat `15-verifikasi-e2e.md` aturan 1).
- Urutan eksekusi: U → D → I → E → keamanan → NFR. Test E2E tidak dimulai sebelum U/D/I untuk task yang sama hijau.

## 2. Lingkungan dan data uji

- Supabase lokal (`supabase start`, `pnpm db:reset`), Admin :5173, Visitor :5174, `services/cad-converter` untuk DXF.
- Akun seed per role: `admin@local.test` (Super Admin), `pengelola@local.test` (Admin), `editor@local.test`, `operator@local.test`, `viewer@local.test`; password `SEED_ADMIN_PASSWORD`.
- Venue uji (dibuat fixture, bukan data dummy produksi): 2 gedung, 3 lantai di gedung utama (B1, GF, L1), ≥ 20 unit, 1 lift yang tidak melayani semua lantai, 1 eskalator naik dan 1 turun, 1 tangga, 3 QR titik asal, Area Luar dengan jalur antar-gedung, berkas denah PNG, JPG, PDF 2 halaman, DXF (`e2e/files/denah-contoh.dxf`), DWG palsu.
- Browser: Chromium (otomatis); Chrome, Edge, Firefox, Safari untuk NFR-COMP (manual).
- Layar: Admin 1440 × 900; Visitor HP 360 × 740 dan 390 × 844; Visitor desktop 1280 × 800.

## 3. Akses dan akun (FR-AUTH, FR-SYS) — T-007 s.d. T-012, T-301

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-AUTH-01 | Login dengan email dan password benar, tiap role | Masuk ke beranda role (Venue/Editor Peta/Penutupan) | E | P1 |
| TC-AUTH-02 | Login password salah, dan email tidak terdaftar | Pesan umum yang sama "Email atau password salah."; tidak membocorkan email terdaftar | E | P1 |
| TC-AUTH-03 | 5 kali gagal login berturut-turut | Akun terkunci sementara; login benar pun ditolak sampai waktu kunci lewat; tercatat di Catatan | D, E | P1 |
| TC-AUTH-04 | Idle 60 menit (jam palsu) | Sesi berakhir, diarahkan ke login, draft tidak hilang | E | P2 |
| TC-AUTH-05 | Logout lalu tombol Back browser | Halaman Admin meminta login lagi | E | P1 |
| TC-AUTH-06 | Lupa password → email (Mailpit) → buka tautan → password baru | Password berubah; tautan kedua kalinya ditolak; tautan kedaluwarsa ditolak | E | P1 |
| TC-AUTH-07 | Password baru < 8 karakter | Ditolak dengan pesan | U, E | P2 |
| TC-AUTH-08 | Super Admin mengundang pengguna, mengubah role, menonaktifkan | Perubahan tampil; pengguna nonaktif tidak bisa login; tercatat di Catatan | I, E | P1 |
| TC-AUTH-09 | Menonaktifkan/menurunkan Super Admin terakhir | Ditolak server dengan pesan | D, I | P1 |
| TC-AUTH-10 | Menu per role (5 role) | Editor: tanpa Publish, Pengguna, Lisensi; Operator: hanya Penutupan; Viewer: semua kecuali Pengguna/Lisensi, semua aksi ubah nonaktif | E | P1 |
| TC-AUTH-11 | Kunci edit: A membuka lantai, B membuka lantai sama | B mode baca dengan nama A dan waktunya; lantai lain bebas | I, E | P1 |
| TC-AUTH-12 | Kunci lepas saat A keluar / 30 menit tanpa aktivitas | B bisa mengedit tanpa muat ulang manual (≤ 1 menit) | D, E | P2 |
| TC-AUTH-13 | Super Admin "Ambil alih kunci" | Kunci pindah; A menjadi baca saja; tercatat di Catatan | D, E | P2 |
| TC-SYS-01 | Ubah URL publik Visitor | QR dan tautan bagikan yang baru memakai URL baru | I, E | P2 |
| TC-SYS-02 | Kirim email uji dengan SMTP valid / salah | Sukses masuk Mailpit / pesan gagal yang jelas | E | P2 |
| TC-SYS-03 | Tab Catatan: filter jenis peristiwa | 200 terakhir; filter bekerja; hanya Super Admin | E | P2 |

## 4. Venue, gedung, lantai, denah (FR-VEN) — T-101 s.d. T-107, T-302, T-313

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-VEN-01 | Buat venue lewat wizard (nama, alamat, pusat, zona waktu, logo, tipe) | Tersimpan; Area Luar terbuat otomatis; venue terpilih | I, E | P1 |
| TC-VEN-02 | Wizard: nama kosong, zona waktu tidak valid, logo bukan gambar / > 5 MB | Pesan per kolom; tidak ada venue setengah jadi | U, E | P1 |
| TC-VEN-03 | Template rumah sakit | Tipe lokasi, kategori, fasilitas (termasuk keselamatan), field kustom tersalin; venue lain tidak berubah | U, I, E | P1 |
| TC-VEN-04 | Ubah template di venue A | Venue B dan template tidak berubah | I | P1 |
| TC-VEN-05 | Ubah dan hapus venue | Data turunan ikut terhapus (lantai, fitur, lokasi, berkas) | I, E | P1 |
| TC-VEN-06 | Dua venue: pindah venue di pemilih | Data venue A tidak tampil di B (daftar, peta, lokasi) | I, E | P1 |
| TC-VEN-07 | CRUD gedung + footprint; venue satu gedung | Berfungsi; Area Luar tidak bisa dihapus | I, E | P1 |
| TC-VEN-08 | CRUD lantai dengan level negatif (B1) | Urut B1, GF, L1; lantai default bisa diatur | U, I, E | P1 |
| TC-VEN-09 | Hapus lantai yang berisi fitur | Konfirmasi menyebut jumlah fitur; batal tidak menghapus | E | P1 |
| TC-VEN-10 | Visitor membuka gedung/lantai default | Sesuai pengaturan | E | P2 |
| TC-VEN-11 | Unggah PNG, JPG, PDF (pilih halaman 2) | Pratinjau benar; denah aktif; versi lama ke riwayat | I, E | P1 |
| TC-VEN-12 | Unggah DXF → pilih layer → aktif | Layer bisa dipilih; pratinjau berubah; skala awal dari satuan | I, E | P1 |
| TC-VEN-13 | Unggah DWG, EXE, berkas 0 byte, > 50 MB | Ditolak dengan pesan; DWG diberi arahan DXF/PDF | U, I, E | P1 |
| TC-VEN-14 | Georeferensi: geser, ukur ulang, rotasi, kalibrasi jarak | Jarak dua titik diketahui selisih ≤ 2% | U, E | P1 |
| TC-VEN-15 | Opasitas 0–100% disimpan | Tersimpan dan dipakai lagi saat dibuka | E | P3 |
| TC-VEN-16 | Lapisan acuan lantai lain | Tampil samar, tidak bisa disunting, lift menumpuk | E | P2 |

## 5. Editor peta (FR-MAP) — T-104, T-108 s.d. T-115

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-MAP-01 | Gambar tiap jenis fitur (unit, koridor, dinding, pintu, lift, eskalator, tangga, pintu keluar, non-akses, area luar) | Tersimpan dengan gaya berbeda per jenis | E | P1 |
| TC-MAP-02 | Gambar poligon, garis, titik | Koordinat tersimpan benar (cek lewat repository) | I, E | P1 |
| TC-MAP-03 | Pindah, putar, hapus, ubah vertex; multi-select pindah | Semua tersimpan; tidak ada fitur lain berubah | E | P1 |
| TC-MAP-04 | Snapping vertex/tepi/90°, matikan sementara | Titik menempel / tidak menempel | U, E | P2 |
| TC-MAP-05 | 50 langkah undo lalu redo | Keadaan kembali persis | U, E | P2 |
| TC-MAP-06 | Kode unit ganda di venue (lantai sama dan beda) | Ditolak UI dan database | U, D, E | P1 |
| TC-MAP-07 | Luas unit otomatis | Selisih ≤ 2% dari hitungan manual | U | P2 |
| TC-MAP-08 | CRUD jenis fasilitas dengan ikon PNG/SVG | SVG dirasterisasi; ikon tampil di peta dan Visitor | I, E | P2 |
| TC-MAP-09 | Panel daftar fitur: cari lalu klik | Fitur tersorot dan peta fokus | E | P2 |
| TC-MAP-10 | Poligon tumpang tindih, di luar lantai, tidak tertutup (impor) | Ditandai merah dengan alasan | U, E | P1 |
| TC-MAP-11 | Draft tersimpan otomatis; Visitor sebelum publish | Visitor tetap versi published | I, E | P1 |
| TC-MAP-12 | Tinggi default per jenis vs override per fitur | Override tetap berlaku | U, E | P2 |
| TC-MAP-13 | Warna per jenis | Pratinjau dan Visitor (setelah publish) berubah | E | P2 |
| TC-MAP-14 | 2D/3D di editor | Beralih tanpa muat ulang dan tanpa kehilangan perubahan | E | P2 |
| TC-MAP-15 | Kamera awal disimpan | Visitor terbuka dengan zoom/pitch/rotasi itu | E | P2 |

## 6. Navigasi dan rute (FR-NAV) — T-201 s.d. T-217

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-NAV-01 | Garis bersilangan membuat node persimpangan; panjang edge | Node terbentuk; selisih ≤ 2% | U, E | P1 |
| TC-NAV-02 | Pindah, hapus, gabung node; pisah edge | Graf tetap terhubung | U, E | P1 |
| TC-NAV-03 | Titik masuk unit/fasilitas + saran otomatis dari pintu | Saran muncul dan bisa disetujui | U, E | P2 |
| TC-NAV-04 | Lift tidak melayani L2 | Rute ke/dari L2 tidak memakai lift itu | U | P1 |
| TC-NAV-05 | Rute turun tidak memakai eskalator naik | Benar | U | P1 |
| TC-NAV-06 | Tangga dua arah | Bisa naik dan turun | U | P2 |
| TC-NAV-07 | Mode kursi roda | Tanpa eskalator/tangga/edge tak aksesibel; tanpa alternatif → pesan | U, E | P1 |
| TC-NAV-08 | Penutupan aktif lalu berakhir | Rute memutar tanpa publish; normal lagi otomatis | U, I, E | P1 |
| TC-NAV-09 | Template instruksi ID/EN diubah | Langsung di test route; kosong → bawaan | E | P2 |
| TC-NAV-10 | Test route: garis, jarak, langkah lintas lantai/gedung | Rute terpendek yang valid | U, E | P1 |
| TC-NAV-11 | Sembunyikan graf; edge tertutup/tak aksesibel | Warna berbeda | E | P3 |
| TC-NAV-12 | Skenario wajib: 1 lantai; eskalator naik lalu turun; antar-gedung lewat luar; kursi roda ke lantai satu-lift lalu lift ditutup; dari QR dan Info Point ke gedung lain; lokasi dua unit → titik masuk terdekat; instruksi keluar/masuk gedung | Semua sesuai `spec/06` | U, E | P1 |
| TC-NAV-13 | CRUD penutupan oleh Operator dari HP (360 px) | Buat, perpanjang, akhiri; Operator tidak bisa ubah peta | D, E | P1 |
| TC-NAV-14 | CRUD titik asal + unduh QR PNG/PDF | QR membuka Visitor di posisi dan arah itu | I, E | P1 |
| TC-NAV-15 | Deep link lokasi, rute, bahasa | Keadaan sama setelah dibuka; tautan rusak → pesan | U, E | P2 |
| TC-NAV-16 | Visitor: pilih "Anda di sini" (QR, ketuk peta, daftar) | Asal terpasang; rute dari sana | E | P1 |
| TC-NAV-17 | Penutupan baru muncul di Visitor tanpa muat ulang (≤ 60 s) | Rute dihitung ulang dengan pemberitahuan | E | P1 |
| TC-NAV-18 | Bagikan lokasi/rute | Tautan dibuka di perangkat lain sama | E | P2 |

## 7. Lokasi (FR-LOC) — T-116, T-303 s.d. T-306

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-LOC-01 | CRUD tipe lokasi (nama, ikon, warna) | Tipe bawaan template tersedia; hapus tipe terpakai ditolak/terkonfirmasi | I, E | P1 |
| TC-LOC-02 | Enam jenis field kustom: wajib, tampil, dapat dicari, urutan | Berfungsi; field tersembunyi tidak bisa dapat dicari | U, E | P1 |
| TC-LOC-03 | CRUD lokasi; kode lokasi ganda | Ditolak; form hanya field tipe terpilih; ganti tipe meminta konfirmasi | U, D, E | P1 |
| TC-LOC-04 | Tautkan lokasi ke dua unit; unit milik lokasi aktif lain | Dua unit OK; unit lain ditolak | D, E | P1 |
| TC-LOC-05 | Nonaktif permanen / sementara | Permanen hilang dari Visitor dan unit kosong; sementara tampil berlabel | I, E | P1 |
| TC-LOC-06 | Jam per hari, lewat tengah malam, tanggal khusus, 24 jam | Status buka/tutup benar menurut zona venue (jam palsu) | U, E | P1 |
| TC-LOC-07 | Kategori: ikon dan urutan | Urutan sama di Visitor | E | P3 |
| TC-LOC-08 | Import CSV/XLSX 100 baris, 5 salah | 5 gagal dengan alasan; hanya valid tersimpan; kode lama memperbarui | U, I, E | P1 |
| TC-LOC-09 | Alias ("rontgen") | Ditemukan di Visitor setelah publish | U, E | P2 |
| TC-LOC-10 | Filter tipe+kategori+status+gedung+lantai; lokasi tanpa unit | Bekerja bersamaan; penanda tampil | E | P2 |

## 8. Visitor, branding, publish (FR-VIS, FR-PUB) — T-115, T-117 s.d. T-120, T-410

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-VIS-01 | Visitor HP: peta, cari, chip, A–Z, detail, bottom sheet 3 tinggi | Semua bisa dicapai jari dan keyboard | E | P1 |
| TC-VIS-02 | Salah ketik / kode unit / field dapat dicari | Hasil benar | U, E | P1 |
| TC-VIS-03 | Ganti bahasa ID/EN; tautan berbahasa | Semua teks berganti; pilihan diingat | E | P1 |
| TC-VIS-04 | Venue belum publish / snapshot gagal dimuat | Pesan "Peta belum tersedia" / tombol coba lagi | E | P1 |
| TC-VIS-05 | Branding: logo, nama, warna utama, warna rute | Tampil di Visitor setelah publish; kuning muda tetap terbaca | U, I, E | P1 |
| TC-VIS-06 | Hapus logo / kembali ke bawaan | Tanda bawaan; warna bawaan | E | P2 |
| TC-PUB-01 | Publish oleh Admin; Editor mencoba publish | Admin: versi baru; Editor ditolak server | I, E | P1 |
| TC-PUB-02 | Draft berubah setelah publish | Visitor tetap versi lama sampai publish berikut | I, E | P1 |
| TC-PUB-03 | Snapshot lama tanpa field baru (branding, jam) | Tetap terbaca Visitor | U | P1 |

## 9. Keamanan (NFR-SEC)

### 9.1 Otorisasi server per role (matriks)

Untuk setiap baris, uji **langsung ke server** (repository/REST dengan token role itu), bukan lewat UI. Harapan: ✓ diizinkan, ✗ ditolak (`forbidden` atau 0 baris). `anon` = pengunjung tanpa login.

| ID | Aksi | Super Admin | Admin | Editor | Operator | Viewer | anon | Level |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC-SEC-01 | Baca data draft (venue, lantai, fitur, lokasi) | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | D |
| TC-SEC-02 | Buat/ubah/hapus venue, gedung, lantai, logo | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | D, I |
| TC-SEC-03 | Ubah fitur, graf, konektor, titik masuk | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | D |
| TC-SEC-04 | Ubah fitur di lantai yang dikunci pengguna lain | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | D |
| TC-SEC-05 | CRUD lokasi, tipe, field, import, alias | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | D, I |
| TC-SEC-06 | Buat/perpanjang/akhiri penutupan | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | D |
| TC-SEC-07 | Pengaturan tampilan, branding, instruksi, jenis fasilitas | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | D, I |
| TC-SEC-08 | Publish (Edge Function `publish`) | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | I |
| TC-SEC-09 | Kelola pengguna (`admin-users`), pengaturan sistem, Catatan | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | D, I |
| TC-SEC-10 | Baca snapshot terbit dan aset publik | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | I |
| TC-SEC-11 | Baca/unggah bucket `floor-plans` (privat) | baca+tulis | baca+tulis | baca | baca | baca | ✗ | D, I |
| TC-SEC-12 | Pengguna nonaktif dengan token lama | ✗ semua aksi | | | | | | I |
| TC-SEC-13 | Data venue lain (lintas venue) lewat id langsung | sesuai role, tidak bocor ke anon | | | | | | D |

### 9.2 Autentikasi dan sesi

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-SEC-20 | Brute force login (≥ 5 gagal) | Terkunci sementara; pesan tidak membedakan email ada/tidak | D, E | P1 |
| TC-SEC-21 | Token JWT dipalsukan / kedaluwarsa / role diubah di klaim | Ditolak REST, Storage, dan Edge Function | I | P1 |
| TC-SEC-22 | Tautan reset dipakai ulang / milik orang lain | Ditolak | E | P1 |
| TC-SEC-23 | Password tidak pernah tampil di log, respons, atau Catatan | Tidak ada | M | P1 |
| TC-SEC-24 | Password SMTP | Hanya di Vault; respons pengaturan tidak mengembalikannya | D, I | P1 |

### 9.3 Unggahan berkas

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-SEC-30 | Ekstensi dipalsukan (EXE dinamai `.png`, MIME tidak cocok) | Ditolak klien dan bucket | U, I | P1 |
| TC-SEC-31 | SVG berisi `<script>` sebagai ikon/logo | Ditolak atau dirasterisasi; tidak pernah disajikan sebagai SVG publik | U, I | P1 |
| TC-SEC-32 | Denah > 50 MB, gambar > 5 MB, berkas 0 byte | Ditolak klien, bucket, dan cad-converter (413) | U, I | P1 |
| TC-SEC-33 | Unggah langsung ke Storage ke folder venue lain | Ditolak policy | D | P1 |
| TC-SEC-34 | cad-converter: tanpa token / token palsu / origin asing / DXF rusak / DWG | 401 / tanpa header CORS / 415 dengan pesan; layanan tetap hidup | U (Python) | P1 |
| TC-SEC-35 | DXF sangat besar/dalam (bom entitas) | Ditolak atau selesai dalam batas waktu tanpa menjatuhkan layanan | M | P2 |

### 9.4 Data publik, privasi, injeksi

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-SEC-40 | Isi snapshot | Tanpa email, alamat venue, pembuat/pengubah, pengaturan server, field tersembunyi | U | P1 |
| TC-SEC-41 | Visitor dan Info Point | Tanpa cookie, tanpa request pihak ketiga, tanpa data pribadi di localStorage | E | P1 |
| TC-SEC-42 | Teks berisi `<script>`, `"><img onerror>` di nama lokasi, field kustom, branding, alias | Tampil sebagai teks di Admin dan Visitor (tanpa eksekusi) | E | P1 |
| TC-SEC-43 | SQL injection di pencarian, filter, import CSV (`'; drop table`) | Diperlakukan sebagai teks; tidak ada galat database | I | P1 |
| TC-SEC-44 | Formula CSV (`=HYPERLINK(...)`) di template/ekspor | Tidak dieksekusi saat dibuka di spreadsheet | U | P2 |
| TC-SEC-45 | Fungsi SQL `security definer` | `search_path` kosong, nama berskema, `execute` dicabut dari `anon` bila bukan publik | D | P1 |
| TC-SEC-46 | Rahasia di repo | Tidak ada `.env.local`, kunci service role, atau kunci privat lisensi di git | M | P1 |
| TC-SEC-47 | Catatan peristiwa | Login, gagal login, role, nonaktif, pengaturan, ambil alih kunci, publish tercatat | D, I | P1 |

## 10. Non-fungsional

| ID | Skenario | Target | Level | P |
| --- | --- | --- | --- | --- |
| TC-NFR-01 | Muat awal Visitor (venue 10 lantai, 2.000 fitur), 4G terbatas | ≤ 3 s; kunjungan ulang ≤ 1,5 s | E, M | P1 |
| TC-NFR-02 | Hitung rute antar-gedung/lantai | ≤ 500 ms (benchmark routing) | U | P1 |
| TC-NFR-03 | Editor dengan 1.000 fitur di satu lantai | Gambar dan geser tetap lancar | M | P2 |
| TC-NFR-04 | Ukuran snapshot venue besar | Di bawah batas test `snapshot-size` | U | P2 |
| TC-NFR-05 | Browser Chrome, Edge, Firefox, Safari (dua versi terbaru) | Alur utama berjalan | M | P2 |
| TC-NFR-06 | HP 360 px, Android 10 / iOS 15 | Tidak ada teks terpotong; target sentuh ≥ 44 px | E, M | P1 |
| TC-NFR-07 | Kontras WCAG AA semua token dan warna branding | Lolos | U | P1 |
| TC-NFR-08 | Keyboard: Tab, Enter, Esc di Admin dan Visitor desktop | Semua aksi tercapai; fokus terlihat | E | P2 |
| TC-NFR-09 | Server tidak terjangkau sementara | Visitor tetap memakai versi tersimpan (PWA) | E, M | P2 |
| TC-NFR-10 | Geometri tersimpan WGS84 GeoJSON | Benar di database dan snapshot | U, I | P2 |

## 11. Ditunda (fitur belum dibuat)

Ditulis saat task terkait dikerjakan: FR-PUB-02 s.d. 08 (T-307 s.d. T-312: validasi publish lengkap, ringkasan perubahan, preview, riwayat dan rollback, role Viewer), FR-LIC (T-401 s.d. T-406), Info Point FR-DEV-03/04 dan branding di Info Point (T-407 s.d. T-409), backup dan pembaruan (T-411), kuota venue/Info Point.

## 12. Pemetaan ke verifikasi E2E (T-307a)

Saat memverifikasi task di `15-verifikasi-e2e.md`, jalankan test case yang kolom **Task**-nya (judul bagian) memuat task itu, dan sebutkan ID-nya di README bukti. Test case keamanan 9.1 dijalankan sekali per tabel/aksi di task yang membuatnya; sisanya (9.2–9.4) dan NFR dijalankan setelah seluruh daftar R0–R3 terverifikasi, sebagai langkah terakhir T-307a.
