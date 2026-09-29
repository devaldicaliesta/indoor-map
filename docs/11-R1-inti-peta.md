# 11 · R1 Inti Peta

**Tujuan:** Admin bisa membangun peta venue multi-gedung (denah, georeferensi, unit, fasilitas, 2D/3D, lokasi dasar), dan pengunjung bisa menjelajah, mencari, serta membuka detail lokasi di Visitor.

**Gerbang selesai R1** (diuji manual dengan venue contoh: 2 gedung, 3 lantai di gedung utama, 20 unit, denah PNG dan PDF):
- Admin membuat venue, dua gedung, lantai, mengunggah dan menempatkan denah, menggambar ≥ 20 unit dan fasilitas, mengatur 2D/3D.
- Snapshot minimal dibangkitkan; Visitor menampilkan venue, berpindah gedung/lantai, 2D/3D, mencari "radiologi" (dan "radilogi"), membuka detail, dan menjelajah direktori A–Z, dalam ID dan EN.
- `pnpm check` hijau; test validasi geometri dan builder snapshot lulus.

Dokumen pendukung utama: `03-arsitektur.md` (peta, snapshot), `04-model-data.md`, `05-desain-ui.md` (wireframe editor dan Visitor).

---

### T-101 · Venue dan multi-venue

- **Untuk:** FR-VEN-01, FR-VEN-03
- **Bergantung pada:** R0
- **Langkah:**
  1. Halaman Venue: daftar venue (tabel), tambah/ubah/hapus.
  2. Form: nama, alamat, zona waktu (daftar IANA), logo (unggah ke `public-assets/`), titik pusat dipilih dengan klik di peta kecil.
  3. Hapus venue meminta ketik ulang nama venue (menghapus semua data turunan).
  4. Pemilih venue di header memakai daftar ini.
- **File:** `apps/admin/src/features/venues/**`, `packages/data/src/venues.ts`, `packages/domain/src/venue.ts`
- **Selesai jika:**
  - [ ] Venue tersimpan dengan semua atribut; zona waktu dipakai untuk tampilan waktu venue
  - [ ] Dua venue dikelola terpisah; data satu venue tidak tampil di venue lain
  - [ ] Venue baru otomatis memiliki lapisan Area Luar (dari trigger)
- **Jangan:** membuat pemilihan tipe venue/template (itu T-302); venue baru memakai `custom`.

### T-102 · Gedung dan lapisan Area Luar

- **Untuk:** FR-VEN-04
- **Bergantung pada:** T-101, T-104
- **Langkah:**
  1. Tab Gedung di halaman venue: tabel gedung (nama, kode, jumlah lantai), tambah/ubah/hapus.
  2. Footprint gedung digambar sebagai poligon di peta (memakai `map-core` + terra-draw mode polygon sederhana).
  3. Lapisan Area Luar tampil sebagai baris khusus yang tidak bisa dihapus.
  4. Tandai gedung default venue.
- **File:** `apps/admin/src/features/venues/buildings/**`, `packages/data/src/buildings.ts`
- **Selesai jika:**
  - [ ] Gedung bisa ditambah, diubah, dihapus; kode unik per venue
  - [ ] Venue dengan satu gedung berfungsi normal
  - [ ] Area Luar selalu ada dan tidak bisa dihapus
- **Jangan:** mengizinkan gedung tanpa kode.

### T-103 · Lantai dan default tampilan

- **Untuk:** FR-VEN-05, FR-VEN-06
- **Bergantung pada:** T-102
- **Langkah:**
  1. Daftar lantai per gedung: nama tampilan, nomor level (boleh negatif), tinggi (m), urutan drag.
  2. Hapus lantai yang masih punya fitur meminta konfirmasi dengan jumlah fitur yang akan terhapus.
  3. Tandai lantai default per gedung.
  4. Komponen `FloorSwitcher` di `packages/ui` (vertikal, dipakai Admin dan Visitor).
- **File:** `apps/admin/src/features/venues/floors/**`, `packages/data/src/floors.ts`, `packages/ui/src/FloorSwitcher.tsx`
- **Selesai jika:**
  - [ ] Lantai level −1 tersimpan dan terurut benar (B1 di bawah GF)
  - [ ] Hapus lantai berisi fitur tidak terjadi tanpa konfirmasi
  - [ ] Default gedung + lantai dipakai sebagai tampilan awal peta
