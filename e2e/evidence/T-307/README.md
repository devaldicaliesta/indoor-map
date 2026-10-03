# T-307 · Validasi publish lengkap — bukti E2E

Spec: `e2e/tests/admin/verify/T-307-publish-validation.spec.ts` (fixture `testVenue` + unit tanpa titik masuk dan lokasi aktif tanpa unit, role Admin). Hasil: **lulus 3 run beruntun** (2026-10-03).

| Gambar | Langkah |
| --- | --- |
| [01](01-temuan-error.png) | Publish → "Validasi": kelompok "Error (2)": unit tanpa titik masuk (Buka di editor) dan lokasi aktif tanpa unit (Buka lokasi) |
| [02](02-publish-ditolak.png) | "Terbitkan (dev)" ditolak server: "Publish dibatalkan: 2 Error validasi…"; tidak ada versi published |
| [03](03-fitur-disorot.png) | "Buka di editor": lantai GF dibuka, unit VAL-001 terpilih dan disorot di peta, properti tampil; parameter `feature` dilepas dari URL |

"Buka lokasi" membuka dialog lokasi "Klinik Tanpa Unit". Setiap aturan (Error dan Peringatan) diuji unit di `packages/domain/test/validation/publish/publish.test.ts` (19 test, gagal sebelum `validateVenue` ada); penolakan publish dan nomor versi yang tidak terpakai diuji integrasi di `packages/data/test/integration/publish.test.ts`. Validasi venue contoh: 11 ms.

## Temuan

Tidak ada.
