# Prosedur insiden kebocoran data pribadi (draf)

Berlaku untuk vendor PanduArah, baik sebagai pengendali (landing, trial ter-hosting) maupun
sebagai prosesor (dukungan teknis instalasi klien), dan menjadi acuan bagi klien untuk
instalasi on-premise. Dasar: UU PDP **Pasal 46**. Kegagalan pelindungan data pribadi wajib
diberitahukan secara tertulis **paling lambat 3 × 24 jam** kepada subjek data dan lembaga.
**[tinjau]** Konsultan memastikan rujukan pasal, aturan pelaksana, dan instansi tujuan
pemberitahuan yang berlaku saat dokumen ini dipakai.

## 1. Peran

| Peran | Siapa | Tugas |
| --- | --- | --- |
| Koordinator insiden | {nama, vendor} | Memimpin penanganan, mengambil keputusan, menjadi satu-satunya juru bicara |
| Teknis | {nama} | Penahanan, forensik, pemulihan |
| Komunikasi/legal | {nama, konsultan} | Naskah pemberitahuan, hubungan dengan klien dan lembaga |
| Kontak klien | Pejabat Pelindungan Data Pribadi atau penanggung jawab TI klien (tercantum di DPA) | Keputusan sebagai pengendali untuk instalasi klien |

## 2. Alur dan tenggat

Jam 0 adalah saat insiden **diketahui**, bukan saat terjadi.

| Waktu | Langkah |
| --- | --- |
| Jam 0 | Catat di log insiden: waktu diketahui, pelapor, gejala. Bentuk tim |
| ≤ 4 jam | **Tahan**: cabut kunci atau sesi yang bocor (ganti `SERVICE_ROLE_KEY`/JWT secret, keluarkan semua sesi), tutup akses yang disalahgunakan, nonaktifkan akun yang dibobol. Simpan bukti (log Docker, `audit_events`, log Supabase/Cloudflare) **sebelum** dirotasi |
| ≤ 24 jam | **Nilai**: data apa, berapa subjek, sejak kapan, apakah terenkripsi, risiko bagi subjek. Gunakan `docs/legal/inventaris-data.md` |
| ≤ 24 jam | Bila vendor sebagai **prosesor**: beri tahu klien (pengendali) secara tertulis, agar klien bisa memenuhi tenggat 3 × 24 jam |
| ≤ 3 × 24 jam | Pengendali mengirim **pemberitahuan tertulis** ke subjek data dan lembaga (lihat §3). Bila pengendali adalah klien, vendor menyiapkan bahan teknisnya |
| Setelah tertahan | **Pulihkan**: tambal celah, pulihkan dari cadangan bila perlu (`deploy/restore.sh`), pantau ulang |
| ≤ 14 hari | **Tinjauan pascainsiden**: penyebab, perbaikan permanen, pembaruan dokumen ini dan inventaris |

## 3. Isi pemberitahuan (Pasal 46 ayat 2)

Pemberitahuan tertulis paling sedikit memuat:

1. Data pribadi yang terungkap.
2. Kapan dan bagaimana data terungkap.
3. Upaya penanganan dan pemulihan oleh pengendali.

Tambahan yang disarankan: langkah yang bisa diambil subjek data (mengganti password, waspada
penipuan lewat email atau telepon) dan kontak untuk bertanya.

Untuk kasus tertentu, pengendali juga wajib memberi tahu **masyarakat** (Pasal 46 ayat 3).
**[tinjau]** Kriteria kewajibannya.

### Template pemberitahuan ke subjek data

> **Perihal: Pemberitahuan insiden data pribadi**
>
> Pada {tanggal} kami mengetahui bahwa {uraian singkat kejadian}. Data Anda yang terdampak:
> {daftar data}. Kejadian berlangsung {rentang waktu} melalui {cara}.
>
> Yang sudah kami lakukan: {penahanan, pemulihan}. Yang kami sarankan untuk Anda: {langkah}.
>
> Pertanyaan: {kontak}. {Nama pengendali}, {tanggal}.

## 4. Skenario umum di PanduArah

| Skenario | Penahanan |
| --- | --- |
| Kunci `service_role` atau JWT secret bocor | Ganti kunci di `.env` server, restart, keluarkan semua sesi. Periksa `audit_events` dan log PostgREST |
| Akun Super Admin dibobol | Nonaktifkan akun, cabut sesinya, periksa `audit_events` (export/hapus data akun, perubahan role, pengaturan) |
| Berkas cadangan hilang atau tersalin | Cadangan berisi seluruh database. Perlakukan sebagai kebocoran A1–A7 (inventaris) |
| Kebocoran database trial ter-hosting | Vendor adalah pengendali. Beri tahu calon klien (B1) dan pemilik akun trial (B2) |
| Laptop staf vendor yang memegang data klien hilang | Vendor sebagai prosesor. Beri tahu klien ≤ 24 jam |

## 5. Log insiden

Setiap insiden, termasuk yang ternyata bukan kebocoran, dicatat:
`{tanggal} · {ringkasan} · {data dan jumlah subjek} · {tindakan} · {pemberitahuan dikirim (ya/tidak, kapan)}`.
Log disimpan vendor paling sedikit {N} tahun. **[tinjau]**