- **Jangan:** menghitung Area Luar sebagai lantai gedung.

### T-104 · Fondasi peta (`packages/map-core`)

- **Untuk:** fondasi teknis peta
- **Mendukung:** FR-MAP-*, FR-VIS-*, FR-VST-03 (dimiliki T-108 s.d. T-118)
- **Bergantung pada:** T-003, T-006
- **Langkah:**
  1. `createMap(container, options)` → instance MapLibre dengan style kosong (latar `--canvas`), tanpa basemap internet.
  2. `buildStyleLayers(display)` menghasilkan layer 2D (`fill`, `line`) dan 3D (`fill-extrusion`) per `feature_kind` dengan warna/tinggi dari `display_settings` (default di `05-desain-ui.md`).
  3. `setFloorData(map, featureCollection)` mengganti data satu source; berganti lantai tidak membuat peta baru.
  4. `setViewMode(map, '2d' | '3d')` dengan transisi `easeTo` (pitch 0 ↔ 50, ≤ 300 ms, hormati `prefers-reduced-motion`).
  5. Kontrol zoom, kompas, tombol 2D/3D sebagai komponen React tipis di `packages/ui` yang memanggil fungsi ini.
  6. Test unit untuk `buildStyleLayers` (tanpa WebGL).
- **File:** `packages/map-core/src/**`
- **Selesai jika:**
  - [ ] Peta tampil di Admin dan Visitor dengan fixture venue contoh
  - [ ] Ganti lantai < 100 ms untuk 1.000 fitur (ukur di dev)
  - [ ] Tidak ada request ke tile server eksternal
- **Jangan:** memakai Three.js.

### T-105 · Unggah denah (PNG, JPG, PDF)

- **Untuk:** FR-VEN-07 (bagian gambar & PDF), NFR-SEC-04
- **Bergantung pada:** T-103
- **Langkah:**
  1. Migrasi 0002: bucket `floor-plans` (privat), `public-assets` (baca publik), `snapshots` (baca publik) + kebijakan Storage per role.
  2. Unggah PNG/JPG langsung. PDF: render halaman terpilih dengan pdf.js di browser menjadi PNG (lebar maks 8.000 px), simpan file asli + raster.
  3. Batas: denah ≤ 50 MB, gambar ≤ 5 MB; tolak tipe lain dengan pesan jelas.
  4. Mengganti denah menonaktifkan yang lama (tetap tersimpan, `is_active = false`).
- **File:** `supabase/migrations/*_0002_storage.sql`, `apps/admin/src/features/floor-plans/**`, `packages/data/src/floorPlans.ts`
- **Selesai jika:**
  - [ ] PNG, JPG, dan PDF (halaman 2 dari 3) terunggah dan tampil
  - [ ] File 60 MB dan file `.exe` ditolak dengan pesan jelas
  - [ ] Versi denah lama tetap bisa dilihat di riwayat
- **Jangan:** mengonversi DWG/DXF (itu T-313).

### T-106 · Georeferensi dan opasitas denah

- **Untuk:** FR-VEN-08, FR-VEN-09
- **Bergantung pada:** T-105
- **Langkah:**
  1. Mode "Tempatkan denah": denah tampil sebagai `image` source dengan 4 pegangan sudut yang bisa ditarik.
  2. Kontrol rotasi (derajat) dan skala seragam; tombol "Kunci proporsi".
  3. Alat ukur: klik dua titik di denah, masukkan jarak nyata (m) → skala disesuaikan.
  4. Slider opasitas 0–100%.
  5. Simpan `corners` (TL, TR, BR, BL sebagai `[lng, lat]`) dan `opacity`.
  6. Fungsi murni perhitungan skala/rotasi di `packages/map-core/src/georef.ts` dengan test.
- **File:** `packages/map-core/src/georef.ts`, `apps/admin/src/features/floor-plans/Georeference.tsx`
- **Selesai jika:**
  - [ ] Setelah kalibrasi, jarak dua titik yang diketahui di denah terukur dengan selisih ≤ 2%
  - [ ] Opasitas dan posisi tersimpan dan dipulihkan setelah reload
  - [ ] Test `georef.ts` lulus
- **Jangan:** mengubah bentuk gambar secara non-affine (tidak ada warping bebas).

### T-107 · Lapisan acuan lantai lain

