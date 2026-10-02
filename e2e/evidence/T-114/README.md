# T-114 · Validasi geometri — bukti E2E

Spec: `e2e/tests/admin/verify/T-114-geometry-validation.spec.ts` (5 unit ditanam lewat repository: dua tumpang tindih, satu di luar gedung, satu poligon "kupu-kupu", satu sehat). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-ringkasan-temuan.png) | "3 temuan" di bilah atas; menu dikelompokkan: memotong diri, tumpang tindih (dengan luas irisan), di luar batas gedung (dengan luas di luar) dan arahan perbaikan; fitur bermasalah merah di peta |
| [02](02-temuan-dipilih.png) | Klik temuan UJI-LUAR: fitur itu terpilih dan peta mengarah ke sana |
| [03](03-daftar-bertanda.png) | Daftar fitur menandai fitur bermasalah |
| [04](04-geometri-valid.png) | Fitur bermasalah dihapus → "Geometri valid", tersimpan |

## Temuan

- [Catatan] Kode unit ganda (`duplicate_unit_code`) tidak diuji di sini karena server menolak kode ganda saat simpan (diuji di T-109); temuan itu hanya muncul untuk data lama.
