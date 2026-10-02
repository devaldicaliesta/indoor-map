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
- Cara menulis dan menjalankan E2E mengikuti referensi e2e-runner di `15-verifikasi-e2e.md` (bagian "Referensi: e2e-runner").
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

Pemetaan ke OWASP Top 10 (dipakai `security-reviewer`): A01 kontrol akses → 9.1, TC-SEC-50/52/54; A02 kriptografi/rahasia → TC-SEC-24/46; A03 injeksi/XSS → TC-SEC-42/43/44, TC-LOC-34; A04 desain tidak aman → TC-SEC-35/60; A05 salah konfigurasi → TC-SEC-11/54/56/57, TC-SEC-34 (CORS); A06 komponen rentan → TC-SEC-63; A07 autentikasi → 9.2; A08 integritas data → TC-SEC-51/61, TC-VIS-36; A09 log → TC-SEC-47/64; A10 SSRF → layanan pendamping tidak mengambil URL dari pengguna (cek di TC-SEC-34).

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

## 13. Kasus tepi, negatif, batas, dan konkurensi

Bagian ini melengkapi bagian 3–10 dengan semua kemungkinan yang bisa terjadi di lapangan. Tiap bagian 13.x dijalankan bersama bagian utama area yang sama saat task terkait diverifikasi. Kolom sama: skenario, hasil diharapkan, level, prioritas.

### 13.1 Akun dan sesi (lanjutan TC-AUTH)

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-AUTH-30 | Email dengan huruf besar/spasi di depan-belakang | Tetap bisa login (dinormalisasi) | E | P2 |
| TC-AUTH-31 | Email/password kosong, format email salah | Tombol/validasi mencegah kirim; pesan per kolom | E | P2 |
| TC-AUTH-32 | Password 7, 8, dan 72+ karakter; berisi emoji/spasi | 7 ditolak; 8 diterima; panjang ekstrem ditangani tanpa galat | U, E | P2 |
| TC-AUTH-33 | Login di dua tab, logout di satu tab | Tab lain ikut keluar saat aksi berikutnya | E | P2 |
| TC-AUTH-34 | Login di dua perangkat bersamaan | Keduanya berfungsi; kunci edit tetap per lantai | M | P3 |
| TC-AUTH-35 | Role diubah saat pengguna sedang login | Aksi berikutnya mengikuti role baru (server menolak aksi lama) | I, E | P1 |
| TC-AUTH-36 | Pengguna dinonaktifkan saat sedang login | Aksi berikutnya ditolak; diarahkan ke login | I, E | P1 |
| TC-AUTH-37 | Mengakses URL Admin langsung tanpa login (deep URL) | Ke login, lalu kembali ke URL semula setelah masuk | E | P2 |
| TC-AUTH-38 | Role mengakses URL menu terlarang langsung (`/users` sebagai Editor) | Halaman "tidak berizin", bukan halaman kosong/galat | E | P1 |
| TC-AUTH-39 | Kunci akun habis waktunya | Login benar berhasil lagi; hitungan gagal direset | D | P2 |
| TC-AUTH-40 | Reset password untuk email tidak terdaftar | Pesan sama dengan email terdaftar (tanpa kebocoran) | E | P1 |
| TC-AUTH-41 | Minta reset berkali-kali | Hanya tautan terakhir berlaku / dibatasi | E | P2 |
| TC-AUTH-42 | Undang email yang sudah terdaftar / format salah | Ditolak dengan pesan | I | P2 |
| TC-AUTH-43 | Admin (bukan Super Admin) mencoba mengubah role dirinya | Ditolak server | D | P1 |
| TC-AUTH-44 | Kunci edit: A menutup tab tiba-tiba | Kunci dilepas (keepalive) atau habis 30 menit | E | P2 |
| TC-AUTH-45 | Kunci edit: jaringan A putus lalu kembali | A tidak menimpa perubahan B; mode baca bila kunci sudah diambil | M | P1 |
| TC-AUTH-46 | Dua pengguna mengambil kunci di detik yang sama | Hanya satu yang mendapat kunci (atomik) | D | P1 |