- **Untuk:** FR-VEN-10
- **Bergantung pada:** T-106
- **Langkah:**
  1. Di mode georeferensi dan editor, pilihan "Tampilkan lantai lain": pilih satu lantai acuan; denah dan fiturnya tampil samar (opasitas 25%, garis putus-putus).
  2. Konektor vertikal (lift, tangga, eskalator) lantai acuan ditonjolkan untuk membantu penyelarasan.
- **File:** `apps/admin/src/features/editor/ReferenceLayer.tsx`, `packages/map-core/src/layers/reference.ts`
- **Selesai jika:**
  - [ ] Posisi lift yang sama di dua lantai terlihat menumpuk setelah penyelarasan
  - [ ] Lapisan acuan tidak bisa diedit atau diseleksi
- **Jangan:** menyimpan lapisan acuan ke data.

### T-108 · Editor peta: kanvas, alat gambar, draft otomatis

- **Untuk:** FR-MAP-02, FR-MAP-10, NFR-PERF-03
- **Bergantung pada:** T-104, T-106
- **Konteks:** Task paling kritis di R1. Gunakan model besar untuk desain awal store dan integrasi terra-draw.
- **Langkah:**
  1. Halaman Editor Peta sesuai wireframe (`05-desain-ui.md` §4): toolbar kiri, panel daftar kiri, panel properti kanan, pemilih gedung/lantai atas, status draft kanan atas.
  2. Integrasi terra-draw + adapter MapLibre: mode `select`, `polygon`, `linestring`, `point`.
  3. Store editor (Zustand) per lantai: fitur, seleksi, alat aktif. Sumber kebenaran geometri = store; terra-draw sebagai lapisan interaksi.
  4. Simpan otomatis ke `features` dengan debounce ±800 ms dan antrean (tidak ada penyimpanan paralel untuk fitur yang sama). Indikator "Menyimpan… / Tersimpan / Gagal, coba lagi".
  5. Luas unit dihitung otomatis (turf `area` atau fungsi sendiri di `domain`).
- **File:** `apps/admin/src/features/editor/**`, `packages/data/src/features.ts`
- **Selesai jika:**
  - [ ] Poligon, garis, dan titik bisa digambar dan tersimpan dengan koordinat benar
  - [ ] Reload halaman menampilkan semua fitur yang digambar
  - [ ] Menggeser peta tetap lancar dengan 1.000 fitur di satu lantai
  - [ ] Visitor tidak melihat perubahan draft (belum ada snapshot baru)
- **Jangan:** mengimplementasikan undo/redo atau snapping di task ini.

### T-109 · Jenis fitur dan atribut unit

- **Untuk:** FR-MAP-01, FR-MAP-06
- **Bergantung pada:** T-108
- **Langkah:**
  1. Pemilih jenis saat menggambar: unit, koridor, dinding, pintu, lift, eskalator, tangga, pintu keluar, area non-akses; di Area Luar: jalan/trotoar, taman, parkir (`outdoor_area` + `props.subtype`).
  2. Panel properti unit: kode unit (unik per venue, tidak peka huruf besar/kecil), luas (otomatis, bisa dikoreksi), status (terisi, kosong, renovasi).
  3. Gaya per jenis mengikuti tabel warna peta di `05-desain-ui.md`.
- **File:** `apps/admin/src/features/editor/properties/**`, `packages/domain/src/features.ts`
- **Selesai jika:**
  - [ ] Semua jenis fitur bisa dibuat dan tampil dengan gaya berbeda
  - [ ] Kode unit ganda ditolak dengan pesan yang menyebut unit yang bentrok
  - [ ] Luas otomatis selisih ≤ 2% dari hitungan manual
- **Jangan:** menautkan lokasi di sini (T-116).

### T-110 · Edit geometri, multi-select, snapping

- **Untuk:** FR-MAP-03, FR-MAP-04
- **Bergantung pada:** T-109
- **Langkah:**
  1. Pindah, putar, ubah/tambah/hapus vertex, hapus fitur.
  2. Multi-select (Shift+klik, kotak seleksi); pindah dan hapus beberapa fitur sekaligus.
  3. Snapping ke vertex dan tepi fitur terdekat (toleransi 8 px layar) dan sudut 90°; tahan Alt untuk mematikan sementara; sakelar di status bar.
  4. Pintasan: Delete, Esc, V (pilih), P (poligon), L (garis), T (titik).
