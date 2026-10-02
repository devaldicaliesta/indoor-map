# T-202 · Routing: konektor — bukti E2E

Spec: `e2e/tests/admin/verify/T-202-routing-connectors.spec.ts` (fixture `fullVenue`: lift GF–L1 saja, eskalator naik/turun GF–L1, tangga GF–L2, jalur Area Luar). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-gf-ke-l1.png) | GF-A01 → L1-B08: "105 m · 13 langkah", "Naik eskalator ke L1", chip lantai berganti GU GF → GU L1 |
| [02](02-gf-ke-l2-tangga.png) | GF-A01 → L2-B08: lewat tangga (satu-satunya konektor GF–L2) |
| [03](03-lintas-gedung.png) | GF-A01 → GT-B03: "Keluar dari Gedung Utama" (Area Luar) → "Masuk ke Gedung Timur" (GT GF) |

## Temuan

Tidak ada.