### 13.2 Venue, gedung, lantai, denah (lanjutan TC-VEN)

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-VEN-30 | Nama venue 1 karakter, 200 karakter, hanya spasi, karakter khusus/emoji | Batas dipatuhi; spasi saja ditolak; emoji tersimpan utuh | U, E | P2 |
| TC-VEN-31 | Nama venue sama dengan venue lain | Sesuai aturan (boleh/ditolak) dan konsisten di server | D | P2 |
| TC-VEN-32 | Koordinat pusat di luar rentang (lat 91, lng 181), format salah | Ditolak dengan contoh format | U, E | P2 |
| TC-VEN-33 | Zona waktu lain (Asia/Makassar, Asia/Jayapura) | Jam operasional dan waktu terbit mengikuti zona venue | U, E | P1 |
| TC-VEN-34 | Wizard: gagal di tengah (template gagal) lalu "Coba lagi" | Venue tidak terduplikasi; template diterapkan sekali | I, E | P1 |
| TC-VEN-35 | Template diterapkan ke venue yang sudah punya lokasi | Ditolak server | D | P1 |
| TC-VEN-36 | Hapus venue yang sedang dipilih pengguna lain | Pengguna lain jatuh ke venue berikutnya tanpa galat | E | P2 |
| TC-VEN-37 | Hapus venue terakhir | Keadaan kosong "Belum ada venue" di semua menu | E | P2 |
| TC-VEN-38 | Footprint gedung tidak tertutup / berpotongan sendiri | Ditolak dengan alasan | U, E | P2 |
| TC-VEN-39 | Kode gedung ganda dalam venue | Ditolak | D | P2 |
| TC-VEN-40 | Lantai dengan level sama di gedung sama | Ditolak | D | P1 |
| TC-VEN-41 | Tinggi lantai 0, negatif, sangat besar, koma desimal | 0/negatif ditolak; koma diterima | U, E | P2 |
| TC-VEN-42 | Hapus lantai default gedung | Default pindah/kosong tanpa merusak Visitor | I, E | P1 |
| TC-VEN-43 | Hapus gedung yang dipakai konektor/rute | Konfirmasi; data turunan dibersihkan; graf tetap valid | I, E | P1 |
| TC-VEN-44 | PDF terkunci kata sandi / rusak / 0 halaman / 300 halaman | Pesan jelas; pemilih halaman tetap cepat | E | P2 |
| TC-VEN-45 | PDF/gambar sangat besar (A0, 10.000 px) | Raster dibatasi ≤ 8.000 px tanpa browser macet | U, E | P2 |
| TC-VEN-46 | JPG dengan orientasi EXIF diputar | Tampil sesuai orientasi | M | P3 |
| TC-VEN-47 | DXF tanpa satuan / satuan inci / kosong / semua layer kosong / layer bernama Unicode | Pesan atau skala footprint; nama layer tampil benar | U, E | P2 |
| TC-VEN-48 | Layanan cad-converter mati / lambat | Pesan "tidak bisa dihubungi"; PNG/PDF tetap bisa | U, E | P1 |
| TC-VEN-49 | Ganti denah saat georeferensi lama belum disimpan | Peringatan perubahan belum disimpan | E | P2 |
| TC-VEN-50 | Georeferensi: kalibrasi dengan jarak 0 / negatif / dua titik sama | Ditolak | U, E | P2 |
| TC-VEN-51 | Riwayat denah: aktifkan versi lama, unduh berkas asli | Berhasil; URL bertanda kedaluwarsa diperbarui | E | P3 |

### 13.3 Editor peta (lanjutan TC-MAP)

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-MAP-30 | Poligon dengan 2 titik, titik ganda berurutan, luas nol | Ditolak/diperbaiki sebelum disimpan | U, E | P1 |
| TC-MAP-31 | Poligon berpotongan sendiri (bentuk 8) | Ditandai tidak valid | U | P1 |
| TC-MAP-32 | Fitur sangat kecil (< 0,5 m²) dan sangat besar (> footprint) | Peringatan/galat sesuai aturan validasi | U | P2 |
| TC-MAP-33 | Kode unit beda huruf besar/kecil (`a-01` vs `A-01`) | Dianggap ganda | U, D | P1 |
| TC-MAP-34 | Kode unit berisi spasi/simbol/80 karakter | Sesuai aturan format, pesan jelas | U, E | P2 |
| TC-MAP-35 | Ganti jenis fitur unit → koridor saat unit tertaut lokasi | Konfirmasi; tautan lokasi ditangani | E | P1 |
| TC-MAP-36 | Hapus fitur yang dipakai titik masuk/konektor/penutupan | Konfirmasi; data turunan ikut bersih | I, E | P1 |
| TC-MAP-37 | Undo setelah simpan, setelah ganti lantai, setelah muat ulang | Perilaku konsisten (riwayat per sesi lantai) | E | P2 |
| TC-MAP-38 | Ctrl+Z di dalam kolom teks | Membatalkan teks, bukan perubahan peta | E | P2 |
| TC-MAP-39 | Jaringan putus saat menyimpan draft | Pesan gagal; perubahan tidak hilang; simpan ulang berhasil | E | P1 |
| TC-MAP-40 | Dua tab yang sama membuka lantai sama | Satu mendapat kunci; tidak ada penimpaan diam-diam | E | P1 |
| TC-MAP-41 | Fitur di Area Luar (tanpa batas lantai) | Pemeriksaan batas dilewati | U | P2 |
| TC-MAP-42 | Lantai dengan 1.000 fitur: pilih semua dan geser | Lancar; tersimpan | M | P2 |
| TC-MAP-43 | Warna per jenis format salah (`merah`, `#12`) | Ditolak dengan contoh | U, E | P2 |
| TC-MAP-44 | Tinggi override 0 dan 100 (batas), 100,01 | 0/100 diterima; 100,01 ditolak | U | P2 |
| TC-MAP-45 | Ikon fasilitas > 200 kB / SVG / transparan | Sesuai batas; SVG dirasterisasi | U, E | P2 |
| TC-MAP-46 | Hapus jenis fasilitas yang masih dipakai | Ditolak atau konfirmasi dengan jumlah pemakaian | D, E | P2 |

