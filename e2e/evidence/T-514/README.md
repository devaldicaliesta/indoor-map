# T-514 · Perbaikan lisensi dan audit R4 — bukti

Spec (project `license`, serial; lisensi semula dipulihkan setelahnya):
- `e2e/tests/license/cad-floor-plan.spec.ts` — gambar di `e2e/evidence/T-313/`
- `e2e/tests/license/f2/T-514-license-fixes.spec.ts` — gambar di folder ini

Hasil: **4 lulus** (Supabase lokal, `services/cad-converter` lokal, 2026-10-26).

| Bukti | Langkah | Test case |
| --- | --- | --- |
| [T-313/01–05](../T-313/) | Lisensi dev berfitur `cad_import` dipasang lewat `devLicenseFile({ features })`: DWG ditolak, DXF dipilih layernya, diunggah, ditempatkan | TC-HRD-07 |
| (spec, tanpa gambar) | Lisensi semula (tanpa `cad_import`) dipulihkan; DXF dikirim langsung ke `/inspect` dan `/render` dengan sesi Super Admin yang sah → **403** `feature_locked`; sesi palsu → 401 | TC-HRD-08 |
| [02](02-masa-tenggang-tombol-nonaktif.png) | Masa tenggang (berakhir 2 hari lalu): banner "Masa tenggang sampai …: Admin hanya-baca", "Tambah venue", "Ubah", "Hapus", dan "Tambah gedung" nonaktif di dalam `fieldset` berketerangan "Masa tenggang lisensi: Admin hanya-baca."; venue baru lewat API tetap ditolak server | TC-HRD-09 |
| [01](01-audit-aktivasi-super-admin.png) | Lisensi dipasang Super Admin lewat Edge Function `license-activate`: baris "Lisensi berubah" di Pengaturan → Catatan menyebut "Super Admin Lokal", bukan "Sistem" | TC-HRD-10 |

Lapisan lain:
- **U** `services/cad-converter/tests/test_server.py` (18 test layanan): token tanpa fitur → 403 di
  `/inspect` dan `/render`, token kosong → 401, `supabase_access_check` terhadap Supabase tiruan
  (fitur dari `license_features()`, sesi palsu, Supabase tidak terjangkau → 401).
- **U** `packages/data/test/cad-converter.test.ts`: 403 dari layanan menjadi `DataError`
  `forbidden` dengan pesan layanan.
- **U** `packages/domain/test/permissions.test.ts`: `licenseAllows` mengunci tepat 8 aksi tulis
  konten; validasi, pengguna, pengaturan sistem, dan lisensi tetap terbuka.
- **D** `supabase/tests/license_install_actor.test.sql` (7): Super Admin aktif tercatat sebagai
  pelaku; instalasi baru tanpa pelaku; Admin biasa atau Super Admin nonaktif ditolak (`IM403`);
  pengguna login tidak bisa memanggil `license_install`.

| ID | Hasil |
| --- | --- |
| TC-HRD-07 | Lulus |
| TC-HRD-08 | Lulus (lewat E2E dan unit; tidak ada test integrasi terpisah) |
| TC-HRD-09 | Lulus |
| TC-HRD-10 | Lulus |
