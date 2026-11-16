# T-572 · Pustaka ikon POI lengkap — bukti E2E

Spec: `e2e/tests/admin/f2/T-572-poi-icons.spec.ts`, proyek `admin`. Hasil: **lulus** di CI E2E
PR #110 dan #120 (run 43795984460, 2026-11-16). Test case: TC-PAR-05 (E); TC-PAR-06 di test unit
`packages/domain/test/pictograms.test.ts` dan `snapshot.test.ts` (kunci ikon lama tetap terbaca);
TC-PAR-07 di `packages/ui/src/pictograms/LICENSES.md` (Lucide ISC, turunan Feather MIT, tanpa
lisensi non-komersial).

| Gambar | Langkah |
| --- | --- |
| [01](01-pemilih-semua-ikon.png) | Pengaturan → Jenis fasilitas → Tambah: pemilih ikon "203 ikon", cari ID/EN, filter kategori |
| [02](02-cari-alias-obat.png) | Cari alias "obat": 1 ikon (Apotek) |
| [03](03-filter-kesehatan.png) | Filter Kesehatan: 22 ikon |
| [04](04-dipilih-pratinjau.png) | "Apotek Rawat Jalan" dengan ikon Apotek: "dipilih: Apotek" dan pratinjau seperti di peta |
| [05](05-ikon-di-peta.png) | Ikon tampil tajam di peta setelah fasilitas ditempatkan |

Catatan pemeriksaan gambar: dialog di [01](01-pemilih-semua-ikon.png) sudah setinggi layar
900 px. Dialog jenis fasilitas dibuat bisa di-scroll di PR #124, sama dengan dialog kategori.

| ID | Hasil |
| --- | --- |
| TC-PAR-05 | Lulus (E) |
| TC-PAR-06 | Lulus (U) |
| TC-PAR-07 | Lulus (M, `LICENSES.md`) |
