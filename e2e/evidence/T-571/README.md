# T-571 · Elemen 3D: pustaka objek dan model GLB — bukti E2E

Spec: `e2e/tests/admin/f2/T-571-3d-elements.spec.ts`, proyek `admin` (Visitor dan Info Point di
halaman tambahan). Hasil: **lulus** di CI E2E PR #120 (run 43795984460, 2026-11-16). Test case:
TC-PAR-01 s.d. 04.

| Berkas | Langkah |
| --- | --- |
| [01](01-editor-objek-pustaka.png) | Editor Peta: fitur Objek 3D dari pustaka (Bangku), skala 2,5, rotasi 90°, tinggi dasar 0,5 m |
| [02](02-editor-unggah-ditolak.png) | Unggah berkas bukan GLB: "Model tidak diunggah · Berkas bukan model GLB (glTF biner)" |
| [03](03-editor-glb-unggahan.png) | GLB `patung-lobi` diunggah dan dipilih sebagai model |
| [04](04-editor-3d.png) | Mode 3D editor: kedua objek tampil di atas lantai |
| [05](05-visitor-2d-tanpa-objek.png) | Visitor 2D: objek 3D tidak digambar |
| [06](06-visitor-3d-objek.png), [06b](06b-visitor-3d-objek-dekat.png) | Visitor 3D: objek tampil di atas ruang, tidak tertutup lantai |
| [07](07-info-point-paksa-2d.png) | Info Point dengan "Paksa 2D": tanpa objek 3D dan Three.js tidak dimuat |
| [08](08-perf-200-objek.png), [json](08-perf-200-objek.json) | 200 objek di lantai padat (SwiftShader, tanpa GPU): FPS median 27,5 → 23,3 (rasio 0,85) |

| ID | Hasil |
| --- | --- |
| TC-PAR-01 s.d. 04 | Lulus (E) |
