# T-317 · 3D lebih realistis — bukti

Gambar dari Mal Demo Sentosa (`pnpm db:seed-demo`) di Visitor lokal (2026-10-03).

| Gambar | Isi |
| --- | --- |
| [01](01-mal-3d-desktop.png) | Desktop 3D: pelat lantai dari footprint gedung, unit berwarna kategori diekstrusi 4 m dengan tepi atas terang (`#f7f8fa`), cahaya lembut miring (`LIGHT_3D`) membuat sisi sedikit lebih gelap |
| [02](02-mal-3d-hp.png) | HP 3D: mal 220 × 40 m diputar 90° di bingkai awal (`fitBearing`) sehingga mengisi layar tegak; tombol utara tetap mengembalikan arah |
| [03](03-mal-2d-hp.png) | HP 2D: bingkai awal yang sama |

Pilihan 2D/3D tetap. Diuji unit: `fitBearing` dan kamera awal (Visitor, 5 test), cahaya dan warna tepi (map-core). Seluruh spec Visitor (19) lulus.

## Temuan

- Sekali saat suite Visitor: `search.spec.ts` "mengetuk unit di peta" gagal (profil tidak terbuka setelah ketukan); tidak terulang di 6 ulangan dan run penuh berikutnya. Dipantau di T-320.
