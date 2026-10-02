# T-214 · Visitor: titik asal — bukti E2E

Spec: `e2e/tests/visitor/verify/T-214-visitor-origin.spec.ts` (fixture `fullVenue` dipublish, Visitor HP). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-pilih-asal.png) | Radiologi → "Rute ke sini": "Anda sedang di mana?" dengan pilihan cari atau "Ketuk di peta" |
| [02](02-asal-dari-daftar.png) | Cari GF-B08 → detail → "Saya di sini": Dari GF-B08, Ke Radiologi, langkah rute tampil |
| [03](03-asal-ketuk-peta.png) | "Ganti" → "Ketuk di peta" → ketuk koridor: Dari "Titik di peta", rute dihitung ulang |
| [04](04-asal-qr.png) | `?o=<kode Lobi Utama>`: "Anda di sini: Lobi Utama" |

## Temuan

Tidak ada yang baru (bingkai kamera rute di HP yang terpotong di kanan sudah tercatat di T-118).