- **File:** `apps/admin/src/features/editor/**`
- **Selesai jika:**
  - [ ] Titik baru menempel ke vertex/tepi terdekat dan sudut siku
  - [ ] Multi-select memindahkan tiga fitur sekaligus dengan benar
  - [ ] Pintasan keyboard berfungsi dan tercantum di tooltip alat
- **Jangan:** menulis ulang integrasi terra-draw dari T-108.

### T-111 · Undo/redo

- **Untuk:** FR-MAP-05
- **Bergantung pada:** T-110
- **Langkah:**
  1. Pola command di store editor: setiap aksi (buat, ubah geometri, ubah properti, hapus, aksi massal) punya `do` dan `undo`.
  2. Riwayat per lantai, minimal 50 langkah per sesi; dibersihkan saat berganti lantai atau reload.
  3. Undo/redo ikut memicu simpan otomatis.
  4. Pintasan Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z.
  5. Test unit untuk store command.
- **File:** `apps/admin/src/features/editor/store/**`
- **Selesai jika:**
  - [ ] 50 langkah undo lalu 50 redo mengembalikan keadaan yang sama persis (test)
  - [ ] Undo penghapusan fitur memulihkan fitur beserta properti dan tersimpan ke database
- **Jangan:** menyimpan riwayat ke database.

### T-112 · Fasilitas dan jenis fasilitas

- **Untuk:** FR-MAP-07
- **Bergantung pada:** T-109
- **Langkah:**
  1. Pengaturan → Jenis fasilitas: tambah/ubah/hapus, nama, ikon (unggah SVG/PNG ≤ 200 kB atau pilih dari set bawaan), tanda "keselamatan".
  2. Set ikon bawaan (`packages/ui/src/pictograms/`): toilet pria/wanita/difabel, musala, ATM, P3K, informasi, APAR, titik kumpul, pintu darurat, lift, eskalator, tangga, parkir.
  3. Alat titik "Fasilitas" di editor: pilih jenis, nama opsional.
  4. Ikon ditampilkan sebagai `symbol` layer lewat sprite yang dibangun saat memuat.
- **File:** `apps/admin/src/features/facilities/**`, `packages/ui/src/pictograms/**`, `packages/map-core/src/sprites.ts`
- **Selesai jika:**
  - [ ] Jenis fasilitas baru dengan ikon unggahan tampil benar di peta
  - [ ] Fasilitas keselamatan memakai latar merah
  - [ ] Jenis yang masih dipakai tidak bisa dihapus (pesan jelas)
- **Jangan:** memakai emoji sebagai ikon.

### T-113 · Panel daftar fitur

- **Untuk:** FR-MAP-08
- **Bergantung pada:** T-109
- **Langkah:**
  1. Panel kiri: fitur lantai aktif dikelompokkan per jenis, dengan jumlah; pencarian nama/kode.
  2. Klik item → fitur diseleksi dan peta terbang ke sana. Hover → sorot di peta.
  3. Virtualisasi daftar untuk > 500 item.
- **File:** `apps/admin/src/features/editor/FeatureList.tsx`
- **Selesai jika:**
  - [ ] Mencari "L1-02" menampilkan unit yang cocok; klik menyorotnya di peta
  - [ ] Daftar tetap responsif dengan 1.000 fitur
- **Jangan:** menduplikasi state seleksi (pakai store editor).

### T-114 · Validasi geometri

- **Untuk:** FR-MAP-09
- **Bergantung pada:** T-109
- **Langkah:**
  1. `packages/domain/src/validation/geometry.ts`: poligon tidak tertutup/tidak valid (self-intersect), unit saling tumpang tindih (> 0,5 m²), fitur di luar batas lantai (footprint gedung), kode unit ganda. Mengembalikan daftar temuan `{ code, severity, featureIds, message }`.
  2. Jalankan saat fitur disimpan; fitur bermasalah diberi garis merah dan ikon peringatan di daftar fitur.
  3. Test dengan fixture berisi setiap jenis kasus.
- **File:** `packages/domain/src/validation/geometry.ts`, `packages/domain/test/validation/**`, `apps/admin/src/features/editor/ValidationOverlay.tsx`
- **Selesai jika:**
  - [ ] Keempat jenis masalah terdeteksi (test)
  - [ ] Temuan tampil di peta dan panel dengan pesan Bahasa Indonesia
