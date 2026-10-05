# Paket instalasi on-premise

Satu server menjalankan seluruh platform lewat Docker Compose:

| Layanan     | Isi                                                                 |
| ----------- | ------------------------------------------------------------------- |
| `web`       | Caddy: HTTPS, build statis Admin dan Visitor, gateway API           |
| `db`        | Postgres + PostGIS (image Supabase), pg_cron, pg_net                |
| `auth`      | Supabase Auth (GoTrue)                                              |
| `rest`      | PostgREST                                                           |
| `storage`   | Supabase Storage (berkas di volume lokal)                           |
| `functions` | Edge Runtime berisi `supabase/functions`                            |
| `cad`       | `services/cad-converter` (DXF → gambar per layer)                   |

Realtime, Studio, Kong, dan analitik Supabase tidak dipasang karena tidak dipakai aplikasi.
Peran Kong (routing dan CORS) diambil Caddy.

## Spesifikasi server minimum

- Ubuntu Server LTS (22.04 atau 24.04), x86_64
- 4 vCPU, 8 GB RAM (minimum 4 GB untuk satu venue kecil), disk 40 GB SSD (minimum 20 GB)
  ditambah ruang backup ±3× ukuran data
- Docker Engine 24+ dengan plugin Compose v2, `git`, `openssl`
- Akses internet saat instalasi dan pembaruan (mengunduh image dan dependensi build). Setelah
  terpasang, layanan berjalan tanpa internet, kecuali check-in lisensi online ke vendor.
- Jam server disinkronkan NTP (lisensi menolak jam yang mundur)

## Jaringan

Tiga nama domain mengarah ke IP server:

| Domain         | Contoh                   | Isi                                        |
| -------------- | ------------------------ | ------------------------------------------ |
| Admin          | `admin.peta.klien.co.id` | Aplikasi Admin                             |
| Visitor        | `peta.klien.co.id`       | Aplikasi Visitor dan Info Point (`/ip/…`)  |
| API            | `api.peta.klien.co.id`   | Auth, REST, Storage, Edge Function, `/cad` |

Port masuk: **80** dan **443** (TCP). Port lain (database, layanan internal) hanya ada di
jaringan Docker dan tidak dibuka ke luar. Port keluar: 443 ke layanan lisensi vendor bila
memakai aktivasi online.

HTTPS, pilih salah satu saat instalasi:

- `auto`: sertifikat Let's Encrypt otomatis. Domain harus bisa dijangkau dari internet di port 80.
- `files`: sertifikat klien. Letakkan `deploy/certs/cert.pem` (rantai lengkap) dan
  `deploy/certs/key.pem` sebelum instalasi.
- `internal`: CA internal Caddy, untuk jaringan tertutup atau uji. Pasang sertifikat root dari
  volume `indoor-map_caddy-data` (`/data/caddy/pki/authorities/local/root.crt`) di perangkat
  pengguna, karena tanpa itu browser menolak service worker Visitor.

Bila server keluar ke internet lewat proxy yang memeriksa HTTPS, salin CA proxy ke
`deploy/ca/*.crt` (lihat `deploy/ca/README.md`).

## Instalasi

1. Pasang Docker:

   ```sh
   curl -fsSL https://get.docker.com | sh
   ```

2. Ambil paket rilis dari vendor dan masuk ke foldernya, misalnya ke `/opt/indoor-map`:

   ```sh
   git clone <repo rilis vendor> /opt/indoor-map && cd /opt/indoor-map
   git checkout <tag rilis>
   ```

3. Jalankan installer sebagai root:

   ```sh
   sudo ./deploy/install.sh
   ```

   Installer melakukan hal-hal berikut:

   - memeriksa prasyarat dan menolak build yang masih memakai kunci lisensi dev;
   - menanyakan domain, mode HTTPS, dan alamat layanan lisensi vendor (boleh kosong untuk
     aktivasi manual);
   - membangkitkan semua rahasia di server ini, tanpa kredensial bawaan: password database,
     JWT, kunci anon/service, dan rahasia hook email Auth `v1,whsec_…`;
   - membuat `deploy/.env` dengan izin 600;
   - build image, menjalankan layanan dan migrasi, lalu mengisi alamat Edge Function untuk
     database;
   - menjadwalkan backup harian.

   Untuk otomasi tanpa terminal, isi variabel lingkungan `ADMIN_DOMAIN`, `VISITOR_DOMAIN`,
   `API_DOMAIN`, `TLS_MODE` (`auto`/`files`/`internal`), `ACME_EMAIL` (untuk `auto`), dan
   `LICENSE_VENDOR_URL`.

4. Buka `https://<domain Admin>/aktivasi`:
   - salin **ID instalasi** dan kirim ke vendor;
   - pasang berkas lisensi (atau masukkan kunci untuk aktivasi online);
   - buat Super Admin pertama.
5. Di Admin, buka **Pengaturan Sistem**:
   - isi URL publik Visitor (`https://<domain Visitor>`);
   - isi SMTP agar email reset password, undangan, dan pemberitahuan akun terkirim.

Menjalankan `install.sh` ulang aman: `deploy/.env` yang sudah ada dipakai lagi.

## Backup

`deploy/backup.sh` berjalan setiap hari pukul 02.30 lewat `/etc/cron.d/indoor-map-backup`.
Layanan tidak berhenti selama backup. Setiap backup menjadi satu folder
`deploy/backups/<tanggal-jam>/` berisi:

- `db/base.tar.gz`: salinan fisik database (`pg_basebackup`), termasuk akun dan lisensi
- `storage.tar.gz`: berkas Storage (gambar denah, ikon, snapshot publish)
- `env`: salinan `deploy/.env`. **Rahasia**: folder backup hanya bisa dibaca root.
- `version`: versi aplikasi saat backup

Backup lebih tua dari 14 hari dihapus otomatis. Salin folder `deploy/backups` ke media lain
(NAS atau disk eksternal) sesuai kebijakan TI klien. Backup manual kapan saja:

```sh
sudo ./deploy/backup.sh
```

## Pemulihan

```sh
sudo ./deploy/restore.sh latest                      # backup terbaru
sudo ./deploy/restore.sh deploy/backups/20261005-023000
```

Seluruh data saat ini diganti dengan isi backup, dan layanan berhenti selama pemulihan. Di
server baru:

1. Pasang paket rilis dengan versi yang sama dengan berkas `version` di backup.
2. Salin folder backup ke `deploy/backups/`.
3. Jalankan `restore.sh`. Bila `deploy/.env` belum ada, file itu diambil dari backup.
4. Jalankan `install.sh` untuk build image dan memasang jadwal backup.
5. Arahkan DNS ke server baru.

Lisensi terikat ID instalasi yang ikut dipulihkan, jadi tidak perlu aktivasi ulang.

## Pembaruan

```sh
sudo ./deploy/upgrade.sh <tag rilis>
```

Urutannya:

1. backup;
2. ambil versi baru (`git fetch` + checkout);
3. build image;
4. jalankan layanan;
5. migrasi database;
6. health check.

Bila build gagal, versi lama tetap berjalan tanpa tersentuh. Bila migrasi atau health check
gagal, upgrade otomatis kembali ke versi sebelumnya dan memulihkan backup langkah 1. Data
yang masuk selama pembaruan (beberapa menit) ikut kembali ke keadaan backup.

## Perintah harian

```sh
cd /opt/indoor-map
docker compose -f deploy/compose.yml --env-file deploy/.env ps      # status
docker compose -f deploy/compose.yml --env-file deploy/.env logs -f functions
docker compose -f deploy/compose.yml --env-file deploy/.env restart web
```
