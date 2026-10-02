# T-115 · Tampilan 2D/3D — bukti E2E

Spec: `e2e/tests/admin/verify/T-115-display-3d.spec.ts` (fixture `fullVenue`). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-visitor-3d-bawaan.png) | Visitor (terbit dengan tinggi bawaan), 3D ditekan manual |
| [06](06-error-tinggi.png) | Tinggi unit −3 ditolak dengan pesan di bawah kolom |
| [02](02-pengaturan-tersimpan.png) | Pengaturan → Tampilan: mode awal 3D, tinggi unit 12 m, "Tampilan disimpan"; DB `defaultMode=3d`, `heights.unit=12` |
| [03](03-admin-editor-3d.png) | Editor Peta Admin: 3D mengubah kanvas |
| [04](04-visitor-3d-unit-12m.png) | Setelah publish, Visitor langsung 3D tanpa menekan tombol; kanvas berbeda dari gambar 01 (unit lebih tinggi) |

## Temuan

- [RENDAH, aksesibilitas] Di halaman Tampilan, label "Unit" (dan jenis lain) dipakai dua kali: kolom tinggi dan kolom warna; pembaca layar tidak membedakannya kecuali lewat judul bagian. Mis. "Tinggi Unit" / "Warna Unit".
