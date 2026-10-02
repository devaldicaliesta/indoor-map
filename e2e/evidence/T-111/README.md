# T-111 · Undo/redo — bukti E2E

Spec: `e2e/tests/admin/verify/T-111-undo-redo.spec.ts`. Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-dua-unit.png) | Dua unit digambar; tombol Urungkan aktif, Ulangi nonaktif |
| [02](02-diurungkan.png) | Tombol Urungkan: unit kedua hilang (DB 1 unit), Ulangi aktif; Ulangi mengembalikan (DB 2) |
| [03](03-diulangi-keyboard.png) | Ctrl+Z ×2 → DB 0 unit, Urungkan nonaktif; Ctrl+Shift+Z dan Ctrl+Y → DB 2 unit, "Tersimpan" |

Hasil akhir bertahan setelah muat ulang ("2 fitur"). Setiap undo/redo tersimpan ke server, bukan hanya di layar.

## Temuan

Tidak ada.
