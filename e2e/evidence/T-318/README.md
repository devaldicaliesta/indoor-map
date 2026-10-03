# T-318 · Rute beranimasi — bukti

Gambar dari Mal Demo Sentosa (`pnpm db:seed-demo`): rute Sepatu Jaya (GF) → Dapur Peranakan (L2) lewat tautan `?from=&to=` (2026-10-03).

| Gambar | Isi |
| --- | --- |
| [01](01-rute-desktop-3d.png) | Desktop 3D: garis rute bertepi putih dengan garis aliran putih putus-putus di atasnya; putusnya bergeser searah rute selama 8 detik setiap rute berganti, lalu diam |
| [02](02-rute-hp.png) | HP 2D: rute yang sama, penanda asal (cincin) dan tujuan (bulat penuh), ikon lift tempat naik |

Animasi berhenti bila tab tersembunyi dan tidak berjalan sama sekali dengan `prefers-reduced-motion`. Diuji unit: layer `route-flow` di atas garis rute dan pola putus yang berulang (map-core, 6 test rute). Spec E2E rute Admin (T-201–T-204, T-209) dan Visitor (T-213–T-217) lulus.

## Temuan

- Animasi tanpa batas waktu membuat `page.screenshot` di T-216 (jam palsu Playwright) habis waktu dan menguras baterai HP; animasi kini dibatasi 8 detik per perubahan rute.
