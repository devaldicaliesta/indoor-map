# T-210 · Template instruksi — bukti E2E

Spec: `e2e/tests/admin/verify/T-210-instruction-templates.spec.ts` (fixture `fullVenue`, role Admin). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-tabel-instruksi.png) | Pengaturan → Instruksi: tabel aksi ID/EN; "Simpan instruksi" nonaktif tanpa perubahan |
| [02](02-placeholder-salah.png) | `{tujuan}` (placeholder tidak dikenal) dan teks ID kosong ditandai salah, simpan nonaktif |
| [03](03-pratinjau.png) | "Tiba" diubah; pratinjau "Sudah sampai di Ruang 201" / "You have reached Room 201"; disimpan |
| [04](04-test-route.png) | Test route GF-A01 → GF-B08: langkah terakhir memakai teks baru, ID lalu EN |
| [05](05-dikembalikan.png) | "Kembalikan Tiba ke bawaan" mengisi teks bawaan (`DEFAULT_INSTRUCTION_TEMPLATES`), tombol aksi yang sudah bawaan nonaktif; disimpan, setelah muat ulang nilai kembali seperti semula |

## Temuan

- **Ditambahkan (SEDANG)**: semula tidak ada "kembali ke bawaan". Kini tombol "Bawaan" per aksi dan "Semua ke bawaan" (mengisi formulir; tersimpan lewat "Simpan instruksi"). Teks bawaan menjadi konstanta domain `DEFAULT_INSTRUCTION_TEMPLATES`; test integrasi memastikan sama dengan bawaan database (migrasi 0001). Disetujui pemilik produk 2026-10-03.
