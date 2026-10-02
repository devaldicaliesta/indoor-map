# T-201 · Routing: graf dan A* — bukti E2E

Spec: `e2e/tests/admin/verify/T-201-routing-astar.spec.ts` (helper `e2e/support/test-route.ts`, fixture `fullVenue`, Editor Peta → Uji rute). Hasil: **lulus 3 run beruntun** (2026-10-02). Unit test paket `@indoor/routing` lulus (lihat jumlah di commit).

| Gambar | Langkah |
| --- | --- |
| [01](01-rute-satu-lantai.png) | GF-A01 → GF-B08: "78 m · 7 langkah", garis rute di peta mengikuti koridor, langkah terakhir "Tiba di GF-B08" |
| [02](02-rute-pendek.png) | GF-A01 → GF-A02 (bersebelahan): jarak lebih pendek dari rute sebelumnya |

Tukar asal dan tujuan menghasilkan jarak yang sama (rute simetris).

## Temuan

- [RENDAH] Panel Uji rute sempit: keterangan tempat terpotong ("Unit · Gedung …"). Dicatat.