### 13.4 Navigasi dan rute (lanjutan TC-NAV)

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-NAV-30 | Asal sama dengan tujuan | Pesan "sudah di tujuan", bukan rute nol | U, E | P2 |
| TC-NAV-31 | Tujuan tidak terhubung graf | Pesan rute tidak ditemukan | U, E | P1 |
| TC-NAV-32 | Semua jalur ke tujuan ditutup | Pesan dengan alasan penutupan | U, E | P1 |
| TC-NAV-33 | Lokasi tanpa unit / tanpa titik masuk | Tombol rute nonaktif dengan keterangan | E | P1 |
| TC-NAV-34 | Graf dengan siklus, edge ganda, node terisolasi | Rute tetap benar; node terisolasi dilaporkan validasi | U | P1 |
| TC-NAV-35 | Lift dengan satu pemberhentian; eskalator tanpa dua pemberhentian | Ditolak saat disimpan / dilaporkan | U, D | P1 |
| TC-NAV-36 | Konektor dihapus saat rute sedang tampil di Visitor | Rute dihitung ulang setelah snapshot baru | E | P2 |
| TC-NAV-37 | Penutupan dengan waktu mulai di masa depan / selesai di masa lalu / selesai < mulai | Belum/tidak berlaku / ditolak | U, D | P1 |
| TC-NAV-38 | Penutupan berakhir saat rute tampil | Rute kembali normal tanpa muat ulang | E | P2 |
| TC-NAV-39 | Instruksi template berisi placeholder salah (`{tujuan}`) atau kosong | Ditolak atau bawaan dipakai | U, E | P2 |
| TC-NAV-40 | Rute sangat panjang (antar-gedung, 3 lantai) | ≤ 500 ms; langkah ringkas | U | P1 |
| TC-NAV-41 | QR titik asal yang sudah dihapus dipindai | Visitor terbuka tanpa asal + pesan | E | P1 |
| TC-NAV-42 | QR dari venue lain / kode acak | Pesan tidak dikenal, tanpa galat | E | P2 |
| TC-NAV-43 | Deep link dengan id lokasi tidak ada / parameter rusak / bahasa `fr` | Dibuka di keadaan aman + pesan; bahasa jatuh ke bawaan | U, E | P2 |
| TC-NAV-44 | Arah hadap QR 0°, 359°, 360°, negatif | Dinormalisasi; peta berputar benar | U | P3 |
| TC-NAV-45 | Operator membuat penutupan saat offline | Pesan gagal; tidak tersimpan setengah | E | P2 |

