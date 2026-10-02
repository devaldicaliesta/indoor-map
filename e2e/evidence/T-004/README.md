# T-004 · Supabase lokal dan skema inti — bukti verifikasi

Spec: `e2e/tests/admin/verify/T-004-supabase.spec.ts`. Hasil: **lulus 3/3** (2026-10-02).
Test case: TC-REL-07 (reset dari nol), TC-SEC-01, TC-SEC-02 (anon), TC-SEC-45 (fungsi `security definer`), NFR-MNT-03.

| Bukti | Isi | Hasil |
| --- | --- | --- |
| [01-db-reset-1.txt](01-db-reset-1.txt), [02-db-reset-2.txt](02-db-reset-2.txt) | `pnpm db:reset` dua kali berturut-turut dari nol (20 migrasi + seed) | Lulus |
| [03-pgtap.txt](03-pgtap.txt) | `supabase test db`: 14 berkas, 169 test | Lulus |
| [04-venue-contoh-admin.png](04-venue-contoh-admin.png) | Venue Contoh di Admin: Gedung Utama (2 lantai) + Area Luar | Lulus |
| [05-ringkasan.png](05-ringkasan.png) | 20 pemeriksaan katalog, REST anon, seed | Semua lulus |

- `pnpm db:types` menghasilkan berkas yang sama persis dengan yang ter-commit (tanpa diff).
- Katalog: semua tabel public memakai RLS; semua fungsi `security definer` di `public`/`app` punya `search_path`; tidak ada fungsi RPC public yang bisa dipanggil anon; skema `app` tidak diekspos API.
- Anon lewat REST: `venues`, `profiles`, `features`, `locations`, `floor_plans` kosong; membuat venue ditolak (401/403). Hanya `closures` dan `publications` yang punya policy baca publik.

## Temuan

- [RENDAH] Enam fungsi `security definer` di skema `app` (`user_role`, `floor_writable`, dan empat fungsi trigger) masih punya hak `execute` untuk `anon` (bawaan `public`). Tidak bisa dipanggil lewat API karena skema `app` tidak diekspos dan fungsi trigger tidak bisa dipanggil langsung; `user_role` untuk anon mengembalikan null. Saran pengerasan: `revoke execute ... from public, anon` lewat migrasi baru saat T-412. Dicatat, tidak diubah.

Tinjauan: code-reviewer — Setuju; security-reviewer — Setuju dengan catatan RENDAH di atas (OWASP A01/A05, CWE-284).
