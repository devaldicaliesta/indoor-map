# T-118 · Visitor: peta, gedung, lantai — bukti E2E

Spec: `e2e/tests/visitor/verify/T-118-visitor-floors.spec.ts` (fixture `fullVenue` terbit, HP 360 × 740, tanpa login). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-gedung-utama-gf.png) | Tampilan default: Gedung Utama, GF aktif; pemilih lantai L2/L1/GF urut atas-bawah, tiap tombol ≥ 44 px |
| [02](02-lantai-l1.png) | L1: `aria-pressed`, peta memuat lantai lain (`data-floor-id` berubah) |
| [03](03-gedung-timur.png) | Pindah ke Gedung Timur: gedung satu lantai, pemilih lantai disembunyikan; jalur Area Luar tampil bersama lantai dasar |

Area Luar tidak menjadi pilihan di pemilih gedung (sesuai langkah 2 T-118: tampil bersama lantai dasar).

## Temuan

- [SEDANG] Di HP 360 px, tampilan awal membingkai seluruh venue sehingga gedung yang dipilih tampak kecil di sisi kiri dengan ruang kosong lebar (gambar 01, 02), dan label di tepi bisa terpotong (lihat T-104). Pembingkaian kamera awal per gedung perlu ditinjau. Dicatat di PROGRESS.
