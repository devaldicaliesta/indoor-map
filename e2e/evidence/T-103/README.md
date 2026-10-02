# T-103 · Lantai dan default tampilan — bukti E2E

Spec: `e2e/tests/admin/verify/T-103-floors.spec.ts` (fixture `testVenue`, login Admin). Hasil: **lulus 3 run beruntun** (2026-10-02).
Test case: TC-VEN (CRUD lantai, urutan level termasuk basement, validasi, lantai default).

| Gambar | Langkah |
| --- | --- |
| [06](06-error-validasi.png) | Nama kosong, level 1.5, tinggi 40 m ditolak dengan pesan per kolom |
| [03](03-lantai-urut-level.png) | L2, B1 (−1), "L1 Mezanin Ümmü" ditambah tidak berurutan → tabel urut level (atas ke bawah); semua kolom terlihat; DB: B1 level −1, 3 m |
| [04](04-diubah-default.png) | B1 dijadikan default (DB `defaultFloorId`), L2 diubah menjadi "L2 Atap" |
| [05](05-dihapus.png) | L2 Atap dihapus dari daftar dan DB |

## Temuan

- [SEDANG] **Panel Lantai (640 px) memotong tabel**: kolom Level dan tombol "Hapus" berada di luar panel dan hanya terlihat dengan gulir mendatar. **Diperbaiki:** panel 48rem (dibatasi lebar layar) dan nama lantai membungkus; dijaga cek lebar tabel dan "Hapus" harus terlihat.