- **Jangan:** memblokir penyimpanan draft (blokir hanya saat publish, R3).

### T-115 · Tampilan 2D/3D

- **Untuk:** FR-VIS-01, FR-VIS-02, FR-VIS-03, FR-VIS-04, FR-VIS-05, FR-VIS-06
- **Bergantung pada:** T-104, T-109
- **Langkah:**
  1. Pengaturan → Tampilan: tinggi default per jenis fitur, warna per jenis fitur, mode default venue (2D/3D).
  2. Panel properti fitur: override tinggi.
  3. Tombol "Simpan sebagai tampilan awal" menyimpan kamera (center, zoom, pitch, bearing).
  4. Tombol 2D/3D di editor untuk memeriksa hasil (menggambar tetap di 2D).
- **File:** `apps/admin/src/features/settings/Display.tsx`, `packages/map-core/src/style.ts`
- **Selesai jika:**
  - [ ] Mengubah tinggi default memengaruhi semua fitur jenis itu yang belum di-override
  - [ ] Override tetap berlaku saat default diubah
  - [ ] Beralih 2D/3D tanpa reload dan tanpa kehilangan perubahan
- **Jangan:** menambah pengaturan lantai bertumpuk (F2).

### T-116 · Lokasi dasar, kategori, tautan unit

- **Untuk:** FR-LOC-03, FR-LOC-04, FR-LOC-07, FR-LOC-10
- **Bergantung pada:** T-109
- **Langkah:**
  1. Halaman Lokasi: tabel (kode, nama, tipe, gedung, lantai, unit, status) dengan pencarian dan filter; penanda "belum tertaut unit".
  2. Form lokasi: kode lokasi (opsional, unik per venue), nama, kategori (multi), deskripsi, logo/foto. Tipe = "Lokasi" bawaan (tipe dan field kustom lengkap di T-303).
  3. Tautkan ke satu atau beberapa unit: ketik kode unit atau "Pilih di peta"; hanya unit yang belum dipakai lokasi aktif yang bisa dipilih.
  4. Kelola kategori (nama, ikon, urutan) untuk tipe bawaan.
  5. Dari panel properti unit di editor: tautan ke lokasi yang menempatinya.
- **File:** `apps/admin/src/features/locations/**`, `packages/data/src/locations.ts`, `packages/domain/src/location.ts`
- **Selesai jika:**
  - [ ] Lokasi bisa ditautkan ke dua unit; unit yang dipakai lokasi aktif lain ditolak
  - [ ] Kode lokasi ganda ditolak
  - [ ] Filter kategori, gedung, lantai bekerja bersamaan
- **Jangan:** membuat status, jam operasional, import, atau alias (R3).

### T-117 · Snapshot minimal

- **Untuk:** FR-PUB-01 (dasar), FR-VST-02, NFR-PERF-01, NFR-REL-03
- **Bergantung pada:** T-115, T-116
- **Konteks:** Membuat Visitor membaca snapshot sejak awal. Format final; R3 menambah validasi dan versi tanpa mengubah format.
- **Langkah:**
  1. Tipe `Snapshot` dan fungsi murni `buildSnapshot(input): Snapshot` di `packages/domain/src/snapshot.ts` sesuai `03-arsitektur.md`. Termasuk `searchIndex` (teks dinormalisasi: huruf kecil, tanpa diakritik).
  2. Edge Function `publish` (mode minimal): Admin/Super Admin memanggil; fungsi membaca draft venue, membangun snapshot, menyimpan `snapshots/{venue}/v{n}.json` dan `latest.json`, menulis baris `publications`.
  3. Tombol sementara "Terbitkan (dev)" di halaman Publish.
  4. Loader di Visitor: `loadSnapshot(venueId)` dengan cache service worker; tampilkan versi dan waktu terbit di menu info.
  5. Ukur ukuran snapshot venue contoh; target < 1,5 MB gzip untuk 2.000 fitur (sederhanakan koordinat ke 7 desimal).
- **File:** `packages/domain/src/snapshot.ts`, `packages/domain/test/snapshot.test.ts`, `supabase/functions/publish/`, `apps/visitor/src/data/loadSnapshot.ts`
- **Selesai jika:**
  - [ ] Snapshot venue contoh valid terhadap skema zod-nya (test)
  - [ ] Snapshot tidak berisi email, pengaturan server, atau data pribadi (test)
  - [ ] Visitor memuat snapshot; kunjungan kedua memakai cache
  - [ ] Editor tidak bisa memanggil `publish` (ditolak server)
