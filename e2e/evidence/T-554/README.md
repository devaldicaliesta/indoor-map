# T-554 · Konten multi-bahasa — bukti E2E

Spec: `e2e/tests/admin/f2/T-554-content-translation.spec.ts`, proyek `admin` (Visitor dibuka di
halaman HP tambahan). Hasil: **lulus** di CI E2E PR #120 (run 43795984460, 2026-11-16), setelah
dialog kategori dibuat bisa di-scroll (commit `0b1a86e`). Test case: TC-NVX-07.

| Gambar | Langkah |
| --- | --- |
| [01](01-kategori-english.png) | Lokasi → Tipe lokasi → ubah kategori "Pemeriksaan": Nama (English) "Examination" |
| [02](02-deskripsi-english.png) | Ubah lokasi Radiologi: Deskripsi English "X-ray and CT scan." |
| [03](03-visitor-en.png) | Setelah publish, Visitor EN: kategori "Examination", deskripsi "X-ray and CT scan." |
| [04](04-visitor-en-jatuh-ke-id.png) | Deskripsi English dikosongkan: Visitor EN jatuh ke deskripsi Indonesia "Rontgen dan CT scan." |

Catatan pemeriksaan gambar: [01](01-kategori-english.png) diambil saat animasi dialog belum
selesai (isi halaman di belakang dialog tampak tembus) dan sebelum perbaikan scroll dialog.

| ID | Hasil |
| --- | --- |
| TC-NVX-07 | Lulus (E) |
