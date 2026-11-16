# T-553 · Fasilitas terdekat dan rute multi-tujuan — bukti E2E

Spec: `e2e/tests/visitor/f2/T-553-nearest-multistop.spec.ts`, proyek `visitor` (HP 360 × 740).
Hasil: **2 lulus** di CI E2E PR #120 (run 43795984460, 2026-11-16). Test case: TC-NVX-05, 06.

| Gambar | Langkah |
| --- | --- |
| [01](01-daftar-toilet.png) | "Anda di sini: Lobi Utama", chip Toilet: 3 tempat dan tombol "Rute ke Toilet terdekat" |
| [02](02-toilet-terdekat-dari-lobi.png) | Dari Lobi Utama: toilet GF, "± 1 menit · 40 m" |
| [03](03-toilet-terdekat-dari-l2.png) | Titik asal L2-B07: toilet L2, "± 1 menit · 30 m" (bukan toilet GF) |
| [04](04-rute-tiga-tujuan.png) | Rute tiga tujuan: langkah per segmen sampai "Ke L2-A06 (3/3)" |
| [05](05-tujuan-dihapus.png) | Satu tujuan dihapus: tersisa Radiologi (1/2) dan L2-A06, "± 3 menit · 155 m · GF L2" |

Catatan pemeriksaan gambar:
- [04](04-rute-tiga-tujuan.png) bergeser ke kiri (kolom cari terpotong) dengan ruang kosong besar
  di atas dan bawah. Perlu dicek apakah ini artefak screenshot atau overflow horizontal saat
  daftar langkah panjang di HP.
- Daftar "Toilet · 3 tempat" di [01](01-daftar-toilet.png) memuat "Musala"; perlu dicek apakah
  data uji atau pengelompokan fasilitas.

| ID | Hasil |
| --- | --- |
| TC-NVX-05 | Lulus (E) |
| TC-NVX-06 | Lulus (E) |
