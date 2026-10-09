# 23 · Trial ter-hosting dan demo publik (F2-K)

Keputusan pemilik 2026-10-09. Dokumen ini berisi PRD, arsitektur, dan pembagian task untuk
trial otomatis yang berjalan di server vendor (bukan di server klien). Instalasi on-premise
(`deploy/`, lisensi berkas, T-511, T-595 versi lisensi) **ditunda** dan tidak diubah perilakunya.

## 1 · Ringkasan keputusan

| Hal | Keputusan |
| --- | --- |
| Tujuan | Calon klien yang meminta trial langsung mendapat Admin dan Visitor sendiri, tanpa campur tangan vendor |
| Infrastruktur | Satu project **Supabase Free** + **Cloudflare Pages Free** + domain `panduarah.my.id` (DNS di Cloudflare Free). Biaya Rp0 per bulan |
| Pemisahan antar-trial | **Ruang kerja per venue** di satu database: pengguna trial hanya bisa mengakses venue miliknya, dijaga RLS |
| Lama trial | **17 hari, tetap** (pemohon tidak memilih). Pengingat hari ke-14, terkunci hari ke-17, dihapus hari ke-24 |
| Batas data trial | 1 venue, 1 gedung, 3 lantai, 1.000 fitur per lantai, 100 lokasi, 10 titik asal, 2 Info Point, 2 pengguna, Storage 50 MB, berkas 5 MB, impor 100 baris, 10 publish per hari |
| Kapasitas | Maksimal **15 trial aktif**. Lebih dari itu pemohon masuk antrean |
| Fitur | 3D dan Info Point aktif. **Impor CAD tidak tersedia** (converter Python butuh server) |
| Demo publik | Visitor saja, data contoh, tanpa login, di `app.panduarah.my.id/v/demo` (menggantikan sebagian T-605) |
| Dashboard vendor | Dibuat setelah trial otomatis jalan (tahap 6), di `vendor.panduarah.my.id` |
| Naik kelas | Pindah ke Supabase Pro bila trial aktif sering penuh. Arsitektur tidak berubah |

## 2 · PRD

### 2.1 Masalah

Calon klien harus menunggu vendor memasang server sebelum bisa mencoba PanduArah. Vendor
belum punya server, dan setiap trial manual memakan waktu vendor.

### 2.2 Pengguna

| Pengguna | Kebutuhan |
| --- | --- |
| Calon klien (pengelola gedung) | Mencoba Admin (gambar peta, lokasi, publish) dan Visitor dengan gedungnya sendiri, segera |
| Pengunjung calon klien | Membuka Visitor trial dari HP lewat link atau QR |
| Pengunjung landing | Melihat contoh tanpa mendaftar (demo publik) |
| Vendor | Tahu siapa yang trial, memantau kapasitas, menindaklanjuti calon klien |

### 2.3 Alur pengguna

```
① panduarah.my.id → "Lihat demo" → app.panduarah.my.id/v/demo (tanpa login)
② panduarah.my.id → "Minta trial" → isi form (nama, instansi, jabatan, email, telepon,
   jenis gedung, luas, bahasa)
③ Email verifikasi → klik link (berlaku 24 jam)
④ Sistem: cek blokir dan trial sebelumnya, cek kapasitas
   ├─ penuh    → status "antre", email "Anda dalam antrean", vendor diberi tahu
   └─ tersedia → buat ruang kerja:
                 venue (nama instansi, slug unik) + data contoh sesuai jenis gedung,
                 akun Admin pemohon (hanya venue itu), masa trial 17 hari
⑤ Email "Trial aktif": link Admin (admin.panduarah.my.id), link atur password,
   link Visitor (app.panduarah.my.id/v/<slug>), panduan singkat
⑥ Hari 0–17: pemohon memakai Admin dan Visitor. Banner "Trial — sisa N hari"
⑦ Hari 14: email pengingat
⑧ Hari 17: terkunci. Admin menampilkan "Trial berakhir, hubungi kami".
   Visitor menampilkan halaman yang sama. Pemohon antrean berikutnya diproses
⑨ Hari 24: venue, berkas, dan akun dihapus otomatis. Data calon klien (leads) tetap
   disimpan untuk vendor
```

### 2.4 Kebutuhan fungsional