### 13.5 Lokasi (lanjutan TC-LOC)

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-LOC-30 | Nama lokasi kosong / 120 karakter / emoji / HTML | Batas dan escaping dipatuhi | U, E | P1 |
| TC-LOC-31 | Field wajib kosong saat simpan | Ditolak dengan pesan per field | U, E | P1 |
| TC-LOC-32 | Field angka berisi teks / koma desimal / negatif | Sesuai aturan field | U | P2 |
| TC-LOC-33 | Field pilihan: opsi dihapus setelah dipakai lokasi | Nilai lama ditangani (kosong/ditandai) | U, I | P2 |
| TC-LOC-34 | Field tautan: `javascript:alert(1)`, tanpa skema, URL sangat panjang | `javascript:` ditolak; tautan aman di Visitor | U, E | P1 |
| TC-LOC-35 | Field gambar: > 5 MB, SVG, 0 byte | Ditolak | U | P1 |
| TC-LOC-36 | Kunci field ganda / label hanya simbol | Kunci unik otomatis; tidak bentrok | U | P2 |
| TC-LOC-37 | Hapus field yang dipakai 100 lokasi | Konfirmasi menyebut jumlah; nilai ikut terhapus | D, E | P2 |
| TC-LOC-38 | Ganti tipe lokasi yang punya isian | Konfirmasi daftar isian yang hilang | E | P2 |
| TC-LOC-39 | Jam: buka = tutup (24 jam), lewat tengah malam, hari kosong, 3 rentang sehari, rentang tumpang tindih | Benar / tumpang tindih ditolak | U | P1 |
| TC-LOC-40 | Tanggal khusus di masa lalu, 29 Februari, pergantian tahun | Benar | U | P2 |
| TC-LOC-41 | Segera buka tanpa tanggal / tanggal lewat | Ditolak / peringatan | U, E | P2 |
| TC-LOC-42 | Nonaktif permanen lalu diaktifkan lagi saat unitnya sudah dipakai lokasi lain | Ditolak dengan pesan | D | P1 |
| TC-LOC-43 | Import: berkas kosong, hanya header, kolom diacak, kolom hilang, kolom tak dikenal | Pesan jelas; tidak menyimpan apa pun bila fatal | U, E | P1 |
| TC-LOC-44 | Import: CSV `;`, BOM, CRLF, kutip ganda, baris kosong, UTF-8 dengan aksen | Terbaca benar | U | P1 |
| TC-LOC-45 | Import: 5.000 baris (lebih dari satu batch) | Semua batch tersimpan; kemajuan tampil; gagal di batch tengah dilaporkan | I, E | P1 |
| TC-LOC-46 | Import: kode ganda di berkas, unit tak dikenal, kategori tak dikenal, tanggal 31-02 | Baris gagal dengan alasan per kolom | U | P1 |
| TC-LOC-47 | Import XLSX dengan sel tanggal/angka Excel, beberapa sheet | Sheet pertama; nilai dikonversi benar | U | P2 |
| TC-LOC-48 | Alias: lebih dari 20, sama dengan nama sendiri, duplikat beda huruf | Dibatasi / dibuang / digabung | U, D | P2 |
| TC-LOC-49 | Pencarian daftar Admin dengan aksen ("kafé" vs "kafe") | Ditemukan | U | P3 |

### 13.6 Visitor, branding, publish (lanjutan)

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-VIS-30 | Pencarian kosong, 1 huruf, 100 karakter, simbol saja | Tanpa galat; hasil wajar | U, E | P2 |
| TC-VIS-31 | Tidak ada hasil | Pesan kosong dengan saran A–Z | E | P2 |
| TC-VIS-32 | Rotasi layar HP saat sheet terbuka | Tata letak tetap benar | M | P2 |
| TC-VIS-33 | Zoom browser 200%, teks diperbesar sistem | Tidak ada teks terpotong/tumpang tindih | M | P2 |
| TC-VIS-34 | Gestur: pinch, putar, geser sheet cepat, ketuk ganda | Peta dan sheet tidak saling mengganggu | M | P2 |
| TC-VIS-35 | Snapshot baru terbit saat pengunjung sedang membuka | Versi lama tetap jalan; versi baru dipakai saat aman | E | P2 |
| TC-VIS-36 | Cache snapshot rusak / skema versi lebih baru | Muat ulang dari server; versi tak dikenal ditolak dengan pesan | U, E | P1 |
| TC-VIS-37 | Lantai tanpa fitur, gedung tanpa lantai | Pesan kosong, tanpa galat | E | P2 |
| TC-VIS-38 | Logo branding gagal dimuat / sangat lebar / transparan | Tanda bawaan / dibatasi lebarnya | E | P3 |
| TC-VIS-39 | Nama tampilan 60 karakter di HP 360 px | Terpotong rapi dengan elipsis | E | P3 |
| TC-VIS-40 | Warna utama putih, hitam, abu tengah | Teks tetap lolos AA atau paling kontras | U | P1 |
| TC-PUB-30 | Publish dua kali beruntun / dua Admin bersamaan | Nomor versi berurutan tanpa bentrok | I | P1 |
| TC-PUB-31 | Publish saat Edge Function/Storage gagal | Pesan gagal; versi aktif lama tetap | I | P1 |
| TC-PUB-32 | Publish venue kosong (tanpa lantai/fitur) | Ditolak atau Visitor menampilkan keadaan kosong | I, E | P2 |

