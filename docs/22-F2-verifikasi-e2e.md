# 22 · F2 Fase 2: alur verifikasi E2E

Alur pengujian end-to-end untuk semua task Fase 2 (`21-F2-task.md`). Test case F2 ada di
`16-test-case.md` bagian 15; sebut ID-nya (`TC-xxx-nn`) di nama test dan README bukti.

Bedanya dengan R0–R3: di sana verifikasi E2E dikerjakan belakangan sebagai T-307a
(`15-verifikasi-e2e.md`). Di F2, **verifikasi adalah bagian dari task itu sendiri**. Task belum
selesai sebelum spec-nya lulus dan buktinya ada.

## 1. Aturan yang tetap berlaku

Semua aturan `15-verifikasi-e2e.md` berlaku, kecuali yang diubah di bagian 4:
- referensi e2e-runner (Page Object, locator stabil, tanpa `waitForTimeout`, Arrange-Act-Assert);
- data banyak dan bervariasi (aturan 6);
- gambar wajib ke `e2e/evidence/T-xxx/` setelah layar siap, lalu diperiksa dengan mata;
- daftar periksa CRUD dan UI/UX;
- README bukti dengan format yang sama;
- tinjauan `code-reviewer`, dan `security-reviewer` untuk auth, RLS, Storage, Edge Function,
  unggahan, lisensi, atau snapshot;
- **satu task per putaran:** laporkan hasilnya ke pemilik dan tunggu persetujuan sebelum task
  berikutnya.

## 2. Persiapan tambahan

Persiapan dasar sama dengan `15-verifikasi-e2e.md` (`supabase start`, `pnpm db:reset`,
`pnpm test:e2e`). Layanan tambahan hanya dinyalakan untuk task yang membutuhkannya:

| Layanan uji | Task | Catatan |
| --- | --- | --- |
| Mailpit (sudah ada) | T-501, T-505, T-592, T-595, T-597, T-598 | `e2e/support/mailpit.ts` |
| vendor-stub (sudah ada, port 8091) dengan `POST /v1/trial` | T-504, T-595 | Kunci dev saja |
| Server dev landing page (port 5175) | T-505, T-595 | Dinyalakan `playwright.config.ts` seperti Admin dan Visitor |
| IdP uji OIDC/SAML (mis. Keycloak) dan OpenLDAP dalam container | T-592 | Hanya untuk test, tidak ikut paket instalasi |
| Penerima webhook uji (`e2e/support/webhook-receiver.ts`) | T-593 | Server HTTP lokal yang bisa diatur membalas 200 atau 500 |
| `cad-converter` dengan OpenCV | T-547, T-548, T-549 | OpenCV disetujui pemilik 2026-10-06 |
| Validator IMDF | T-594 | Dijalankan dari test integrasi |
| PostgreSQL 17 terpisah (container) | T-522 | Uji manual paket instalasi |

**Waktu:** jangan menunggu jam sungguhan. Pakai `page.clock` untuk UI. Untuk job `pg_cron`
(publish terjadwal, retensi, agregasi analitik, peringatan), panggil fungsi job langsung dari
test dengan waktu yang ditentukan. Dipakai di T-504, T-532, T-536, T-543, T-561, T-581–T-583,
T-591, T-597, dan T-598.

## 3. Proyek Playwright dan letak spec

| Proyek | Isi | Letak spec F2 |
| --- | --- | --- |
| `admin` (ada) | Admin desktop 1440 × 900 | `e2e/tests/admin/f2/T-5xx-slug.spec.ts` |
| `visitor` (ada) | Visitor HP 360 × 740, Info Point potret 1080 × 1920 dibuka di halaman tambahan | `e2e/tests/visitor/f2/T-5xx-slug.spec.ts` |
| `license` (ada, serial) | Spec yang mengubah lisensi instalasi: trial, fitur paket (`events`, `cad_import`) | `e2e/tests/license/f2/T-5xx-slug.spec.ts` |
| `landing` (baru) | Landing page HP 360 × 740 dan desktop 1280 × 800 | `e2e/tests/landing/T-505-slug.spec.ts` |
| `visitor-nowebgl` (baru) | Chromium dengan `--disable-webgl --disable-3d-apis` | `e2e/tests/visitor-nowebgl/T-512-slug.spec.ts` |

