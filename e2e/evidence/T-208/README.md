# T-208 · Tampilan graf — bukti E2E

Spec: `e2e/tests/admin/verify/T-208-graph-view.spec.ts` (fixture `testVenue`, dua jalur terpisah). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-legenda-dan-gaya.png) | Legenda "Graf jalur"; edge panjang ditandai tidak aksesibel → garis putus-putus; jalur pendek terpisah bercincin terisolasi, legenda "Terisolasi 2" |
| [02](02-edge-disembunyikan.png) | Sakelar Edge mati: edge hilang dan klik di atasnya tidak memilih edge; dinyalakan lagi → bisa dipilih |
| [03](03-node-disembunyikan.png) | Sakelar Node mati: node hilang dan klik ujung jalur tidak memilih node; dinyalakan lagi → bisa dipilih |
| [04](04-legenda-diciutkan.png) | "Sembunyikan legenda": daftar gaya disembunyikan, sakelar Node/Edge tetap ada |

Gaya tertutup (merah berarsir) diuji di T-211.

## Temuan

- RENDAH: Escape tidak melepas seleksi edge ketika fokus masih di checkbox panel properti (perlu klik peta). Wajar untuk kontrol form, tidak diubah.
