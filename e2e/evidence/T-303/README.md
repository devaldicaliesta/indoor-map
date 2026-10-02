# T-303 · Tipe lokasi dan field kustom — bukti E2E

Spec: `e2e/tests/admin/verify/T-303-location-types.spec.ts` (fixture `testVenue`, role Admin). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-validasi-field.png) | Tipe "Ruang Ümum Uji" ditambah. Field jenis Pilihan tanpa label dan opsi: "Label wajib diisi.", "Isi minimal satu opsi, satu per baris." |
| [02](02-enam-field.png) | Enam jenis field: Teks (wajib), Angka, Pilihan (Karpet/Keramik), Jam operasional (teks), Gambar, Tautan; kunci dibuat dari label; DB sama (label, jenis, wajib, opsi) |
| [03](03-urutan.png) | "Naikkan Kapasitas": urutan DB Kapasitas lalu Telepon, tetap setelah muat ulang |
| [04](04-field-wajib.png) | Form lokasi bertipe itu menampilkan field kustom; simpan tanpa Telepon ditolak "Telepon wajib diisi."; setelah diisi lokasi tersimpan |
| [05](05-field-dihapus.png) | Hapus field "Situs" dengan konfirmasi: tinggal 5 field |

Urutan juga bisa diubah dengan seret (pegangan di kiri baris); test memakai tombol naik/turun yang memanggil penyimpanan urutan yang sama.

## Temuan

Tidak ada.