Spec alur gabungan per rilis memakai nama `F2.x-alur-gabungan.spec.ts` di folder proyek yang
paling sesuai.

## 4. Aturan khusus F2

1. **Spec ditulis di task itu.** Spec, test case yang dibuktikan, dan `e2e/evidence/T-5xx/`
   masuk PR task yang sama. Commit memakai nama task (`T-5xx: …`), bukan `T-307a`.
2. **Urutan lapisan:** unit (U), pgTAP (D), dan integrasi (I) task itu hijau dulu, baru E2E (E).
   Langkah manual (M) dicatat di README bukti.
3. **Tur panduan (driver.js) mati di E2E.** Fixture menandai semua tur sudah dilihat untuk akun dan
   perangkat uji. Hanya spec T-599 yang menyalakannya.
4. **Perubahan tampilan bersama** (judul PanduArah di T-501, `DataTable` di T-503) diikuti dengan
   memperbarui Page Object di `e2e/pages/`. Test lama tidak dilemahkan atau dihapus.
5. **Lisensi dipulihkan.** Spec yang memasang lisensi trial atau lisensi dengan fitur tertentu
   memulihkan lisensi semula di akhir (`e2e/support/license.ts`).
6. **Tanpa layanan luar sungguhan.** Gmail, Google Maps, IdP sungguhan, dan layanan lisensi vendor
   produksi diganti tiruan lokal. Tautan Google Maps cukup diperiksa URL-nya.
7. **Task tanpa browser** (paket instalasi, Windows, dokumen, uji perangkat nyata) dibuktikan
   lewat log terminal, foto layar, atau berkas hasil, dengan daftar periksa test case di README.
8. **Keamanan:** baris matriks TC-SEC-70 s.d. 81 dijalankan langsung ke server (repository/REST
   dengan token role itu) di task yang membuat tabel atau aksinya.
9. **Keputusan dependency sudah ada** (pemilik 2026-10-06): T-599 memakai driver.js (gratis),
   OpenCV di T-548 dan Three.js di T-571 disetujui, dan T-549 hanya memakai model AI gratis.
   Pilihan lain di luar keputusan ini tidak diverifikasi sebelum dicatat di
   `PROGRESS.md`.

## 5. Daftar task per rilis

Format: task · judul — **fokus cek** · test case → folder bukti. Level `M` artinya bukti manual.

### F2.1 · Siap jual

- [x] T-501 · Nama produk PanduArah — judul, header, logo, favicon, PWA, email; tanpa "Indoor Map" · TC-BRD-01 s.d. 06 → `e2e/evidence/T-501/`
- [x] T-502 · Komponen tabel — galeri `/_ui`: cari, filter, pagination, keadaan kosong/memuat/galat, status di URL · TC-TBL-04, 05, 06 → `e2e/evidence/T-502/`
- [x] T-503 · Tabel di semua halaman Admin — Lokasi 2.000 baris dan Log audit: cari, filter, pindah halaman, muat ulang; daftar 17 tabel · TC-TBL-01 s.d. 10, TC-SEC-81 → `e2e/evidence/T-503/`
- [ ] T-504 · Lisensi trial — trial otomatis dan per permintaan, trial kedua ditolak, setiap batas trial, tenggang, upgrade ke berbayar · TC-TRL-01 s.d. 14, TC-SEC-80 → `e2e/evidence/T-504/`
- [x] T-505 · Landing page dan form trial — ID/EN, HP dan desktop, kirim form ke Mailpit, validasi, spam · TC-LND-01 s.d. 08 → `e2e/evidence/T-505/`
- [x] T-511 · Image Docker jadi — pasang dari arsip tanpa internet, isi paket, upgrade dan rollback (M) · TC-HRD-01 s.d. 03 → `e2e/evidence/T-511/`
- [ ] T-512 · Visitor tanpa WebGL — pesan, cari dan rute tetap jalan, Info Point · TC-HRD-04 → `e2e/evidence/T-512/`
- [ ] T-514 · Perbaikan lisensi dan audit R4 — `cad-floor-plan` lulus, 403 tanpa `cad_import`, tombol masa tenggang, pelaku audit · TC-HRD-07 s.d. 10 → `e2e/evidence/T-514/`
- [ ] T-521 · Windows lewat VM Ubuntu — ikuti panduan di Hyper-V (M) · TC-INS-01 → `e2e/evidence/T-521/`
- [ ] T-596 · Bantuan pengguna — artikel per menu, buka offline, tur lintas halaman · TC-OPS-16 → `e2e/evidence/T-596/`
- [ ] T-599 · Tur panduan (driver.js) — tur per halaman Admin, Visitor, Info Point; lewati, ulang, role, lazy load · TC-TUR-01 s.d. 11, TC-SEC-73 → `e2e/evidence/T-599/`
- [ ] T-601 · UU PDP — export dan hapus data akun, retensi, pemberitahuan privasi · TC-KOM-01, 02, 08 → `e2e/evidence/T-601/`
- [ ] T-602 · Dokumen legal — EULA wajib disetujui saat aktivasi pertama · TC-KOM-03 → `e2e/evidence/T-602/`
- [ ] T-605 · Demo penjualan — reset satu perintah, venue per industri bisa dipublish dan dirutekan (M) · TC-KOM-06 → `e2e/evidence/T-605/`