| ID | Kebutuhan |
| --- | --- |
| FR-HT-01 | Form trial di landing mengirim permintaan; pemohon menerima email verifikasi |
| FR-HT-02 | Ruang kerja dibuat otomatis setelah verifikasi, tanpa tindakan vendor |
| FR-HT-03 | Satu trial per alamat email, per domain email kantor (domain umum seperti gmail.com dihitung per alamat), dan dibatasi laju per IP |
| FR-HT-04 | Pengguna trial hanya bisa membaca dan mengubah venue miliknya. Pengaturan sistem, lisensi, catatan peristiwa, dan pengguna lain tidak terlihat |
| FR-HT-05 | Batas data trial (§1) ditolak di server dengan pesan "Batas trial tercapai: … n/n" |
| FR-HT-06 | Venue baru berisi data contoh sesuai jenis gedung, bisa dihapus atau diubah pemohon |
| FR-HT-07 | Visitor trial di `/v/<slug>`; Info Point di `/ip/<kode>` seperti biasa |
| FR-HT-08 | Banner sisa hari di Admin; email pengingat hari ke-14 |
| FR-HT-09 | Hari ke-17 Admin dan Visitor venue itu terkunci; snapshot publik tidak bisa dibaca lagi |
| FR-HT-10 | Hari ke-24 seluruh data venue, berkas Storage, dan akun pemohon dihapus |
| FR-HT-11 | Bila kapasitas penuh, permintaan antre dan diproses otomatis saat ada trial yang berakhir |
| FR-HT-12 | Vendor menerima email setiap trial baru, antre, dan berakhir |
| FR-HT-13 | Demo publik `/v/demo` selalu tersedia dan tidak bisa diubah pengunjung |
| FR-HT-14 | Dashboard vendor: ringkasan kapasitas, daftar trial, perpanjang (total ≤ 17 hari), kunci, hapus, ekspor leads CSV, blokir email/domain |

### 2.5 Kebutuhan non-fungsional

| ID | Kebutuhan |
| --- | --- |
| NFR-HT-01 | Ruang kerja siap ≤ 60 detik setelah klik verifikasi |
| NFR-HT-02 | Tidak ada jalur (REST, RPC, Storage, Edge Function) yang membuat pengguna trial membaca data venue lain. Dibuktikan pgTAP dan test integrasi |
| NFR-HT-03 | Perilaku instalasi on-premise tidak berubah: semua test yang ada tetap hijau tanpa diubah maknanya |
| NFR-HT-04 | Total pemakaian tetap di bawah batas Supabase Free (database 500 MB, Storage 1 GB) pada 15 trial penuh |
| NFR-HT-05 | Email lewat SMTP Gmail ≤ 500 per hari |
| NFR-HT-06 | Kredensial (SMTP, service role) hanya di rahasia lingkungan Supabase atau GitHub |

### 2.6 Di luar lingkup

- Pembayaran online dan konversi otomatis ke lisensi berbayar.
- Memindahkan data trial ke server klien (dibahas bersama instalasi on-premise).
- Impor CAD di trial hosting.
- Subdomain per trial (`<slug>.panduarah.my.id`); Cloudflare Pages Free tidak mendukung wildcard.

### 2.7 Ukuran keberhasilan

- Waktu dari klik verifikasi ke Admin siap ≤ 60 detik.
- Persentase pemohon yang publish peta pertama dalam masa trial.
- Jumlah trial yang ditindaklanjuti vendor (dari leads).

## 3 · Arsitektur

### 3.1 Komponen

```
                          Cloudflare Free (DNS, HTTPS)
     ┌─────────────────┬──────────────────┬──────────────────┬─────────────────────┐
     ▼                 ▼                  ▼                  ▼                     ▼
 panduarah.my.id   admin.panduarah.my.id  app.panduarah.my.id   vendor.panduarah.my.id   (tahap 6)
 Pages:         Pages:              Pages:             Pages:
 apps/landing   apps/admin          apps/visitor       apps/vendor
     │                 │                  │                  │
     └─────────────────┴────────┬─────────┴──────────────────┘
                                ▼
               Supabase Free — satu project "panduarah"
               ├─ Postgres + PostGIS: semua venue (demo + trial), skema `hosting`
               ├─ Auth: akun pemohon, akun vendor (SMTP Gmail kustom)
               ├─ Storage: snapshots/, public-assets/, floor-plans/ per venue
               ├─ Edge Functions: trial-request, trial-verify, trial-lifecycle,
               │                  publish, admin-users, …
               └─ pg_cron + pg_net: panggil trial-lifecycle tiap jam
                                ▲
                GitHub Actions cron (gratis): ping harian agar project tidak dijeda
```

