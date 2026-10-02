# T-009b · Halaman Pengguna, Edge Function `admin-users`, `<Can>` — bukti E2E

Spec: `e2e/tests/admin/verify/T-009b-users.spec.ts`. Hasil: **lulus 3 run beruntun** (3 test, 2026-10-02).
Test case: TC-AUTH-08, -09, -36, -42, TC-AUTH-34 (lewat test integrasi), TC-SEC-09 (penolakan role lain di T-009a).

Data: 8 pengguna undangan per run (5 role, nama pendek/angka di awal) + akun seed; nama panjang beraksen "Renée Ümmü Ballesteros-Wijayakusuma Pratamaningsih". Daftar terisi puluhan baris karena undangan run sebelumnya tidak dihapus (belum ada hapus pengguna).

| Gambar | Langkah | Test case |
| --- | --- | --- |
| [01](01-daftar-pengguna.png) | Daftar pengguna, 5 role, status | TC-AUTH-08 |
| [02](02-form-undang.png) | Form undang: nama beraksen panjang, role Operator | TC-AUTH-08 |
| [03](03-diundang.png) | Toast "Undangan terkirim", baris baru; email undangan sampai di Mailpit; profil di DB benar | TC-AUTH-08 |
| [06](06-error-duplikat.png) | Email sudah terdaftar ditolak: "Email … sudah terdaftar." | TC-AUTH-42 |
| [04](04-role-diubah.png) | Role diubah ke Editor, toast; DB ikut berubah | TC-AUTH-08 |
| [05](05-dinonaktifkan.png) | Dinonaktifkan: status "Nonaktif", tombol "Aktifkan", pilihan role terkunci; tetap setelah muat ulang | TC-AUTH-08 |
| [07](07-super-admin-terakhir.png) | Super Admin terakhir: nonaktifkan dan turunkan role ditolak server dengan pesan; DB tetap | TC-AUTH-09 |
| [08](08-dikeluarkan-nonaktif.png) | Pengguna yang dinonaktifkan saat masuk dikeluarkan pada muat ulang berikutnya, pesan "Akun Anda dinonaktifkan…"; login ulang ditolak | TC-AUTH-36 |

## Temuan

- [TINGGI] **"Keluar" mengeluarkan semua perangkat.** `auth.signOut()` memakai cakupan bawaan supabase-js (`global`), sehingga keluar di satu perangkat (atau satu proses) mencabut sesi akun itu di semua perangkat; terlihat saat test lain keluar dan halaman Pengguna di browser tiba-tiba "Sesi tidak berlaku". Bertentangan dengan TC-AUTH-34 (dua perangkat bersamaan). **Diperbaiki:** `packages/data/src/auth.ts` memakai `signOut({ scope: 'local' })`; test integrasi baru (merah sebelum perbaikan, hijau sesudahnya) memastikan perangkat lain tetap punya sesi sah di server (`getUser`). Tab lain di browser yang sama tetap ikut keluar karena berbagi penyimpanan (TC-AUTH-33).
- [RENDAH] Tombol "Aktifkan" bergaya ghost, tampak seperti teks biasa (sama dengan "Ubah waktu selesai" di T-009a).
- [RENDAH] Baris Super Admin terakhir tetap menawarkan "Nonaktifkan" dan pilihan role walaupun pasti ditolak; lebih jelas bila dinonaktifkan dengan keterangan.
- [RENDAH] Halaman Pengguna tanpa pencarian/penyaringan; dengan puluhan pengguna daftar panjang sulit dipindai.
- [Catatan test] Toast sempat terpotret setengah transparan (animasi); spec kini menunggu opasitas 1.

## Tinjauan

security-reviewer — Setuju (scope `local` aman karena otorisasi bergantung pada `is_active`, bukan sesi). Dua temuan SEDANG **diperbaiki** setelahnya:
- Menonaktifkan pengguna kini mencabut semua sesinya di server (migrasi 0022, trigger pada `profiles.is_active`; pgTAP `session_revoke.test.sql` + test integrasi: `getUser`/`refreshSession` di perangkat lain gagal).
- Ganti password (termasuk lewat tautan reset) kini mencabut sesi perangkat lain (`signOut({ scope: 'others' })`; test integrasi dua perangkat).