**Alur gabungan F2.1** (`license/f2/F2.1-alur-gabungan.spec.ts`):
1. Calon klien membuka landing page dan mengirim form trial (Mailpit menerima dua email).
2. Instalasi baru membuka `/aktivasi`, menyetujui EULA, lalu menekan **Mulai trial**.
3. Super Admin pertama dibuat, banner "Trial — sisa 14 hari" tampil, dan tur halaman muncul.
4. Venue dibuat sampai batas lantai trial, lalu lantai ke-7 ditolak.
5. Lisensi berbayar dipasang: batas terangkat, data trial utuh.
6. Visitor menampilkan nama dan logo PanduArah atau logo venue.

### F2.2 · Aman dan terkelola

- [ ] T-513 · Performa dan perangkat nyata — angka HP sungguhan, uji browser manual (M) · TC-HRD-05, 06 → `e2e/evidence/T-513/`
- [ ] T-535 · Riwayat lisensi — pergantian lisensi berurutan di tabel · TC-ADM-08 → `e2e/evidence/T-535/`
- [ ] T-592 · 2FA dan SSO — 2FA wajib per role, kode cadangan, reset, OIDC dan LDAP uji · TC-OPS-06 s.d. 08, TC-SEC-71 → `e2e/evidence/T-592/`
- [ ] T-595 · Vendor Portal — setujui trial dari landing, lisensi lolos aktivasi, kunci privat tidak di database · TC-OPS-14, 15 → `e2e/evidence/T-595/`
- [ ] T-597 · Monitoring server — backup gagal 2×, disk, sertifikat → peringatan halaman dan email · TC-OPS-17, TC-SEC-76 → `e2e/evidence/T-597/`
- [ ] T-598 · Notifikasi email — preferensi per jenis, berhenti berlangganan, pengingat lisensi · TC-OPS-18, 19 → `e2e/evidence/T-598/`
- [ ] T-603 · Uji keamanan — CI gagal pada kerentanan tinggi, laporan pentest (M) · TC-KOM-04 → `e2e/evidence/T-603/`
- [ ] T-604 · Proses rilis — rilis percobaan dari tag sampai arsip dan changelog (M) · TC-KOM-05 → `e2e/evidence/T-604/`
- [ ] T-607 · Uji beban dan kapasitas — skenario k6 normal, puncak, lonjakan, ketahanan, titik batas, kelebihan beban; panduan ukuran server (M) · TC-LOAD-01 s.d. 17 → `e2e/evidence/T-607/`
- [ ] T-606 · Materi pelatihan — modul, video, lembar ringkas per peran (M) · TC-KOM-07 → `e2e/evidence/T-606/`

