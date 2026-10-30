# Inventaris data pribadi (draf)

Daftar data pribadi yang diproses PanduArah, disusun untuk catatan pemrosesan (UU PDP
Pasal 31) dan lampiran DPA. Diperbarui 30 Oktober 2026 (T-601a). Setiap fitur baru yang
menyimpan data pribadi wajib menambah baris di sini dalam PR yang sama.

Dasar pemrosesan mengikuti UU PDP Pasal 20 ayat (2): **persetujuan**, **kontrak**, **kewajiban
hukum**, atau **kepentingan yang sah**. **[tinjau]** Konsultan memastikan dasar setiap baris.

## A. Paket on-premise (pengendali: klien)

Semua data di bagian ini disimpan di server klien (database PostgreSQL dan Storage di
`deploy/`). Vendor tidak menerimanya.

| # | Data | Isi | Tujuan | Dasar | Masa simpan | Cara hapus |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | Akun Admin (`auth.users`, `profiles`) | Nama, email, role, status aktif, hash password (bcrypt, GoTrue), jumlah gagal masuk, waktu terkunci, waktu daftar/konfirmasi/masuk terakhir | Masuk ke Admin dan menentukan hak akses | Kontrak (hubungan kerja staf dengan klien) | Selama akun ada | Admin → Pengguna → Hapus akun (permanen, satu transaksi) |
| A2 | Faktor 2FA (`auth.mfa_factors`) | Jenis faktor, nama perangkat, rahasia TOTP | Keamanan masuk | Kepentingan yang sah | Selama akun ada | Ikut A1 |
| A3 | Sesi (`auth.sessions`, `auth.refresh_tokens`) | Alamat IP, user agent, waktu sesi | Menjaga sesi masuk dan mencabut sesi | Kepentingan yang sah | Sampai keluar atau sesi kedaluwarsa | Ikut A1 |
| A4 | Keanggotaan venue, status tur (`venue_members`, `tour_progress`) | ID akun, venue, tur yang sudah dilihat | Pembatasan venue, tur panduan | Kontrak | Selama akun ada | Ikut A1 |
| A5 | Pemberitahuan akun (`account_notices`) | ID akun, jenis (`account_locked`), waktu kirim | Memberi tahu pemilik akun yang terkunci | Kepentingan yang sah | Selama akun ada | Ikut A1 |
| A6 | Log audit (`audit_events`) | ID akun pelaku/sasaran (UUID), aksi, waktu, rincian **tanpa nama/email** | Akuntabilitas dan keamanan (NFR-SEC-05) | Kepentingan yang sah / kewajiban keamanan (Pasal 35) | **Diatur klien**: 30–3650 hari, bawaan 365 | Otomatis tiap malam (job `audit-retention`). Setelah akun dihapus, UUID tidak lagi terhubung ke nama atau email |
| A7 | Jejak pembuat konten (`created_by`, `updated_by`, `uploaded_by`, `published_by`) | UUID akun | Riwayat perubahan peta | Kepentingan yang sah | Selama konten ada | Menjadi kosong (NULL) saat akun dihapus; kontennya tetap |
| A8 | Email sistem (SMTP klien) | Email dan nama penerima, isi undangan/reset password/pemberitahuan kunci | Mengelola akun | Kontrak | Mengikuti server email klien (di luar aplikasi) | Kebijakan email klien |
| A9 | Pengunjung Visitor dan Info Point | **Tidak ada akun dan tidak ada data pribadi di server.** Peramban pengunjung menyimpan pilihan bahasa dan status tur (`localStorage`) serta cache peta (service worker) | Bahasa, tur, peta offline | Tidak diperlukan, karena data hanya tersimpan di perangkat pengunjung | Sampai pengunjung menghapus data peramban | Pengunjung sendiri |
| A10 | Analitik penggunaan (T-591) | Dirancang **anonim** tanpa ID perangkat; belum dibuat | Statistik pemakaian | Kepentingan yang sah | Diatur klien (T-601b) | T-601b |
| A11 | Log kontainer (Docker) | Log GoTrue/PostgREST dapat memuat IP dan email saat masuk | Diagnosis gangguan | Kepentingan yang sah | **Belum dibatasi otomatis.** Klien disarankan mengatur rotasi log Docker (`max-size`, `max-file`) | Rotasi log |
| A12 | Cadangan (`deploy/backup.sh`) | Salinan seluruh database dan Storage | Pemulihan bencana | Kepentingan yang sah | `RETENTION_DAYS`, bawaan 14 hari | Data yang dihapus di aplikasi masih ada di cadangan sampai cadangan itu dihapus otomatis. Hal ini perlu disebut saat menjawab permintaan hapus |
| A13 | Lisensi dan check-in | ID lisensi dan ID instalasi (bukan data pribadi), nama organisasi klien | Validasi lisensi | Kontrak | Selama lisensi | — |

## B. Landing page dan trial ter-hosting (pengendali: vendor)

Disimpan di project Supabase vendor dan Cloudflare Pages (`docs/23-trial-hosting.md`).

| # | Data | Isi | Tujuan | Dasar | Masa simpan | Cara hapus |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | Form trial (`hosting.trial_requests`) | Nama, instansi, jabatan, email, telepon, jenis dan luas gedung, bahasa, alamat IP, status | Membuat trial, mencegah penyalahgunaan, menghubungi calon klien | Persetujuan (mengirim form) dan langkah sebelum kontrak | 12 bulan, kecuali menjadi klien | Otomatis (migrasi 0051); atas permintaan lewat email vendor |
| B2 | Akun trial | Sama dengan A1–A6, di venue trial | Menjalankan trial | Kontrak (syarat trial) | Sampai hari ke-24 (7 hari setelah trial berakhir) | Otomatis (`trial-lifecycle`) |
| B3 | Daftar blokir (`hosting.blocklist`) | Email atau domain yang diblokir | Mencegah penyalahgunaan trial | Kepentingan yang sah | Sampai dihapus staf vendor | Dasbor vendor |
| B4 | Staf vendor (`hosting.vendor_staff`, akun + TOTP) | Seperti A1–A3 | Mengelola trial | Kontrak kerja | Selama staf aktif | Hapus akun |
| B5 | Email ke dan dari vendor | Alamat, nama, isi pesan | Verifikasi trial, dukungan, penjualan | Persetujuan / kontrak | 12 bulan, kecuali menjadi klien | Manual |

## C. Tidak dikumpulkan

- Lokasi GPS atau posisi pengunjung di dalam gedung. Titik asal berasal dari QR yang dipindai,
  tidak dilacak.
- Cookie pelacak atau iklan di Visitor, Info Point, maupun landing page.
- Data pribadi spesifik (kesehatan, biometrik, dan sebagainya; Pasal 4 ayat 2).

## Celah yang diketahui

| Celah | Rencana |
| --- | --- |
| Log kontainer belum dirotasi otomatis (A11) | Tambahkan opsi `logging` di `deploy/compose.yml`. Dicatat sebagai pertanyaan terbuka T-601a |
| Pemberitahuan privasi analitik di Visitor (A10) | T-601b |
| `account_notices` tanpa batas waktu selama akun ada (A5) | Volume kecil (paling banyak satu per jam per akun). Ditinjau ulang bersama T-532 (audit log lengkap) |
