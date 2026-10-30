# T-602 · Persetujuan EULA saat aktivasi — bukti E2E

Spec: `e2e/tests/license/f2/T-602-eula.spec.ts`, proyek `license` (serial). Hasil: **1 lulus**
(Supabase lokal, 2026-10-30). Test case: TC-KOM-03. Instalasi baru disiapkan langsung di
database: Super Admin dinonaktifkan, lisensi dilepas, persetujuan EULA seed dihapus. Semuanya
dipulihkan di akhir test.

| Gambar | Langkah |
| --- | --- |
| [01](01-eula-belum-disetujui.png) | `/login` diarahkan ke `/aktivasi`: kotak EULA versi 2026-10-30 (teks dari `docs/legal/eula.md`), berkas lisensi sudah dipilih tetapi "Pasang lisensi" nonaktif. Panggilan API tanpa persetujuan juga ditolak server ("Setujui … EULA versi 2026-10-30") |
| [02](02-eula-disetujui.png) | Teks digulir sampai akhir, kotak centang "Saya telah membaca dan menyetujui EULA ini…" dicentang, tombol aktif |
| [03](03-log-audit-eula.png) | Setelah Super Admin pertama dibuat: Log audit "EULA disetujui · Versi 2026-10-30 · RS EULA E2E · LIC-E2E-…". `eula_acceptances` berisi versi, pemegang lisensi, dan ID lisensi. Pelaku "Sistem" karena Super Admin belum ada saat aktivasi pertama |
| [04](04-lisensi-berikutnya-tanpa-eula.png) | "Pasang lisensi baru" berikutnya tidak meminta persetujuan lagi |

Lapisan lain:
- **D** `supabase/tests/eula_acceptance.test.sql` (12): persetujuan dan audit tercatat bersama
  lisensi; lisensi berikutnya tanpa persetujuan tidak menambah baris; versi baru menyebut Super
  Admin; versi bukan tanggal ditolak; Admin tidak membaca riwayat; Super Admin tidak bisa
  menghapus bukti.
- **I** `packages/data/test/integration/license-activate.test.ts` TC-KOM-03: Edge Function
  `license-activate` menolak tanpa persetujuan atau dengan versi lama; menerima `EULA_VERSION`;
  `eula_status` terbaca tanpa login; audit berpelaku Super Admin.
- **U** domain `eula` (2); Admin `legal-text` (3: pengurai, versi naskah = `EULA_VERSION`,
  format naskah); data `seed-eula` (seed menyetujui versi berlaku).

| ID | Hasil |
| --- | --- |
| TC-KOM-03 | Lulus (D, I, E) |
