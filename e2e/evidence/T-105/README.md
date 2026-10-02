# T-105 · Unggah denah PNG/JPG/PDF — bukti E2E

Spec: `e2e/tests/admin/verify/T-105-floor-plans.spec.ts`; berkas uji dibuat di test (`e2e/support/plan-files.ts`: denah PNG/JPG digambar di kanvas, PDF 2 halaman ditulis langsung). Hasil: **lulus 3 run beruntun** (2026-10-02).
Test case: kriteria T-105 (PNG/JPG/PDF dengan pilih halaman, riwayat versi, tipe salah ditolak).

| Gambar | Langkah |
| --- | --- |
| [01](01-belum-ada-denah.png) | Lantai GF tanpa denah |
| [06](06-tipe-salah.png) | `.txt` ditolak "Tipe berkas tidak didukung…", `.dwg` ditolak dengan arahan simpan sebagai DXF/PDF; tombol tetap nonaktif |
| [02](02-png-aktif.png) | PNG dijadikan denah aktif, toast |
| [03](03-pdf-pilih-halaman.png) | PDF 2 halaman: pilih "Halaman 2 dari 2", pratinjau halaman 2 |
| [04](04-riwayat-versi.png) | Aktif: PDF halaman 2; riwayat JPG dan PNG. DB: 3 versi, aktif `pdf` halaman 2 |

## Temuan

- [RENDAH] Input berkas memakai tombol bawaan browser "Choose File" (bahasa Inggris) di UI Admin berbahasa Indonesia (gambar 03); juga di formulir logo venue. Dicatat.
- [RENDAH] Riwayat hanya menampilkan jam:menit, sehingga beberapa unggahan dalam menit yang sama tidak bisa dibedakan urutannya selain dari posisi baris.
