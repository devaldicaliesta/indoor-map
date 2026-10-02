# T-210 · Template instruksi — bukti E2E

Spec: `e2e/tests/admin/verify/T-210-instruction-templates.spec.ts` (fixture `fullVenue`, role Admin). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-tabel-instruksi.png) | Pengaturan → Instruksi: tabel aksi ID/EN; "Simpan instruksi" nonaktif tanpa perubahan |
| [02](02-placeholder-salah.png) | `{tujuan}` (placeholder tidak dikenal) dan teks ID kosong ditandai salah, simpan nonaktif |
| [03](03-pratinjau.png) | "Tiba" diubah; pratinjau "Sudah sampai di Ruang 201" / "You have reached Room 201"; disimpan |
| [04](04-test-route.png) | Test route GF-A01 → GF-B08: langkah terakhir memakai teks baru, ID lalu EN |
| [05](05-dikembalikan.png) | Teks semula diisi ulang dan disimpan; setelah muat ulang nilai kembali seperti semula |

## Temuan

- SEDANG: tidak ada tombol "Kembali ke bawaan" per aksi atau untuk seluruh tabel. Checklist T-307a menyebutnya, spec FR-NAV-09 tidak. Admin harus mengetik ulang teks bawaan. Dicatat di PROGRESS sebagai pertanyaan untuk pemilik produk.
