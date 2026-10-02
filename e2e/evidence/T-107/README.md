# T-107 · Lapisan acuan lantai lain — bukti E2E

Spec: `e2e/tests/admin/verify/T-107-reference-floor.spec.ts` (fixture `fullVenue`, login Editor). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-l1-tanpa-acuan.png) | Editor Peta lantai L1 tanpa acuan |
| [02](02-l1-dengan-acuan-gf.png) | "Acuan: Lantai GF": GF tampil samar (garis putus-putus), lift/eskalator/tangga GF ditonjolkan kuning |

Dibuktikan: kanvas berubah saat acuan dipilih dan kembali persis sama saat dilepas; daftar fitur dan hitungan "N fitur" tetap milik L1 (fitur GF tidak ikut bisa dipilih/disunting); lantai yang sedang dibuka tidak ditawarkan sebagai acuan.

Belum dibuktikan langsung: klik pada fitur acuan tidak memilihnya (tata letak L1 menutupi GF di venue uji). Dicatat.

## Temuan

Tidak ada.
