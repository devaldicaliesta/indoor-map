# T-599a · Tur panduan: fondasi, Lokasi, Visitor, Info Point — bukti E2E

Spec: `e2e/tests/admin/f2/T-599-tour.spec.ts` (project `admin`, 1440 × 900) dan
`e2e/tests/visitor/f2/T-599-tour.spec.ts` (project `visitor`: HP 360 × 740 berbahasa Inggris,
Info Point 1080 × 1920). Server dev memakai `VITE_TOUR_AUTOSTART=off`; spec ini menyalakan tur
otomatis per perangkat (`e2e/support/tour.ts`). Hasil: **5 lulus**, stabil dua run berturut-turut
(Supabase lokal, 2026-10-26).

| Gambar | Langkah | Test case |
| --- | --- | --- |
| [01](01-admin-tur-mulai-sendiri.png) | Admin baru membuka Lokasi: tur mulai sendiri, "1 dari 7" | TC-TUR-01 |
| [02](02-admin-langkah-cari-saring.png) | Langkah "Cari dan saring" menyorot toolbar tabel; tombol Lewati/Kembali/Lanjut bertema token, fokus di Lanjut | TC-TUR-09 |
| [03](03-viewer-tanpa-tombol-tulis.png) | Viewer: 5 langkah, tanpa "Tambah lokasi" dan "Import" | TC-TUR-04 |
| [04](04-visitor-en-mulai-sendiri.png) | Visitor HP berbahasa Inggris: "Welcome", nama venue, "1 of 7", Skip | TC-TUR-06 |
| [05](05-visitor-en-sheet-setengah.png) | Sheet dibuka setengah sebelum langkah chip; chip yang ditunjuk tersorot | TC-TUR-06 |
| [06](06-info-point-cara-pakai.png) | Info Point: tur hanya lewat tombol "Cara pakai" | TC-TUR-07 |

Langkah lain di spec:
- TC-TUR-02: setelah tur dilewati (Esc), `tour_progress` berisi `locations@1`; muat ulang dan
  browser lain dengan akun yang sama tidak menampilkan tur lagi.
- TC-TUR-03: tombol "Tur halaman" mengulang dari langkah 1 sampai "Selesai".
- TC-TUR-05: venue tanpa lokasi (tabel kosong, tanpa pagination) → 6 langkah, tur tidak macet.
- TC-TUR-06: `localStorage` status diblokir → tur tampil sekali, dilewati, tidak muncul lagi
  setelah halaman dirender ulang dalam sesi itu, tanpa layar galat.
- TC-TUR-07: Info Point tidak memulai tur walau tur otomatis menyala di perangkat itu; tur yang
  terbuka tertutup saat sesi idle direset (`data-session` berganti).
- TC-TUR-08: di HP, tidak ada permintaan berkas driver.js sebelum tur dimulai; berkasnya diunduh
  saat "How to use the map" ditekan. Build produksi: driver.js dan tema tur ada di chunk
  `run-tour-*.js` (±9 kB gzip) yang tidak dirujuk bundel awal dan dikecualikan dari precache
  service worker.
- TC-TUR-09: panah kanan/kiri berpindah langkah, Tab berputar di Lewati/Kembali/Lanjut, Esc
  menutup; kontras teks dan tombol ≥ 4,5:1; dijalankan dengan `prefers-reduced-motion`.

Lapisan lain:
- **U** `packages/ui/test/tour-steps.test.ts` (5): `resolveTourSteps` (role, elemen hilang, urutan).
- **U** `apps/visitor/src/app/tour-store.test.ts` (3): status per perangkat, penyimpanan diblokir,
  isi rusak.
- **D** `supabase/tests/tour_progress.test.sql` (10, TC-SEC-73): hanya pemilik yang membaca dan
  menulis, tidak bisa atas nama orang lain atau memindahkan pemilik, tanpa delete, anon ditolak.
- **I** `packages/data/test/integration/tours.test.ts` (2, TC-TUR-02): status terbaca dari sesi lain
  akun yang sama, akun lain tidak terpengaruh, kunci tanpa versi ditolak.

| ID | Hasil |
| --- | --- |
| TC-TUR-01 s.d. 09 | Lulus (untuk halaman Lokasi, peta venue, dan Info Point) |
| TC-TUR-10, 11 | Di T-599b |
| TC-SEC-73 | Lulus |
