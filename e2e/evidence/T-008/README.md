# T-008 · Login, logout, reset password — bukti E2E

Spec: `e2e/tests/admin/verify/T-008-auth.spec.ts` (helper `e2e/support/auth-users.ts`, `e2e/support/mailpit.ts`). Hasil: **lulus 3/3** (6 test, 2026-10-02).
Test case: TC-AUTH-01, -02, -03, -04, -05, -06, -07, -30, -31, -39 (sebagian), -40, -41.

Akun yang dikunci atau diganti password-nya dibuat per test lewat alur undangan (`admin-users` → Mailpit → tautan undangan), sehingga akun seed bersama tidak ikut terkunci. Emailnya `…@e2e.test`; akun ini tidak dihapus (belum ada hapus pengguna) dan hilang saat `pnpm db:reset`.

| Gambar | Langkah | Test case |
| --- | --- | --- |
| [01](01-halaman-masuk.png) | Halaman masuk | TC-AUTH-01 |
| [02](02-masuk-berhasil.png) | Masuk dengan email berhuruf besar + spasi → beranda Venue | TC-AUTH-01, -30 |
| [03](03-password-salah.png) | Password salah: "Email atau password salah." (sama untuk email tak terdaftar) | TC-AUTH-02 |
| [04](04-akun-terkunci.png) | Setelah 5 gagal, password benar pun ditolak dengan pesan yang sama seperti email tak terdaftar | TC-AUTH-03 |
| [04b](04b-email-pemberitahuan-kunci.png) | Email pemberitahuan kunci ke pemilik akun (Mailpit) | TC-AUTH-03 |
| [05](05-menu-akun.png) | Menu akun dengan "Keluar" | TC-AUTH-05 |
| [06](06-back-setelah-keluar.png) | Keluar lalu Back → tetap di halaman masuk | TC-AUTH-05 |
| [07](07-lupa-password.png) | Halaman lupa password | TC-AUTH-06 |
| [08](08-tautan-terkirim.png) | Pesan netral "Jika … terdaftar" (juga untuk email tak terdaftar) | TC-AUTH-06, -40 |
| [09](09-konfirmasi-beda.png) | Konfirmasi password berbeda ditolak (7 karakter dicegah validasi `minLength`) | TC-AUTH-07 |
| [10](10-password-diubah.png) | Password diubah, kembali ke masuk dengan pesan; password lama ditolak, baru diterima | TC-AUTH-06 |
| [11](11-tautan-sudah-dipakai.png) | Tautan yang sudah dipakai dan tautan lama (permintaan sebelumnya) ditolak | TC-AUTH-06, -41 |
| [12](12-sesi-idle.png) | Jam palsu: 59 menit tetap masuk, 61 menit keluar otomatis dengan pesan | TC-AUTH-04 |

Juga dicek lewat repository (`superAdmin.audit`): percobaan gagal tercatat `login_failed` 5× `invalid_password` lalu `locked`. Isian kosong dan format email salah dicegah validasi formulir tanpa permintaan ke server (TC-AUTH-31).

Belum dicek: tautan kedaluwarsa (> 1 jam, batas GoTrue), kunci habis setelah 15 menit (TC-AUTH-39; diuji pgTAP di T-004), draft tidak hilang saat idle (draft editor belum ada di T-008), batas server `inactivity_timeout` (yang diuji timer klien).

## Temuan

- [RENDAH] Gambar 04: tombol "Masuk" tampak pudar karena kursor masih di atas tombol (hover). Bukan bug.
- [Catatan test] `pnpm check` sekali merah di `@indoor/domain#test` saat Supabase + Playwright berjalan bersamaan; lulus saat diulang (2× terpisah, 1× penuh). Tidak berkaitan dengan T-008.

- [SEDANG, test] Kuota email lokal `auth.rate_limit.email_sent = 10`/jam: menjalankan spec berulang kali dalam satu jam bisa membuat email reset tidak terkirim (UI tetap menampilkan pesan netral), lalu `waitForMail` gagal. Pesan galat `waitForMail` kini menyebut batas ini; Mailpit yang tidak menjawab dilaporkan jelas. 3 run beruntun tetap lulus.
- [SEDANG, keamanan] Hook penguncian `security definer` memakai `search_path = public, pg_temp`, bukan `''`. **Diperbaiki** di migrasi 0021 (dijaga pgTAP).
- [SEDANG, keamanan] Pesan "Akun terkunci…" membedakan email terdaftar dari yang tidak. **Diperbaiki (keputusan pemilik: opsi A):** pesan saat terkunci identik dengan email tak terdaftar, pemilik akun menerima email pemberitahuan (Edge Function `account-notice`, maks. 1 per jam). Tinjauan keamanan perubahan ini: Setuju; dua temuan SEDANG (rincian SMTP di balasan, banjir email) diperbaiki sebelum commit.
- [SEDANG, keamanan] Rahasia hook `send_email` lokal ada di `supabase/config.toml`; instalasi klien wajib membangkitkan sendiri (T-411 harus menolak nilai bawaan). Dicatat.
- [RENDAH, keamanan] Pesan galat tak dikenal GoTrue tampil mentah di halaman reset; `secure_password_change = false`; `max_frequency` reset 1 detik. Dicatat.

Tinjauan: code-reviewer — Setuju (temuan test diperbaiki: pemeriksaan 59 menit kini memberi timer kesempatan berjalan, komentar "apa" dihapus); security-reviewer — Setuju dengan perubahan (0 KRITIS/TINGGI; temuan SEDANG di atas dicatat sebagai pekerjaan lanjutan, tidak diubah di verifikasi ini).
