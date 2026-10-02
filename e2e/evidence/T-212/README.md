# T-212 · QR titik asal — bukti E2E

Spec: `e2e/tests/admin/verify/T-212-origin-qr.spec.ts` (fixture `fullVenue`, role Editor; URL publik Visitor diarahkan ke Visitor lokal selama test lalu dikembalikan). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-dialog-tambah.png) | Tambah titik asal: nama, GF Gedung Utama, klik peta, Putar +15° dua kali → 30 |
| [02](02-daftar.png) | Tersimpan dan menempel ke jalur; diubah ke 90°. "PDF A6" dan "PNG" mengunduh `qr-lobi-umum-selatan.pdf/.png` dengan signature `%PDF` / PNG |
| [03](03-visitor-dari-qr.png) | "Coba" (tautan yang sama dengan isi QR, `?o=<kode>`) membuka Visitor: "Anda di sini: Lobi Ümum Selatan", lantai GF, peta diputar sesuai arah hadap 90° (gedung yang mendatar di Admin tampil tegak, garis arah ke atas) |
| [04](04-dihapus.png) | Hapus dengan konfirmasi: baris hilang, "Lobi Utama" milik fixture tetap ada |

Isi QR tidak didekode di test (tanpa dependensi pembaca QR); tautannya sama dengan tombol "Coba" (`originPointUrl`, diuji unit di `qr-print.test.ts`).

## Temuan

Tidak ada.
