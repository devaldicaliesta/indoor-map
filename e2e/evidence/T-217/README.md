# T-217 · Visitor: bagikan — bukti E2E

Spec: `e2e/tests/visitor/verify/T-217-visitor-share.spec.ts` (fixture `fullVenue` dipublish). Hasil: **lulus 3 run beruntun** (2026-10-02).

Web Share API diganti tiruan yang mencatat URL; "perangkat lain" adalah konteks browser baru (desktop, tanpa penyimpanan dari konteks pertama).

| Gambar | Langkah |
| --- | --- |
| [01](01-bagikan-rute.png) | HP, bahasa EN, rute aksesibel GF-B08 → L1-B08 → "Share": URL berisi `from`, `to`, `a11y=1`, `lang=en` |
| [02](02-rute-di-perangkat-lain.png) | Dibuka di konteks lain: From GF-B08, To L1-B08, aksesibel tercentang, langkah lewat elevator, teks EN |
| [03](03-lokasi-di-perangkat-lain.png) | Detail Radiologi → "Share" (`loc=`): konteks lain membuka profil Radiologi |
| [04](04-disalin.png) | Tanpa Web Share API: "Link copied", isi clipboard sama dengan tautan |

## Temuan

Tidak ada.