Admin dan Visitor memakai build yang sama dengan versi on-premise. Perbedaan hosting
diaktifkan lewat pengaturan server (§3.4), bukan cabang kode.

### 3.2 Ruang kerja per venue

Dasar keamanan fitur ini. Saat ini peran pengguna global (`profiles.role`) dan
`app.can_read()` / `app.can_edit()` tidak melihat venue.

Rancangan:
- Tabel baru `public.venue_members (venue_id, user_id)`.
- Kolom baru `profiles.all_venues boolean not null default true`. Pengguna on-premise tetap
  `true`, sehingga perilaku lama tidak berubah. Pengguna trial `false`.
- Fungsi baru `app.can_access_venue(venue_id)`: `all_venues` atau anggota venue itu.
- Policy semua tabel ber-`venue_id` ditambah syarat `app.can_access_venue(venue_id)`.
  Tabel tanpa `venue_id` (lantai lewat gedung, dsb.) memakai venue induknya.
- Fungsi `security definer` yang menerima `venue_id` (publish, impor, template, kuota)
  memeriksa `app.can_access_venue`.
- Pengguna trial berperan `admin` tetapi **tidak pernah** `super_admin`, sehingga pengaturan
  sistem, lisensi, dan catatan peristiwa tetap tertutup. Membuat venue baru ditolak bila
  `all_venues = false`.
- Halaman Pengguna di Admin: pengguna trial hanya melihat dan mengundang anggota venue-nya
  (batas 2 pengguna). Edge Function `admin-users` mengikuti aturan yang sama.
- Storage: path berkas sudah berawalan `{venue_id}/`; policy tulis dan baca staf
  ditambah `app.can_access_venue`.

Penamaan memakai `venue`, bukan istilah industri (lihat `CLAUDE.md`).

### 3.3 Data trial (skema `hosting`)

Skema terpisah, tidak diekspos ke PostgREST untuk pengguna trial. Hanya Edge Function
(service role) dan akun vendor yang bisa membaca.

| Tabel | Isi |
| --- | --- |
| `hosting.trial_requests` | Isian form, IP, bahasa, token verifikasi (hash), status: `unverified` · `queued` · `active` · `locked` · `deleted` · `rejected` |
| `hosting.trials` | `venue_id`, `user_id`, `request_id`, `started_at`, `ends_at`, `locked_at`, `deleted_at`, `reminded_at` |
| `hosting.blocklist` | Email atau domain yang ditolak |
| `hosting.vendor_staff` | `user_id` akun vendor (dasbor) |

Leads = `trial_requests`; tetap ada setelah venue dihapus.

### 3.4 Mode hosting dan kuota per venue

- `app.server_settings` diberi kolom `hosting_mode boolean default false`. On-premise
  `false`; project vendor `true`.
- Saat `hosting_mode`, kuota dibaca dari batas trial per venue (§1) bila venue punya baris
  aktif di `hosting.trials`; venue demo dan venue vendor memakai lisensi server.
- Fungsi kuota yang ada (migrasi 0030, 0038) dihitung per venue untuk venue trial. Pesan
  galat sama dengan trial on-premise.
- Lisensi server project vendor: paket `hosting` tanpa `cad_import`, diterbitkan dengan
  kunci vendor asli.

### 3.5 Edge Functions

| Fungsi | Tugas |
| --- | --- |
| `trial-request` (ada, diubah) | Validasi, honeypot, batas laju; simpan `trial_requests`; kirim email verifikasi (bukan lagi email "kami hubungi") |
| `trial-verify` (baru) | Cek token, blokir, duplikat, kapasitas → antre atau `provisionTrial` |
| `trial-lifecycle` (baru) | Dipanggil pg_cron tiap jam: pengingat hari 14, kunci hari 17, hapus hari 24, proses antrean |

`provisionTrial` (satu transaksi SQL `hosting.provision_trial`): buat venue dan slug, salin
data contoh dari fixture demo sesuai jenis gedung, buat akun Auth dan profil
(`role = admin`, `all_venues = false`), anggota venue, baris `trials`, lalu publish pertama.

Mengunci: `trials.locked_at` diisi, hapus `snapshots/{venue}/latest.json` dari Storage
(bucket snapshot dibaca publik, jadi akses tidak bisa dicegah lewat RLS saja), dan RLS
menolak semua tulis ke venue terkunci. Visitor yang tidak menemukan snapshot menampilkan
"Trial berakhir".