**Alur gabungan F2.2** (`admin/f2/F2.2-alur-gabungan.spec.ts`): Admin dengan 2FA wajib masuk
memakai kode TOTP, menerima pengingat lisensi H-7 di Mailpit, lalu Super Admin melihat peringatan
backup gagal di Kesehatan sistem. Semua peristiwa tercatat di log audit.

### F2.3 · Nilai jual utama

- [ ] T-548 · Scan denah tahap 1 — scan 3 fixture, pratinjau, pilih sebagian, impor draft, undo, batas berkas · TC-MPX-08 s.d. 11, 13 → `e2e/evidence/T-548/`
- [ ] T-572 · Pustaka ikon — cari ID/EN dan alias, kategori, tampil tajam di peta · TC-PAR-05 s.d. 07 → `e2e/evidence/T-572/`
- [ ] T-571 · Elemen 3D — objek pustaka dan GLB di Visitor 3D, validasi unggahan, Three.js lazy · TC-PAR-01 s.d. 04 → `e2e/evidence/T-571/`
- [ ] T-544 · Export peta cetak — PDF A3 dan SVG dengan legenda, judul, arah utara · TC-MPX-04 → `e2e/evidence/T-544/`
- [ ] T-574 · Papan "Anda di sini" dan stiker QR — papan A3, cetak massal, stiker 20 lokasi, QR membuka rute · TC-PAR-11, 12 → `e2e/evidence/T-574/`
- [ ] T-581 · Event: data dan Admin — CRUD, validasi, berulang, RLS anon, fitur lisensi `events` · TC-EVT-01 s.d. 05, 11, TC-SEC-70 → `e2e/evidence/T-581/`
- [ ] T-582 · Event di Visitor — tampil, rute, bagikan, hilang sendiri tanpa publish, muat awal · TC-EVT-06 s.d. 08 → `e2e/evidence/T-582/`
- [ ] T-583 · Playlist Info Point — idle, sentuh, offline · TC-EVT-09, 10 → `e2e/evidence/T-583/`
- [ ] T-591 · Analitik — event uji cocok dengan dasbor, tanpa data pribadi, opt-out, batas laju · TC-OPS-01 s.d. 05, TC-SEC-72 → `e2e/evidence/T-591/`
- [ ] T-552 · Estimasi waktu — menit konsisten dengan jarak, ID/EN · TC-NVX-04 → `e2e/evidence/T-552/`
- [ ] T-553 · Fasilitas terdekat dan multi-tujuan — toilet terdekat, rute 3 tujuan · TC-NVX-05, 06 → `e2e/evidence/T-553/`
- [ ] T-554 · Konten multi-bahasa — EN tampil, kosong jatuh ke ID · TC-NVX-07 → `e2e/evidence/T-554/`
- [ ] T-573 · Penguatan CMS — pustaka media, edit massal 100 lokasi + undo, dasbor · TC-PAR-08 s.d. 10, TC-SEC-78 → `e2e/evidence/T-573/`

**Alur gabungan F2.3** (`admin/f2/F2.3-alur-gabungan.spec.ts`): Editor mengunggah denah, menekan
Scan, mengimpor ruang, memberi ikon dari pustaka, dan menaruh satu objek 3D. Admin membuat event
di salah satu ruang lalu publish. Di Visitor, event tampil, rute ke sana menampilkan estimasi
waktu, dan dasbor analitik mencatat pencarian dan rute itu. Papan QR titik asal dicetak lalu
QR-nya membuka rute yang sama.

### F2.4 · Enterprise dan integrasi

