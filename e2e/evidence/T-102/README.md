# T-102 · Gedung dan Area Luar — bukti E2E

Spec: `e2e/tests/admin/verify/T-102-buildings.spec.ts` (fixture `testVenue`, login Admin). Hasil: **lulus 3 run beruntun** (2026-10-02).
Test case: TC-VEN (CRUD gedung + footprint, default tampilan, validasi), Area Luar tidak bisa dihapus (UI dan server).

| Gambar | Langkah |
| --- | --- |
| [01](01-daftar-gedung.png) | Gedung Uji + Area Luar "Selalu ada" tanpa tombol Hapus |
| [06](06-error-validasi.png) | Nama kosong dan kode "R I!" ditolak dengan pesan per kolom |
| [02](02-footprint-digambar.png) | Footprint digambar di peta (4 sudut, tutup di titik awal), titik bisa digeser |
| [03](03-gedung-ditambahkan.png) | Toast "Gedung ditambahkan", status "Digambar"; DB: nama beraksen, poligon 5 titik |
| [04](04-diubah-default.png) | Jadikan default (DB `defaultBuildingId`), nama diubah, terbaca setelah muat ulang |
| [05](05-konfirmasi-hapus.png) | Konfirmasi hapus; gedung hilang dari daftar dan DB |

Server: menghapus lapisan Area Luar lewat repository ditolak (`DataError`), lapisan tetap ada.

## Temuan

- [RENDAH] Pesan galat tetap tampil setelah kolom diperbaiki sampai formulir dikirim ulang (gambar 02, sama dengan T-101).
