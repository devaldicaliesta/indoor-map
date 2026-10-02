# T-108 · Editor peta: kanvas, alat gambar, draft — bukti E2E

Spec: `e2e/tests/admin/verify/T-108-editor-draw.spec.ts`. Hasil: **lulus 3 run beruntun** (2 test, 2026-10-02).
Test case: kriteria T-108 (poligon/garis/titik tersimpan dengan koordinat, muat ulang, 1.000 fitur, Visitor tidak melihat draft).

| Gambar | Langkah |
| --- | --- |
| [01](01-digambar.png) | Editor menggambar poligon (unit), garis (dinding, klik ganda), titik (pintu); status "Tersimpan"; DB +3 fitur (Polygon, LineString 2 titik, Point). Unit baru menumpuk unit lama → validasi "2 temuan" muncul |
| [02](02-setelah-muat-ulang.png) | Setelah muat ulang semua fitur tetap ("5 fitur") |
| [03](03-visitor-tanpa-draft.png) | Visitor tetap memakai snapshot terbit (2 unit) sebelum publish |
| [04](04-1000-fitur.png) | 1.000 unit di satu lantai |

**Kinerja (NFR-PERF-03)**, diukur dengan `requestAnimationFrame` selama peta diseret, di kontainer tanpa GPU (SwiftShader): lantai L1 kosong ±18–19 fps, lantai dengan 1.000 unit ±9–13,5 fps (±50–70 % pembanding); lantai 1.000 fitur terbuka dalam ±0,8 s. Test memakai ambang relatif (≥ 35 % dari lantai kosong di mesin yang sama) karena angka mutlak bergantung GPU.

## Temuan

- [SEDANG, belum dibuktikan di perangkat nyata] Menyeret peta dengan 1.000 fitur menurunkan frame rate menjadi ±50–70 % dibanding lantai kosong (SwiftShader). Kelancaran di laptop dengan GPU perlu dicek manual atau di CI dengan GPU sebelum NFR-PERF-03 dianggap terpenuhi. Dicatat di PROGRESS.
- [RENDAH] Lencana jumlah di tab "Titik masuk" (mis. "1000") mendorong tab "Uji rute" sehingga terpotong di panel kiri (gambar 01, 04).
- [Catatan] Kunci edit per lantai bekerja: saat Editor membuka GF, penulisan fitur lewat repository Super Admin ke GF ditolak "tidak memiliki izin" (diuji lengkap di T-301).