- [ ] T-593 · API dan webhook — kunci per scope, upsert jam operasional, webhook HMAC dengan retry · TC-OPS-09 s.d. 11, TC-SEC-71 → `e2e/evidence/T-593/`
- [ ] T-594 · Export GeoJSON dan IMDF — validator lulus, geometri cocok · TC-OPS-12, 13 → `e2e/evidence/T-594/`
- [ ] T-531 · Hak akses granular — "hanya lokasi" ditolak mengubah peta, izin tidak melebihi role · TC-ADM-01, 02, TC-SEC-71 → `e2e/evidence/T-531/`
- [ ] T-532 · Audit log lengkap — diff per modul, retensi, export CSV · TC-ADM-03, 04 → `e2e/evidence/T-532/`
- [ ] T-522 · PostgreSQL milik klien — instal ke database terpisah, cek ekstensi, upgrade (M) · TC-INS-02 s.d. 04 → `e2e/evidence/T-522/`
- [ ] T-551 · Aturan jalur dan bobot — satu arah, jam buka, preferensi konektor · TC-NVX-01 s.d. 03 → `e2e/evidence/T-551/`
- [ ] T-556 · Embed, minimap, peta privat — iframe di halaman lain, venue privat ditolak tanpa login · TC-NVX-10, 11, TC-SEC-75 → `e2e/evidence/T-556/`
- [ ] T-557 · Jalur terbatas — umum tidak lewat jalur terbatas, staf lebih pendek, graf terlindungi · TC-NVX-12 s.d. 15, TC-SEC-74 → `e2e/evidence/T-557/`
- [ ] T-555 · Keselamatan dan mode teks — lapisan keselamatan, rute ke pintu keluar, axe, pembaca layar · TC-NVX-08, 09 → `e2e/evidence/T-555/`
- [ ] T-561 · Pairing dan status perangkat — kode sekali pakai, offline ≤ 2 menit, reload · TC-DEV-01 s.d. 03, TC-SEC-77 → `e2e/evidence/T-561/`
- [ ] T-562 · Shell Windows (WPF) — boot ke Info Point, pulih setelah crash (M) · TC-DEV-04 → `e2e/evidence/T-562/`
- [ ] T-523 · Windows Server langsung — instal, backup terjadwal, restore, upgrade-rollback (M) · TC-INS-05 → `e2e/evidence/T-523/`

**Alur gabungan F2.4** (`admin/f2/F2.4-alur-gabungan.spec.ts`): staf masuk lewat SSO uji dengan
role terpetakan, sistem uji mengubah jam operasional lewat API lalu publish, penerima webhook
menerima peristiwa `publish` bertanda tangan sah, dan staf di Visitor mendapat rute lewat jalur
terbatas, sedangkan pengunjung umum tidak.

### F2.5 · Penyempurnaan

- [ ] T-533 · Label kustom — istilah pengganti di menu Admin dan Visitor · TC-ADM-05 → `e2e/evidence/T-533/`
- [ ] T-534 · Duplikasi lantai — salinan atomik lolos validasi, rute di dalamnya jalan · TC-ADM-06, 07 → `e2e/evidence/T-534/`
- [ ] T-536 · Publish terjadwal — terbit pada waktunya, batal saat draft bermasalah, jadwal bisa dibatalkan · TC-ADM-09 s.d. 11, TC-SEC-79 → `e2e/evidence/T-536/`
- [ ] T-541 · Landmark — langkah menyebut landmark · TC-MPX-01 → `e2e/evidence/T-541/`
- [ ] T-542 · Kontrol label — label prioritas tetap tampil · TC-MPX-02 → `e2e/evidence/T-542/`
- [ ] T-543 · Area temporer — tampil dan hilang sesuai jadwal · TC-MPX-03 → `e2e/evidence/T-543/`
- [ ] T-545 · Warna kategori dan lantai bertumpuk — tampil di Visitor setelah publish · TC-MPX-05 → `e2e/evidence/T-545/`
- [ ] T-546 · Pintu masuk venue — tautan Google Maps · TC-MPX-06 → `e2e/evidence/T-546/`
- [ ] T-547 · Import vektor CAD — unit draft lolos validasi · TC-MPX-07 → `e2e/evidence/T-547/`
- [ ] T-549 · Scan AI — akurasi dan waktu dibanding tahap 1 (M) · TC-MPX-12, 13 → `e2e/evidence/T-549/`
- [ ] T-563 · Mode aksesibilitas Info Point — kontrol di sepertiga bawah, kembali normal saat idle · TC-DEV-05 → `e2e/evidence/T-563/`

