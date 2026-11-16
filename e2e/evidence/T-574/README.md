# T-574 · Papan "Anda di sini" dan stiker QR lokasi — bukti E2E

Spec: `e2e/tests/admin/f2/T-574-boards-stickers.spec.ts`, proyek `admin` (Visitor di halaman HP
tambahan). Hasil: **lulus** di CI E2E PR #113 dan #120 (run 43795984460, 2026-11-16). Test case:
TC-PAR-11, 12.

| Berkas | Langkah |
| --- | --- |
| [01](01-dialog-papan.png) | Titik Asal → "Papan" untuk Lobi Utama: pilihan A4/A3/A2, isi dari peta yang terakhir dipublish |
| [02](02-papan-lobi-a3.pdf) | Papan A3 potret, 1 halaman (841,89 × 1190,55 pt) |
| [03](03-visitor-dari-qr-papan.png) | URL dari QR papan membuka Visitor dengan "Anda di sini: Lobi Utama" |
| [04](04-papan-massal-gf-a3.pdf) | "Cetak papan massal" lantai GF: 2 halaman A3 (satu per titik asal) |
| [05](05-dialog-stiker.png) | "Stiker QR lokasi": DataTable dengan cari dan "Pilih semua hasil (23)" |
| [06](06-stiker-a4.pdf) | Lembar stiker 5 × 5 cm di A4, 2 halaman |
| [07](07-visitor-dari-stiker.png) | URL dari QR stiker membuka lokasi lalu meminta titik asal ("Anda sedang di mana?") |

| ID | Hasil |
| --- | --- |
| TC-PAR-11 | Lulus (E) |
| TC-PAR-12 | Lulus (E) |
