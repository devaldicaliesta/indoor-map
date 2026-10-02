# T-104 · Fondasi peta (map-core) — bukti E2E

Spec: `e2e/tests/visitor/verify/T-104-map-core.spec.ts` (fixture `fullVenue` diterbitkan: 2 gedung, GF/L1/L2, puluhan fitur). Hasil: **lulus 3 run beruntun** (2 test, 2026-10-02).
Test case: kriteria T-104 (peta tampil, zoom, rotasi, 2D/3D, kontrol peta), target sentuh ≥ 44 px.

Perubahan tampilan dibuktikan dengan membandingkan gambar kanvas saat kamera diam (`data-camera="idle"`), bukan hanya status tombol.

| Gambar | Langkah |
| --- | --- |
| [01](01-peta-awal.png) | Visitor HP: peta GF Gedung Utama, pemilih gedung/lantai, kontrol peta |
| [02](02-diperbesar.png) | "Perbesar": kanvas berubah; "Perkecil" kembali |
| [03](03-diputar.png) | Shift+← tiga kali di kanvas: peta berputar, ikon kompas ikut berputar; "Arahkan ke utara" mengembalikan ke 0° |
| [04](04-3d.png) | 3D: `aria-pressed`, kanvas berubah (ekstrusi); kembali ke 2D |
| [05](05-tampilan-awal.png) | Geser dengan panah lalu "Kembali ke tampilan awal" |
| [06](06-admin-editor.png) | Admin (Editor): kanvas Editor Peta siap dengan 39 fitur dan graf jalur |

Semua kontrol peta (perbesar, perkecil, utara, tampilan awal) ≥ 44 px.

## Temuan

- [RENDAH] Di HP 360 px tampilan awal menaruh gedung dekat tepi kiri sehingga label "Radiologi" terpotong (gambar 01); gedung juga tampak kecil. Perlu ditinjau bersama pembingkaian kamera di T-118. Dicatat.