**Alur gabungan F2.5** (`visitor/f2/F2.5-alur-gabungan.spec.ts`): lantai diduplikasi, diberi
landmark dan area temporer, lalu dijadwalkan terbit. Setelah waktu terbit, Visitor menampilkan
warna per kategori, area temporer, dan langkah rute yang menyebut landmark.

## 6. Uji beban: aplikasi diakses banyak orang

Uji fungsi di atas memakai satu atau dua pengguna. Uji beban membuktikan server klien tetap
melayani saat **banyak orang mengakses bersamaan**, misalnya jam besuk rumah sakit, hari
pertama kuliah, acara besar, atau banyak pengunjung memindai QR serentak. Dasarnya k6 dari T-412
(`tests/perf/k6/load.js`, NFR-CAP-01: 200 pengunjung + 20 Admin), diperluas di T-607.

**Jenis uji** (rincian dan target di `16-test-case.md` §15.14):

| Jenis | Beban | Pertanyaan yang dijawab |
| --- | --- | --- |
| Smoke | 10 pengunjung + 2 Admin, 1 menit | Skenario k6 masih jalan setelah perubahan? |
| Normal | 200 pengunjung + 20 Admin + 10 Info Point, 10 menit | Target NFR-CAP-01 tetap terpenuhi dengan fitur F2? |
| Puncak | 1.000 pengunjung, 10 menit | Apa yang terjadi pada 5× beban normal? |
| Lonjakan | 0 → 500 pengunjung dalam 10 detik | Server pulih setelah serbuan mendadak? |
| Ketahanan | Beban normal, 4 jam | Ada kebocoran memori atau latensi yang terus naik? |
| Titik batas | Naik bertahap sampai gagal | Berapa kapasitas per spesifikasi server? |
| Kelebihan beban | Di atas titik batas | Server menolak dengan rapi, bukan mati? |

**Aturan:**
1. Dijalankan pada **paket instalasi** (T-411/T-511) di server dengan spesifikasi yang dicatat
   (CPU, RAM, disk), bukan server dev. Mesin k6 terpisah dari server uji bila memungkinkan.
2. Setiap task yang menambah endpoint, pembacaan berkala, atau proses berat **menambahkan
   skenario k6-nya** di `tests/perf/k6/` di PR task itu:
   - event dibaca tiap menit (T-582);
   - kiriman analitik (T-591);
   - heartbeat Info Point (T-561);
   - tabel server (T-503);
   - API dan webhook (T-593);
   - login SSO/2FA (T-592);
   - scan denah (T-548);
   - form landing page (T-505).
3. Selama uji, catat juga CPU, RAM, koneksi database, dan disk per container (`docker stats`
   atau halaman Kesehatan sistem T-597).
4. Hasil ditulis di `docs/laporan-performa.md` bagian "Uji beban F2": tanggal, versi,
   spesifikasi server, angka per skenario, dan temuan.
5. Angka kapasitas dari uji titik batas menjadi **panduan ukuran server** di `deploy/README.md`
   (mis. "4 vCPU / 8 GB: ± N pengunjung bersamaan").

## 7. Gerbang setiap rilis F2

Rilis F2.x dinyatakan lulus bila:
- [ ] semua spec task rilis itu dan spec alur gabungannya lulus 3 kali berturut-turut tanpa retry;
- [ ] seluruh suite (R0–R4 dan rilis F2 sebelumnya) tetap lulus; waktu satu run dijaga
  < 15 menit, dan bila lewat, CI dibagi beberapa shard;
- [ ] semua test case P1 rilis itu berstatus Lulus, sedangkan P2 berstatus Lulus atau Ditunda
  dengan alasan yang disetujui pemilik;
- [ ] uji paket instalasi (instal, upgrade, rollback) lulus;
- [ ] uji beban smoke dan normal (TC-LOAD-01, 02) lulus dengan semua skenario k6 fitur rilis
  itu; mulai F2.2 (setelah T-607), uji puncak dan lonjakan (TC-LOAD-03, 04) juga lulus;
- [ ] ringkasan rilis ditulis di `e2e/evidence/F2.x/README.md`: daftar task, hasil, temuan
  terbuka, dan tautan ke folder bukti setiap task.
