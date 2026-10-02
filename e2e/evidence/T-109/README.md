# T-109 · Jenis fitur dan atribut unit — bukti E2E

Spec: `e2e/tests/admin/verify/T-109-feature-kinds.spec.ts`. Hasil: **lulus 3 run beruntun** (2 test, 2026-10-02).
Test case: kriteria T-109 (semua jenis fitur, gaya berbeda, kode unit ganda ditolak menyebut unit bentrok), status dan luas unit.

| Gambar | Langkah |
| --- | --- |
| [01](01-semua-jenis.png) | Editor menggambar unit, koridor, lift, eskalator, tangga, area non-akses (poligon), dinding (garis), pintu dan pintu keluar (titik) di dalam footprint: "Geometri valid"; daftar fitur 9 grup; DB 9 jenis |
| [06](06-kode-ganda.png) | Kode "Ri-01" untuk unit kedua ditolak "Kode RI-01 sudah dipakai unit lain di lantai GF."; "l1-atrium" ditolak "…unit di Gedung Uji lantai L1." |
| [02](02-atribut-unit.png) | Kode "  ri-01 " dinormalkan "RI-01"; status Renovasi; luas manual 123,5 m²; DB benar |

## Temuan

- [SEDANG] **Cari lalu Enter di daftar fitur bisa memilih fitur yang salah atau tidak memilih apa pun**: Enter memakai daftar dari `useDeferredValue` yang bisa tertinggal dari teks terbaru (terjadi saat kode ditempel/diketik cepat lalu Enter; muncul sekali di spec ini: unit sebelumnya tetap terpilih). **Diperbaiki:** `firstMatch(items, query)` di `feature-list-model.ts` menyaring dari teks saat ini; unit test baru (merah sebelum implementasi).
- [RENDAH] Kontras gaya: koridor dan unit "terisi" hampir sewarna dengan kanvas Editor (gambar 01), sehingga sulit dibedakan tanpa garis tepi. Perlu ditinjau bersama tabel warna `05-desain-ui.md`.
- [Catatan test] Versi awal menggambar di luar footprint (semua fitur ditandai merah oleh validasi) dan terlalu rapat (snapping menyatukan sudut tetangga); posisi diperbaiki.
