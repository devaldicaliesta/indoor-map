# T-012 · Catatan peristiwa penting — bukti E2E

Spec: `e2e/tests/admin/verify/T-012-audit-log.spec.ts`. Hasil: **lulus 3 run beruntun** (2 test, 2026-10-02).
Test case: TC-AUTH-03 (gagal masuk tercatat), TC-AUTH-08 (role/nonaktif tercatat), TC-SEC-09 (Catatan hanya Super Admin), TC-SEC-47 (log tanpa rahasia).

Peristiwa nyata dibuat di test: pengguna undangan gagal masuk 2×, lalu masuk; Super Admin mengubah rolenya Viewer → Editor dan menonaktifkannya; URL publik Visitor diubah lalu dikembalikan; fixture `publishedVenue` menerbitkan versi 1.

| Gambar | Langkah |
| --- | --- |
| [01](01-catatan-semua.png) | Semua aksi: gagal masuk (merah, "password salah (1×/2×)"), masuk, role diubah, dinonaktifkan, pengaturan diubah, publish — terbaru di atas |
| [02](02-filter-role-diubah.png) | Filter "Role diubah": hanya baris itu; keterangan menyebut pengguna yang diubah, nama panjang membungkus |
| [03](03-filter-gagal-masuk.png) | Filter "Gagal masuk": 2 baris untuk pengguna uji |

Password yang salah tidak pernah tercatat atau tampil. Admin tidak melihat tab Catatan (penolakan baca di server diuji T-009a).

## Temuan

- [SEDANG] **"Role diubah" dan "Pengguna dinonaktifkan" tidak menyebut siapa yang diubah**, hanya pelakunya (Super Admin), sehingga Catatan tidak bisa menjawab "role siapa yang diubah". **Diperbaiki:** `AuditEvent.target` (domain), repository membaca profil dari `entity_id` bila `entity = 'user'`, dan Keterangan menjadi "Nama (email) · Viewer → Editor"; unit test domain-data dan format ditambah.
- [RENDAH] Keterangan panjang (nama beraksen + email) melebar keluar tabel karena sel tidak membungkus. **Diperbaiki** (`whitespace-normal` pada kolom Keterangan); dijaga cek lebar kontainer tabel di spec (merah sebelum perbaikan).
