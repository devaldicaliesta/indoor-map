# T-110 · Edit geometri, multi-select, snapping — bukti E2E

Spec: `e2e/tests/admin/verify/T-110-edit-geometry.spec.ts` (helper `e2e/support/editor-draw.ts`). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-tiga-unit-snap.png) | Unit B digambar dengan titik pertama 4 px dari sudut A: titik menempel persis (koordinat DB sama); dengan "Snap: mati" titik 4 px tidak menempel |
| [02](02-titik-digeser.png) | Unit A dipilih di kanvas, sudut kiri atas diseret 30 px: geometri di DB berubah |
| [03](03-seleksi-ganda.png) | Shift+klik dua unit di daftar: panel "2 fitur dipilih", "Hapus 2 fitur" → DB tinggal 1 unit |
| [04](04-semua-dihapus.png) | Unit terakhir dipilih dari daftar, tombol Delete → DB 0 unit |

## Temuan

- [Catatan] Urutan titik poligon dinormalisasi saat disimpan (arah berlawanan jarum jam), sehingga indeks titik bisa berbeda dari urutan klik. Bukan bug; spec membandingkan keanggotaan titik.
- [Catatan] Delete saat fokus di kotak cari menghapus teks, bukan fitur (benar: pintasan diabaikan saat mengetik).
