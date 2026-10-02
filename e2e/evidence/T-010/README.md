# T-010 · Pengaturan sistem — bukti E2E

Spec: `e2e/tests/admin/verify/T-010-system-settings.spec.ts`. Hasil: **lulus 3 run beruntun** (2 test, dijalankan bersama spec T-008 dan T-009b yang juga memakai Mailpit; 2026-10-02).
Test case: FR-SYS-01 (URL publik, zona waktu, bahasa, SMTP, email uji), TC-SEC-09 (tab Sistem hanya Super Admin).

| Gambar | Langkah |
| --- | --- |
| [01](01-tab-sistem.png) | Tab Sistem Super Admin dengan nilai seed (SMTP ke Mailpit) |
| [06](06-error-validasi.png) | URL `http://…/` dan port "dua lima" ditolak dengan pesan per kolom; DB tidak berubah |
| [02](02-tersimpan.png) | URL https, zona waktu WITA, bahasa English, pengirim baru tersimpan; pesan galat hilang; DB benar; terbaca setelah muat ulang |
| [03](03-email-uji-terkirim.png) | "Kirim email uji" → toast; email dengan nama pengirim baru sampai di Mailpit |
| [07](07-admin-tanpa-sistem.png) | Admin: tab Sistem dan Catatan tidak ada (penolakan server di T-009a) |

Host SMTP tidak diubah dan semua nilai dikembalikan di akhir test, karena pengaturan berlaku untuk seluruh instalasi dan dipakai test lain.

## Temuan

- [Catatan test] Versi awal spec gagal sesekali: dua test berjalan paralel dan pemulihan pengaturan di test kedua menimpa nilai test pertama. Pemulihan kini di dalam test yang mengubah saja.
- Tinjauan keamanan T-009b menyarankan dua perbaikan sesi yang dikerjakan di commit ini (lihat `e2e/evidence/T-009b/README.md`).