### 13.7 Keamanan (lanjutan)

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-SEC-50 | IDOR: ubah `venueId`/`floorId`/`locationId` di permintaan ke milik venue lain | Ditolak sesuai role/RLS | D, I | P1 |
| TC-SEC-51 | Mass assignment: kirim kolom `role`, `created_by`, `is_active` lewat REST update profil/lokasi | Kolom terlindungi tidak berubah | D | P1 |
| TC-SEC-52 | Memanggil fungsi RPC (`save_location`, `import_locations`, `apply_template`, `acquire_edit_lock`) sebagai anon/Viewer | Ditolak | D | P1 |
| TC-SEC-53 | Path traversal di nama berkas (`../../x.png`) | Path disusun server; tidak keluar folder venue | I | P1 |
| TC-SEC-54 | Daftar isi bucket privat lewat anon | Ditolak | D | P1 |
| TC-SEC-55 | URL bertanda denah dipakai setelah 1 jam | Ditolak | I | P2 |
| TC-SEC-56 | Header keamanan Visitor/Admin (CSP, X-Content-Type-Options, frame-ancestors) di paket produksi | Ada (diuji di T-411/T-412) | M | P2 |
| TC-SEC-57 | Clickjacking: Admin di-iframe situs lain | Diblokir (produksi) | M | P2 |
| TC-SEC-58 | Open redirect di parameter kembali setelah login | Hanya path internal | E | P1 |
| TC-SEC-59 | Pesan galat tidak membocorkan SQL/stack trace/nama tabel | Pesan Indonesia yang umum | I, E | P1 |
| TC-SEC-60 | Rate limit / banyak permintaan publish atau unggah beruntun | Server tetap responsif | M | P2 |
| TC-SEC-61 | Webhook Auth Hook tanpa/ dengan tanda tangan salah | Ditolak | I | P1 |
| TC-SEC-62 | Edge Function dipanggil dengan metode/isi tak terduga (GET, JSON rusak, body 10 MB) | 4xx dengan pesan; tidak crash | I | P2 |
| TC-SEC-63 | Dependensi: `pnpm audit` dan `pip-audit` cad-converter | Tanpa celah tinggi/kritis | M | P2 |
| TC-SEC-64 | Data pribadi di Catatan dan log server | Hanya yang diperlukan; tanpa password/token | M | P1 |

### 13.8 Ketahanan, data, dan lingkungan

| ID | Skenario | Hasil diharapkan | Level | P |
| --- | --- | --- | --- | --- |
| TC-REL-01 | Muat ulang halaman di tengah formulir/wizard | Tidak ada data setengah tersimpan | E | P2 |
| TC-REL-02 | Tombol simpan diklik dua kali cepat | Satu data saja (tanpa duplikat) | E | P1 |
| TC-REL-03 | Back/Forward browser di dalam dialog dan editor | Tidak kehilangan perubahan tanpa peringatan | E | P2 |
| TC-REL-04 | Jaringan lambat (3G) dan putus-sambung | Indikator memuat; coba lagi berhasil | E | P2 |
| TC-REL-05 | Supabase dimatikan saat Admin terbuka | Pesan koneksi jelas; pulih otomatis saat kembali | M | P2 |
| TC-REL-06 | Visitor offline setelah kunjungan pertama (PWA) | Peta dan rute versi tersimpan berjalan | E | P1 |
| TC-REL-07 | `supabase db reset` dari nol | Semua migrasi dan seed berhasil; pgTAP lulus | D | P1 |
| TC-REL-08 | Migrasi baru di atas data yang ada (bukan database kosong) | Data lama utuh | D | P1 |
| TC-REL-09 | Zona waktu perangkat berbeda dari venue (UTC, Asia/Tokyo) | Semua waktu tampil menurut zona venue | U, E | P1 |
| TC-REL-10 | Pergantian hari/jam saat halaman terbuka (23.59 → 00.00) | Status buka/tutup berganti otomatis | U, E | P2 |
| TC-REL-11 | Bahasa browser Inggris tanpa pilihan tersimpan | Visitor mengikuti bahasa bawaan venue | E | P3 |
| TC-REL-12 | localStorage diblokir/penuh (mode privat) | Aplikasi tetap jalan tanpa mengingat pilihan | E | P2 |

## 14. Ringkasan jumlah test case

Bagian 3–10: 126 test case utama. Bagian 13: 133 kasus tepi, negatif, batas, konkurensi, keamanan lanjutan, dan ketahanan. Total 259. Jumlah ini ditinjau ulang setiap kali satu task selesai diverifikasi; kasus baru yang ditemukan saat pengujian ditambahkan ke bagian area yang sesuai dengan ID lanjutan.