- **Jangan:** menambah validasi publish, riwayat, atau rollback (R3).

### T-118 · Visitor: peta, gedung, lantai

- **Untuk:** FR-VST-01, FR-VST-02, FR-VST-03, NFR-COMP-02
- **Bergantung pada:** T-117, T-011
- **Langkah:**
  1. Route `/v/:venueId` membuka venue dengan gedung, lantai, kamera, dan mode default dari snapshot.
  2. Pemilih gedung (jika > 1) dan `FloorSwitcher`; Area Luar tampil bersama lantai dasar.
  3. Zoom, putar, kembali ke tampilan awal, tombol 2D/3D (disembunyikan jika fitur `3d` tidak ada di `enabledFeatures`).
  4. Nama lokasi dan ikon fasilitas tampil di peta; label yang bertumpuk disembunyikan otomatis sesuai tingkat zoom (collision detection `symbol` layer, prioritas: lokasi terpilih > fasilitas keselamatan > lokasi > fasilitas lain).
- **File:** `apps/visitor/src/features/map/**`
- **Selesai jika:**
  - [ ] Tanpa login, URL venue membuka tampilan default
  - [ ] Berpindah gedung/lantai berfungsi di HP 360 px dan desktop
  - [ ] Tombol 3D hilang bila `3d` tidak ada di snapshot
  - [ ] Nama lokasi dan ikon fasilitas tampil tanpa saling menumpuk di semua tingkat zoom
- **Jangan:** membuat pencarian di task ini.

### T-119 · Visitor: pencarian, kategori, detail, direktori

- **Untuk:** FR-VST-04, FR-VST-05, FR-VST-06, FR-VST-19
- **Bergantung pada:** T-118
- **Langkah:**
  1. Pencarian dari `searchIndex`: cocok awalan dan toleran salah ketik ringan (jarak edit ≤ 1 untuk kata ≥ 5 huruf); hasil muncul saat mengetik (debounce 150 ms). Fungsi murni di `packages/domain/src/search.ts` dengan test.
  2. Chip kategori dan jenis fasilitas; memilih menampilkan anggotanya di daftar dan menyorotnya di peta.
  3. Mengetuk unit atau fasilitas di peta membuka detailnya (unit tanpa lokasi aktif menampilkan kode unit saja).
  4. Profil lokasi sesuai wireframe: nama, tipe · kategori, gedung · lantai · kode unit, deskripsi, foto; tombol "Rute ke sini" dinonaktifkan dengan keterangan sampai R2.
  5. Direktori A–Z: semua lokasi berurutan abjad, filter gedung/lantai/tipe.
- **File:** `packages/domain/src/search.ts`, `apps/visitor/src/features/search/**`, `apps/visitor/src/features/location/**`
- **Selesai jika:**
  - [ ] "radilogi" menemukan "Radiologi"; kode unit dan kode lokasi bisa dicari
  - [ ] Memilih kategori menampilkan semua anggotanya di daftar dan peta
  - [ ] Mengetuk unit atau fasilitas di peta membuka detailnya
  - [ ] Direktori menampilkan semua lokasi aktif berurutan abjad dengan filter yang bekerja
- **Jangan:** mencari ke server; semua dari snapshot.

### T-120 · Visitor: bahasa ID/EN

- **Untuk:** FR-VST-11
- **Bergantung pada:** T-119
- **Langkah:**
  1. Semua teks antarmuka Visitor lewat i18next; kunci terjemahan lengkap untuk `id` dan `en`.
  2. Default: bahasa perangkat bila `id`/`en`, selain itu bahasa default venue.
  3. Test yang gagal jika ada kunci yang hanya ada di satu bahasa.
- **File:** `apps/visitor/src/i18n/**`, `apps/visitor/test/i18n.test.ts`
- **Selesai jika:**
  - [ ] Perangkat berbahasa Inggris membuka Visitor dalam Bahasa Inggris
  - [ ] Pilihan manual bahasa berfungsi dan diingat
  - [ ] Test kelengkapan terjemahan lulus
- **Jangan:** menerjemahkan konten lokasi (F2).
