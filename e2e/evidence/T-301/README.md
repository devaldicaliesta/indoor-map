# T-301 · Kunci edit per lantai — bukti E2E

Spec: `e2e/tests/admin/verify/T-301-edit-lock.spec.ts` (fixture `testVenue`; tiga browser terpisah: Editor, Admin, Super Admin). Hasil: **lulus 3 run beruntun** (2026-10-02).

Heartbeat kunci 60 detik; jam halaman Editor dipalsukan (tetap berjalan) lalu dimajukan 65 detik setelah pengambilalihan.

| Gambar | Langkah |
| --- | --- |
| [01](01-admin-baca-saja.png) | Editor memegang GF. Admin membuka lantai yang sama: "Sedang diedit oleh Editor Lokal sejak …", alat Poligon nonaktif, tanpa "Ambil alih kunci" |
| [02](02-super-admin-sebelum.png) | Super Admin melihat banner yang sama dengan tombol "Ambil alih kunci" |
| [03](03-super-admin-memegang.png) | Setelah ambil alih: banner hilang, alat aktif |
| [04](04-editor-kehilangan-kunci.png) | Heartbeat berikutnya di Editor: "Sedang diedit oleh Super Admin Lokal", "Mode baca", alat nonaktif |

## Temuan

- **Diperbaiki (RENDAH)**: pada mode baca, petunjuk daftar fitur kosong tetap berbunyi "Pilih alat Poligon, Garis, atau Titik di sebelah kiri." padahal alat-alat itu nonaktif. Kini "Belum ada fitur di lantai ini." (`feature-list.tsx` menerima `canEdit`).
