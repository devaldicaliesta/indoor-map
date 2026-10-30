# T-601a · Data akun dan masa simpan log audit (UU PDP) — bukti E2E

Spec: `e2e/tests/admin/f2/T-601-account-data.spec.ts`, proyek `admin` (desktop 1440 × 900).
Hasil: **2 lulus** (Supabase lokal, 2026-10-30). Test case: TC-KOM-01, TC-KOM-02 (bagian log
audit; bagian analitik di T-601b).

| Gambar | Langkah |
| --- | --- |
| [01](01-menu-data-akun.png) | Pengguna → cari akun Editor uji (dibuat lewat undangan sungguhan) → menu ⋯: "Ekspor data akun (JSON)" dan "Hapus akun…" |
| [02](02-konfirmasi-hapus.png) | Berkas `data-akun-…-YYYY-MM-DD.json` terunduh (format `panduarah.user-data/1`, email/nama/role sesuai). Dialog hapus: tombol "Hapus akun" nonaktif sampai email diketik ulang |
| [03](03-pengguna-terhapus.png) | Akun hilang dari tabel; akun itu tidak bisa masuk lagi |
| [04](04-log-audit-export-hapus.png) | Log audit difilter "Data akun diekspor" + "Akun dihapus": pelaku Super Admin, keterangan "Pengguna terhapus (Editor)", tanpa email akun yang dihapus |
| [05](05-pengaturan-masa-simpan.png) | Pengaturan → Sistem → Privasi data: 7 hari ditolak ("Isi angka 30–3650 hari"), 90 hari tersimpan dan tetap setelah muat ulang (dipulihkan ke 365 di akhir test) |
| [06](06-log-audit-pengaturan.png) | Log audit "Pengaturan diubah · masa simpan log audit" |

Lapisan lain:
- **D** `supabase/tests/account_data_privacy.test.sql` (26): hanya Super Admin; isi export
  (akun, waktu masuk, venue, tur, peristiwa audit sebagai pelaku dan sasaran saja, jumlah konten);
  export dan hapus tercatat; tidak bisa menghapus diri sendiri; cascade ke profil, keanggotaan,
  tur; konten tetap tanpa pembuat; log audit tanpa nama/email; **TC-KOM-02**: job retensi pada
  waktu tertentu menghapus peristiwa lebih tua dari 30 hari, menyisakan yang baru, dan mencatat
  `audit_purged`; masa simpan < 30 ditolak; job `audit-retention` terjadwal.
- **I** `packages/data/test/integration/user-data.test.ts` (2): repository export/hapus lewat
  RLS dengan sesi sungguhan (Editor ditolak, akun Auth terhapus, audit berpelaku).
- **U** domain `user-data` (3), `system-settings` retensi (1), audit actions; data
  `toUserDataExport` (2) dan pemetaan pengaturan; Admin `audit-format` dan `system-form-model`.

| ID | Hasil |
| --- | --- |
| TC-KOM-01 | Lulus (I, E) |
| TC-KOM-02 | Lulus untuk log audit (D); analitik menyusul T-601b |
