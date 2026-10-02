# T-305 · Import CSV/Excel — bukti E2E

Spec: `e2e/tests/admin/verify/T-305-import.spec.ts` (fixture `fullVenue`, role Editor, tipe "Layanan"). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-kolom-wajib-hilang.png) | Template CSV diunduh (BOM UTF-8, kolom `kode_lokasi, nama, kategori, deskripsi, status, tanggal_buka, kode_unit` + field kustom); Template XLSX berupa arsip zip. Berkas tanpa kolom wajib: "Kolom wajib tidak ada: … Pakai template." |
| [02](02-pratinjau.png) | CSV empat baris: "1 baru · 1 memperbarui · 2 gagal dari 4 baris."; baris gagal di atas dengan alasan per kolom (`kode_unit`: unit tidak ada, `nama`: wajib diisi) |
| [03](03-hasil-import.png) | "Simpan 2 baris valid" → "2 lokasi diimpor"; lokasi baru tertaut ke GF-B05 |

DB: lokasi GIGI-01 baru aktif; RAD-01 deskripsinya berubah (nilai berkoma, berkutip, dan bertitik koma utuh) dan unitnya tetap karena sel kosong mempertahankan nilai lama; baris gagal tidak tersimpan. Parser XLSX diuji unit di `apps/admin/src/features/import/xlsx.test.ts`.

## Temuan

- **Diperbaiki (RENDAH)**: isian berkas di dialog import memakai `<input>` polos (tampilan bawaan browser), berbeda dengan isian berkas lain yang memakai `Input` dari `@indoor/ui`. Kini sama.
- Catatan: tipe lokasi bawaan dialog adalah tipe pertama ("Lokasi"); berkas untuk lokasi bertipe lain ditolak dengan alasan yang jelas ("Kode RAD-01 dipakai lokasi … bertipe lain").
