# Laporan performa, kompatibilitas, dan pengerasan (T-412)

Tanggal: 2026-10-05. Cara mengulang: `tests/perf/README.md`. Angka mentah: `tests/perf/results/`.

## Lingkungan uji

- **Server.** Paket instalasi `deploy/` (T-411) di Docker, dengan HTTPS dari CA internal Caddy.
  Mesin: 4 vCPU dan 16 GB RAM, dipakai bersama browser uji dan k6. Ini bukan server klien
  terpisah.
- **Data venue besar.**
  - Ukuran: 10 lantai, 2.000 fitur (196 unit dan 4 fasilitas per lantai), 490 lokasi, dan graf
    20.000 edge (`tests/perf/src/large-venue.ts`).
  - Snapshot: 7,4 MB JSON; terkompresi 1,8 MB.
- **Data editor.** Satu lantai berisi 1.000 fitur, ditambah lantai kosong di gedung yang sama
  sebagai pembanding.
- **Peramban.** Chromium bawaan Playwright 1.56.1.
- **Emulasi HP kelas menengah.** Pixel 7 dengan CPU diperlambat 4× (patokan Lighthouse).
- **Profil jaringan Chrome DevTools.** "4G": 9 Mbps, RTT 60 ms. "Slow 4G": 1,6 Mbps, RTT 150 ms.
- **Tanpa GPU.** WebGL dirender SwiftShader di CPU, sehingga angka FPS lebih rendah daripada
  perangkat nyata.

## Ringkasan

| Target | Hasil (median 5 kali) | Status |
| --- | --- | --- |
| NFR-PERF-01 muat awal Visitor ≤ 3 s (4G) | 3,1 s dengan CPU 4× (awal T-412: 4,9 s); 1,7 s dengan CPU 1×; Slow 4G 6,4 s (awal 14,9 s) | **Hampir**; selisih 0,1 s, lihat bagian Muat awal |
| NFR-PERF-01 kunjungan ulang ≤ 1,5 s | 2,4 s dengan CPU 4× (awal 3,1 s); 0,9 s dengan CPU 1× | **Belum** di emulasi CPU 4×; lihat bagian Muat awal |
| NFR-PERF-02 rute ≤ 500 ms, HP kelas menengah | 206 ms (rute terjauh GF → L9 lewat lift, dari ketukan sampai daftar langkah tampil) | Lulus |
| NFR-PERF-03 editor lancar dengan 1.000 fitur | Geser peta 18,7 fps = 61% dari lantai kosong (30,7 fps); geser fitur 28 fps; lantai terbuka dalam 1,2 s | Lulus (ambang T-108: > 35%) |
| NFR-PERF-04 publish ≤ 60 s | 5,8 s | Lulus |
| NFR-CAP-01 200 pengunjung + 20 Admin bersamaan | Lihat bagian Uji beban | Lulus |
| NFR-COMP-01/02 browser dan perangkat | Lihat bagian Matriks browser | Lulus, dengan catatan |
| NFR-USE-01 axe tanpa pelanggaran serius | 0 pelanggaran di 15 halaman | Lulus setelah perbaikan |

## Perbaikan di task ini

1. **Index foreign key graf** (migrasi `0033_graph_fk_indexes`). Menghapus venue besar butuh
   63 detik karena pemeriksaan FK `nav_edges.from_node_id` dan `nav_edges.to_node_id` memindai
   seluruh tabel untuk setiap node. Lewat API, penghapusan itu gagal kena batas waktu statement.
   Setelah enam index ditambahkan, waktunya turun ke 0,5 detik.
2. **Kompresi gateway** (`deploy/Caddyfile`). Storage mengirim snapshot tanpa kompresi.
   Dengan `encode zstd gzip`, ukurannya turun dari 7,4 MB ke 1,8 MB, dan muat awal 4G turun
   lebih dari 4 detik.
3. **Aksesibilitas Visitor.** axe menemukan dua pelanggaran:
   - critical: kolom cari menunjuk `aria-controls` ke daftar hasil yang belum ada di DOM.
     Atribut itu dihapus, karena jumlah hasil sudah diumumkan live region.
   - serious: `<dl>` panel rute berisi elemen selain `dt`/`dd`. Tombol "Ganti" kini
     dibungkus `dd`.
