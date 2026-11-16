# T-552 · Estimasi waktu tempuh — bukti E2E

Spec: `e2e/tests/visitor/f2/T-552-travel-time.spec.ts`, proyek `visitor` (HP 360 × 740). Hasil:
**lulus** di CI E2E PR #120 (run 43795984460, 2026-11-16). Test case: TC-NVX-04.

| Gambar | Langkah |
| --- | --- |
| [01](01-rute-biasa-id.png) | Lobi Utama → L1-A04, ID: "± 3 menit · 145 m · GF L1" |
| [02](02-rute-aksesibel-id.png) | Rute aksesibel (kursi roda): "± 5 menit · 155 m", lebih lama dari rute biasa |
| [03](03-rute-biasa-en.png) | Rute yang sama dalam EN: "about 3 min · 145 m" |

| ID | Hasil |
| --- | --- |
| TC-NVX-04 | Lulus (E) |
