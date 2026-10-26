# T-313 · Konversi denah CAD — bukti E2E

Spec: `e2e/tests/license/cad-floor-plan.spec.ts` (sejak T-514 di project `license`, karena spec
memasang lisensi dev berfitur `cad_import` lalu memulihkannya; butuh `services/cad-converter`
berjalan dan `VITE_CAD_CONVERTER_URL`). Hasil: **lulus** (Supabase lokal, 2026-10-02; ulang
2026-10-26 di T-514). Berkas
contoh: `e2e/files/denah-contoh.dxf` (40 × 20 m, milimeter, layer DINDING/PINTU/TEKS/FURNITUR/GRID).

| Gambar | Langkah |
| --- | --- |
| [01](01-dwg-ditolak.png) | DWG ditolak dengan arahan simpan sebagai DXF/PDF |
| [02](02-semua-layer.png) | DXF dibuka: 5 layer, satuan milimeter, pratinjau semua layer |
| [03](03-layer-dipilih.png) | GRID dan FURNITUR dilepas; pratinjau dirender ulang |
| [04](04-denah-aktif.png) | Denah aktif "DXF · 3 layer" |
| [05](05-georeferensi.png) | Tempatkan di peta: skala awal 40 × 20 m dari satuan berkas |

Temuan: garis dinding hasil ezdxf hanya ±0,2 px di raster → tebal garis dibuat tetap 3 px.
Pratinjau/georeferensi diberi penanda siap agar gambar bukti tidak diambil sebelum dirender.
