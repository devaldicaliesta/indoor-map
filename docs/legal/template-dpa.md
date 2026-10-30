# Template perjanjian pemrosesan data (DPA) vendor–klien

Template awal, **bukan naskah final**. **[tinjau]** Wajib ditinjau konsultan hukum kedua
pihak. Dipakai bersama kontrak lisensi (T-602). DPA berlaku bila vendor dapat mengakses data
pribadi di instalasi klien, misalnya saat dukungan teknis, migrasi, atau pemulihan cadangan.
Dalam pemakaian on-premise biasa, vendor tidak menerima data pribadi.

---

## Perjanjian Pemrosesan Data Pribadi

Antara **{Nama Klien}** ("Pengendali"), {alamat}, dan **{Badan hukum vendor PanduArah}**
("Prosesor"), {alamat}, sebagai lampiran dari {Perjanjian Lisensi No. …} ("Perjanjian Utama").

### Pasal 1 · Definisi

Istilah mengikuti UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi ("UU PDP"). "Data"
adalah data pribadi yang diproses Prosesor atas nama Pengendali berdasarkan Perjanjian ini.

### Pasal 2 · Ruang lingkup

1. Pokok pemrosesan: dukungan teknis, instalasi, pembaruan, migrasi, dan pemulihan aplikasi
   PanduArah di server Pengendali.
2. Jenis Data dan subjek data: lihat Lampiran A, yang diambil dari
   `docs/legal/inventaris-data.md` bagian A.
3. Lama pemrosesan: selama Perjanjian Utama berlaku, atau selama tiket dukungan berlangsung.

### Pasal 3 · Kewajiban Prosesor

1. Memproses Data **hanya atas perintah tertulis** Pengendali (UU PDP Pasal 51), termasuk tiket
   dukungan yang disetujui.
2. Tidak menyalin Data ke luar server Pengendali kecuali diminta tertulis. Salinan yang
   diperlukan (misalnya cadangan untuk diagnosis) dienkripsi dan dihapus paling lambat {N} hari
   setelah tiket selesai.
3. Membatasi akses ke staf yang terikat kewajiban kerahasiaan.
4. Menerapkan langkah keamanan teknis dan organisasi (Lampiran B).
5. Memberi tahu Pengendali tentang kegagalan pelindungan Data **paling lambat 24 jam** setelah
   diketahui, sesuai `docs/legal/prosedur-insiden.md`, agar Pengendali dapat memenuhi tenggat
   3 × 24 jam (UU PDP Pasal 46).
6. Membantu Pengendali memenuhi permintaan subjek data. Fitur yang tersedia: export dan hapus
   data akun, masa simpan log audit.
7. Tidak memakai subprosesor tanpa persetujuan tertulis Pengendali.
8. Saat Perjanjian berakhir, mengembalikan atau memusnahkan seluruh Data yang ada pada Prosesor
   dan menyampaikan pernyataan tertulis.

### Pasal 4 · Kewajiban Pengendali

1. Memastikan dasar pemrosesan yang sah bagi Data (UU PDP Pasal 20).
2. Mengatur masa simpan log audit dan analitik di aplikasi sesuai kebijakannya.
3. Menerbitkan kebijakan privasi Visitor (template `docs/legal/kebijakan-privasi-visitor.md`).
4. Menunjuk kontak pelindungan data pribadi: {nama, email, telepon}.

### Pasal 5 · Audit

Pengendali dapat meminta bukti kepatuhan Prosesor paling banyak {sekali setahun}, dengan
pemberitahuan {30} hari sebelumnya.

### Pasal 6 · Transfer ke luar wilayah

Prosesor tidak mentransfer Data ke luar wilayah Indonesia tanpa persetujuan tertulis
Pengendali dan tanpa memenuhi UU PDP Pasal 56. **[tinjau]**

### Pasal 7 · Penutup

Hal yang tidak diatur di sini mengikuti Perjanjian Utama. Bila bertentangan dalam hal
pelindungan Data, Perjanjian ini yang berlaku.

---

### Lampiran A · Data dan subjek data

| Subjek | Data | Rujukan inventaris |
| --- | --- | --- |
| Staf Pengendali pengguna Admin | Nama, email, role, waktu masuk, IP sesi, log audit | A1–A7 |
| Pengunjung gedung | Tidak ada data pribadi di server. Analitik anonim bila diaktifkan | A9, A10 |
| Semua di atas | Salinan cadangan | A12 |

### Lampiran B · Langkah keamanan

- Otorisasi di server (RLS PostgreSQL); kata sandi di-hash, rahasia SMTP di Vault.
- Penguncian akun setelah gagal masuk berulang, pemberitahuan ke pemilik akun.
- Log audit untuk masuk, perubahan role, publish, pengaturan, export dan hapus data akun.
- HTTPS di gateway (`deploy/Caddyfile`), cadangan terjadwal dengan masa simpan terbatas.
- Akses dukungan vendor hanya lewat akun yang dibuat Pengendali dan dihapus setelah selesai.
