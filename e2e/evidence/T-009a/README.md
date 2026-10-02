# T-009a · Peta aksi per role dan pgTAP per role — bukti E2E

Spec: `e2e/tests/admin/verify/T-009a-role-actions.spec.ts`, tabel percobaan server `e2e/support/role-attempts.ts` (data: fixture `publishedVenue` + satu penutupan aktif). Hasil: **lulus 3 run beruntun** (5 test per run, satu per role; 2026-10-02).
Test case: TC-SEC-02, -03, -05, -06, -07, -08, -09 (matriks role 9.1, sebagian; lihat cakupan), TC-AUTH-10 (lanjutan).

Untuk setiap role:
1. **UI**: tiap halaman ditunggu siap (judul atau pesan tidak berizin tampil, kerangka memuat hilang), lalu tombol aksi harus ada bila `can(role, aksi)` benar dan tidak ada bila salah: "Tambah gedung" (venue.edit), "Tambah lokasi" (location.edit), "Akhiri sekarang" (closure.manage), "Tambah titik asal" (origin_point.edit), "Terbitkan" (publish.publish), "Tambah jenis" (settings.edit), tab "Sistem" (settings.system). Super Admin menjadi kontrol positif (semua ada).
2. **Server**, sebagai role itu lewat repository, untuk setiap aksi terlarang:
   - buat (harus `DataError` `forbidden`): gedung, lantai, unit peta, kategori lokasi, penutupan, titik asal, publish (Edge Function), jenis fasilitas, undangan pengguna (Edge Function `admin-users`);
   - ubah/hapus (RLS bisa berakhir 0 baris tanpa galat, jadi buktinya data tetap): ubah venue dan lantai, hapus gedung, hapus unit, hapus lokasi, akhiri dan hapus penutupan, ubah tampilan, ubah instruksi, ubah pengaturan sistem;
   - baca Catatan (`audit_events`) kosong dan pengaturan sistem ditolak untuk semua role selain Super Admin.
3. **Database**: nama venue, gedung, lantai, fitur, kategori, lokasi, penutupan (+ waktu selesai), titik asal, versi publikasi, jenis fasilitas, mode tampilan, instruksi, dan zona waktu sistem dibaca ulang sebagai Super Admin: sama persis sebelum dan sesudah.

Cakupan yang belum diuji di sini: unggah berkas Storage (denah, logo, ikon), graf/konektor/titik masuk, tipe/field/import/alias lokasi, branding (diuji per task masing-masing di R1/R2). `publish.validate`, `publish.rollback`, `license.manage` belum punya pintu server (T-307/T-308, R4); hanya dijaga `can()` (unit test domain) dan pgTAP `roles.test.sql`. `map.edit` dan `user.manage` hanya diuji di server (UI Editor Peta dan Pengguna dicek di T-009b/T-2xx).

| Gambar | Langkah |
| --- | --- |
| [07-role-super_admin](07-role-super_admin.png) | Pengaturan Super Admin: tab Sistem/Catatan dan "Tambah jenis" ada |
| [07-role-admin](07-role-admin.png) | Admin: "Tambah jenis" ada, tab Sistem/Catatan tidak ada |
| [07-role-editor](07-role-editor.png) | Editor: Pengaturan baca saja, tanpa tombol ubah |
| [07-role-operator](07-role-operator.png) | Operator: hanya Penutupan; boleh mengakhiri penutupan |
| [07-role-viewer](07-role-viewer.png) | Viewer: semua menu "baca", label "Mode baca", tanpa tombol ubah |

## Temuan

- [RENDAH] Halaman Penutupan: tombol "Ubah waktu selesai" bergaya ghost sehingga tampak seperti teks tebal biasa, tidak jelas bisa diklik (gambar 07-role-operator). Dicatat.
- [RENDAH] Header tabel Penutupan dibaca Chromium sebagai `cell`, bukan `columnheader`, walaupun memakai `<th>` di `<thead>`; perlu dicek di komponen `Table` (pembaca layar). Dicatat.
- [Catatan keamanan, di luar T-009a] Semua staf (termasuk Viewer) bisa membaca seluruh profil pengguna (`profiles_read`), dan Editor bisa mengubah Info Point, yang tidak tercantum di matriks 9.1. Perlu dikonfirmasi pemilik; dicatat di PROGRESS.
- [Catatan test] Data uji sengaja kecil (satu venue, satu penutupan) karena yang diuji otorisasi; data banyak dipakai di T-007 dan task R1 dst.

Tinjauan: code-reviewer — Perlu perbaikan, sudah diperbaiki (halaman ditunggu siap sebelum cek tombol tidak ada; snapshot DB mencakup semua percobaan; `forbidden` wajib untuk percobaan buat; screenshot `fullPage`, nama `07-role-*`). security-reviewer — Setuju (RLS dan fungsi server sesuai matriks; saran perluasan ke ubah/hapus dan tabel lain sudah ditambahkan, sisanya dicatat di cakupan).