4. **Admin di HP** (NFR-COMP-03). Di iPhone 13 (390 px), header Admin melebar ke 661 px
   sehingga halaman Penutupan bergeser ke samping. Kolom utama sekarang `minmax(0, 1fr)`,
   pemilih venue bisa menyusut, dan nama akun disembunyikan secara visual di layar sempit
   (tetap terbaca pembaca layar).

## Muat awal Visitor: "Snapshot ringan"

### Sebelum (awal T-412)

Rincian waktu pada 4G dengan CPU 4×, kunjungan pertama, dari Resource Timing dan profil CPU:

| Waktu | Kejadian |
| --- | --- |
| 0–0,7 s | HTML dan bundel JS (620 kB terkompresi) |
| 0,7–1,5 s | Aplikasi berjalan; snapshot baru diminta setelah itu |
| 1,5–3,1 s | Unduh snapshot 1,8 MB (graf jalur ±90% isinya) |
| 3,1–4,0 s | Validasi zod snapshot (±250 ms), pembuatan indeks, lalu permintaan penutupan jalur dan worker peta (berurutan) |
| 4,0–4,9 s | Peta menggambar 200 fitur lantai awal |

### Perbaikan yang dikerjakan (keputusan pemilik 2026-10-05)

1. **Graf jalur terpisah.**
   - Publish (dan pemulihan layanan oleh license-service) menulis `v{n}.graph.json` (tetap,
     immutable) dan `latest.json` tanpa graf, yang berisi `graphPath`. `v{n}.json` tetap lengkap
     untuk rollback, diff, dan pemulihan.
   - Ukuran `latest.json` venue besar turun dari 1,8 MB ke 175 kB terkompresi.
   - Visitor menampilkan peta dari inti snapshot, lalu memuat graf di latar belakang.
   - Rute dan penutupan jalur memakai graf begitu tersedia. Sebelum itu panel rute menampilkan
     "Menyiapkan rute…"; bila gagal, muncul pesan dengan tombol coba lagi.
   - Service worker menyimpan graf dengan CacheFirst. Info Point mengunduh graf versi baru
     sebelum memasangnya, sehingga rute tetap jalan tanpa jaringan.
   - `latest.json` lama yang masih berisi graf tetap terbaca.
2. **Unduh snapshot sejak HTML.** Skrip kecil di `index.html` memulai `fetch` `latest.json`
   bersamaan dengan bundel JS, dan `loadSnapshot` memakai respons itu.
3. **Validasi ringan.** Visitor memeriksa versi skema dan bentuk atas snapshot dan graf
   (`parsePublishedSnapshot`, `parsePublishedGraph`), karena isinya dibangun dan divalidasi di
   server. Validasi zod penuh tetap dipakai untuk pratinjau draft.
4. **Permintaan paralel.** Penutupan jalur dipramuat bersamaan dengan snapshot.

### Hasil (median 5 kali, `tests/perf/results/visitor-load.json`)

| Profil | Muat awal | Kunjungan ulang |
| --- | --- | --- |
| 4G, CPU 4× | 3,1 s (awal 4,9 s) | 2,4 s (awal 3,1 s) |
| Slow 4G, CPU 4× | 6,4 s (awal 14,9 s) | 2,4 s (awal 3,0 s) |
| 4G, CPU 1× (pembanding) | 1,7 s | 0,9 s |

### Selisih yang tersisa dan rencana

Sisa waktu kunjungan ulang adalah kerja CPU, karena semua berkas sudah dari cache:

- render awal React: ±460 ms;
- pembuatan peta: ±130 ms;
- kode native (layout dan WebGL): ±1,2 s.

Kontainer uji tidak punya GPU, jadi WebGL dirender di CPU (SwiftShader) dan ikut diperlambat
4×; di HP sungguhan pekerjaan itu dikerjakan GPU. Angka CPU 1× (0,9 s) menunjukkan batas
bawahnya.

Rencana, tanpa menurunkan target:

1. **Ukur di HP kelas menengah sungguhan** (Android 10+, misalnya Samsung A-series) memakai
   spec yang sama lewat remote debugging. Bila hasilnya ≤ 1,5 s, target terpenuhi; selisih di
   sini berasal dari emulasi.
2. **Bila belum:**
   - simpan indeks pencarian hasil olahan di IndexedDB per versi snapshot;
   - tunda pembuatan daftar A–Z dan chip sampai peta tampil.

