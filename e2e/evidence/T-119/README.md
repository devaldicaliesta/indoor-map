# T-119 · Visitor: cari, kategori, detail, A–Z — bukti E2E

Spec: `e2e/tests/visitor/verify/T-119-visitor-search.spec.ts` (fixture `fullVenue` terbit, HP 360 px). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-salah-ketik.png) | "radilogi" menemukan Radiologi |
| [02](02-kode-unit.png) | Kode lokasi "RAD-01" dan awalan kode unit "GF-A0" menemukan hasil |
| [03](03-detail.png) | Detail Radiologi: tipe · kategori, gedung · lantai · kode unit, status jam buka, "Rute ke sini", Bagikan, deskripsi, field kustom |
| [04](04-kategori.png) | Chip "Pemeriksaan": Laboratorium (segera buka, belum di peta) dan Radiologi; unit tersorot di peta; chip yang sama menutup |
| [05](05-direktori-az.png) | "Semua lokasi A–Z": terurut abjad dengan pembatas huruf, filter lantai; Apotek Lama (nonaktif permanen) tidak tampil |

Pencarian tanpa hasil menampilkan "Tidak ada hasil untuk …" dan tombol "Buka daftar A–Z".

Juga diperbaiki: `e2e/tests/visitor/search.spec.ts` (temuan lama di `15-verifikasi-e2e.md`) kini mengharapkan "Rute ke sini" aktif sejak T-215; lulus.

## Temuan

- [RENDAH, aksesibilitas] Teks "Tidak ada hasil untuk …" muncul dua kali di DOM (tampilan dan wilayah live untuk pembaca layar); bisa terbaca dua kali. Perlu dicek dengan pembaca layar.