### 3.6 Aplikasi

| Aplikasi | Perubahan |
| --- | --- |
| `apps/landing` | Form tanpa pilihan durasi; halaman "cek email Anda"; halaman hasil verifikasi; tombol "Lihat demo" |
| `apps/admin` | Banner sisa hari dari venue; layar "Trial berakhir"; sembunyikan menu sistem untuk `all_venues = false` (otorisasi tetap di server) |
| `apps/visitor` | `/v/:venue` menerima slug selain UUID; layar "Trial berakhir" (teks lewat i18next) |
| `apps/vendor` (baru, tahap 6) | Dasbor §2.4 FR-HT-14. Tidak ikut paket instalasi klien |
| Admin & Visitor | Alamat Supabase tetap dari env build (`VITE_SUPABASE_URL`), diisi di pengaturan Cloudflare Pages |

### 3.7 Keamanan

- Isolasi antar-trial dibuktikan dengan pgTAP untuk setiap tabel ber-`venue_id`, setiap fungsi
  `security definer`, dan setiap policy Storage: pengguna trial A tidak bisa membaca atau
  mengubah data trial B.
- Token verifikasi acak, disimpan sebagai hash, sekali pakai, berlaku 24 jam.
- Akun vendor dengan 2FA (T-592) sebelum dasbor dibuka.
- Service role key hanya di rahasia Edge Function.
- Tinjauan `security-reviewer` wajib untuk T-611, T-614, T-617.

### 3.8 Kompatibilitas on-premise

- Semua kolom dan tabel baru bersifat tambahan dengan default yang mempertahankan perilaku lama
  (`all_venues = true`, `hosting_mode = false`).
- Skema `hosting` dan fungsi `trial-verify` / `trial-lifecycle` dikecualikan dari image klien,
  seperti `trial-request` (T-505).
- Tidak ada kolom yang dihapus atau diganti nama.

### 3.9 Risiko

| Risiko | Mitigasi |
| --- | --- |
| Celah RLS membocorkan data antar-trial | Fungsi akses tunggal `app.can_access_venue`, pgTAP per tabel, tinjauan keamanan |
| Project Free dijeda karena tidak aktif | Ping harian GitHub Actions |
| Kapasitas Free habis | Batas kecil, 15 trial aktif, hapus otomatis hari 24, pantau di dasbor; naik ke Pro |
| Spam pendaftaran | Verifikasi email, batas laju per IP, blokir domain, honeypot |
| Gmail membatasi kiriman | ≤ 4 email per trial; pindah ke penyedia SMTP transaksional bila perlu |

## 4 · Task

| Task | Judul | Bergantung pada | Isi |
| --- | --- | --- | --- |
| T-611 | Ruang kerja per venue | – | §3.2: `venue_members`, `profiles.all_venues`, `app.can_access_venue`, RLS dan Storage, `admin-users`; pgTAP isolasi |
| T-612 | Mode hosting dan kuota per venue | T-611 | §3.4: `hosting_mode`, kuota trial per venue, venue terkunci menolak tulis |
| T-613 | Slug venue dan demo publik | T-611 | `venues.slug`, `/v/:venue` menerima slug, demo `/v/demo` dari fixture `db:seed-demo` |
| T-614 | Permintaan dan verifikasi trial | T-612, T-613 | §3.3, §3.5: skema `hosting`, `trial-request` diubah, `trial-verify`, `provision_trial`, email aktif |
| T-615 | Siklus hidup trial | T-614 | `trial-lifecycle` + pg_cron: pengingat, kunci, hapus, antrean; layar "Trial berakhir" Admin dan Visitor; banner |
| T-616 | Landing untuk trial otomatis | T-614 | Form tanpa durasi, halaman cek email dan hasil verifikasi, tombol "Lihat demo" |
| T-617 | Dasbor vendor minimal | T-615, T-592 | `apps/vendor` §2.4 FR-HT-14 |
| T-618 | Panduan setup hosting | T-615 | `deploy/hosting/README.md`: Supabase (migrasi, functions, rahasia, SMTP Auth, pg_cron), Cloudflare Pages (4 situs, env), DNS, GitHub Actions ping |

Rincian langkah dan kriteria selesai setiap task ditulis di awal task masing-masing, mengikuti
`docs/templates/task.md`, setelah rencana T-611 disetujui pemilik.