## Uji beban (k6, `tests/perf/k6/load.js`)

Skenario:

- **Pengunjung.** Naik bertahap ke 200 dalam 1 menit, bertahan 2 menit. Setiap iterasi:
  halaman Visitor, `latest.json`, berkas graf, dan penutupan aktif, semuanya tanpa cache
  (kasus terburuk), dengan jeda 10–30 s.
- **Admin.** 20 pengguna. Setiap iterasi: daftar venue, fitur satu lantai, lokasi, dan simpan
  deskripsi lokasi, dengan jeda 3–7 s.

| Metrik | Hasil |
| --- | --- |
| Request gagal | 0 dari 9.440 |
| API (REST, termasuk tulis) p95 | 12 ms |
| Halaman p95 | 8 ms |
| `latest.json` (175 kB terkompresi) p95 | 67 ms (sebelum snapshot ringan: 1,8 MB, 246 ms) |
| Berkas graf (1,6 MB terkompresi) p95 | 219 ms |
| CPU kontainer (puncak) | web/Caddy ±75%, storage ±65%, db ±5% dari satu inti |

Run awal (sebelum snapshot ringan) dengan 200 pengunjung tiba pada detik yang sama tetap 0%
gagal, tetapi unduhan snapshot p95 naik ke 12 detik. Penyebabnya, Caddy mengompresi 7,4 MB JSON
untuk setiap permintaan. Kini `latest.json` hanya 1,1 MB mentah, dan graf diunduh setelah peta
tampil. Bila lonjakan serentak tetap terlalu berat di server klien, berkas graf bisa disimpan
dalam bentuk sudah terkompresi.

## Matriks browser (`tests/perf/playwright.compat.config.ts`)

Isi uji per browser:

- **Visitor:** peta tampil, cari "Radiologi", lalu rute dari titik asal.
- **Admin:** masuk, lalu editor peta.
- **HP:** Admin Penutupan tanpa geser horizontal.

| Proyek | Mesin (bawaan Playwright 1.56.1) | Hasil |
| --- | --- | --- |
| chromium (Chrome, Edge) | Chromium | Lulus |
| webkit (Safari desktop) | WebKit | Lulus |
| android (Pixel 7) | Chromium mobile | Lulus (Visitor + Penutupan) |
| iphone (iPhone 13) | WebKit mobile | Lulus (Visitor + Penutupan, setelah perbaikan header) |
| firefox | Firefox | Tidak terverifikasi: Firefox headless di kontainer tanpa GPU tidak menyediakan WebGL |

Celah dan rencana:

- **Firefox tanpa WebGL.** Visitor menampilkan "Terjadi kesalahan" umum, dan pencarian ikut
  tidak tersedia.
  - Rencana: deteksi WebGL di `map-core`, lalu tampilkan pesan "Perangkat ini tidak mendukung
    peta" sambil tetap menyediakan pencarian dan daftar langkah rute. Ini penting juga untuk PC
    Info Point dengan GPU lama.
  - Firefox sungguhan dengan GPU diuji manual sebelum rilis.
- **Belum diuji.** Edge bermerek, Safari dan iOS fisik (iOS 15), Android 10 fisik, dan versi
  browser "dua terbaru" selain yang dibawa Playwright 1.56.1.
  - Rencana: daftar periksa manual atau layanan perangkat nyata sebelum rilis R4. Daftar
    periksanya disusun dari alur di spec kompatibilitas.

## Aksesibilitas (`tests/perf/specs/a11y.perf.ts`)

- **Cakupan:** `@axe-core/playwright` 4.11, aturan WCAG 2.0/2.1 A dan AA.
- **Halaman:** 15 halaman.
  - Visitor: awal ID, awal EN, kartu lokasi, rute.
  - Info Point 1080 × 1920.
  - Admin: masuk, Venue, Lokasi, Penutupan, Titik Asal, Publish, Pengaturan, Pengguna, Lisensi,
    editor peta.
- **Hasil akhir:** 0 pelanggaran di semua tingkat, setelah perbaikan 3 di atas.
- **Batas:** kontras dan target sentuh di dalam kanvas peta tidak diperiksa axe. Keduanya
  sudah diuji di T-006 dan T-408.

`@axe-core/playwright` (MPL-2.0) menjadi devDependency `tests/perf` saja, tidak ikut produk
(keputusan pemilik 2026-10-05).
