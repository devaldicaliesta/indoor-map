# T-203 · Routing: aksesibel, penutupan, titik masuk — bukti E2E

Spec: `e2e/tests/admin/verify/T-203-routing-accessible.spec.ts` (fixture `fullVenue`). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-kursi-roda-lift.png) | GF-A01 → L1-B08: biasa lewat eskalator; "Mode kursi roda" → lewat lift, tanpa eskalator/tangga, berakhir "Tiba di L1-B08" (titik masuk unit) |
| [02](02-tanpa-rute-aksesibel.png) | Kursi roda GF → L2: "Rute kursi roda tidak tersedia — Lantai L2 tidak terhubung lift aksesibel; Tangga Barat tidak bisa dilalui kursi roda" |
| [03](03-lift-ditutup.png) | Penutupan Lift 1 (tanpa waktu selesai): "Rute kursi roda tertutup sementara — Lift 1 ditutup (Perawatan lift)… Tanpa mode kursi roda rute tetap tersedia"; lift bertanda tertutup di peta; tanpa mode kursi roda rute lewat eskalator |

## Temuan

Tidak ada.
