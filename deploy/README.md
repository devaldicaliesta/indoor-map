# Paket instalasi on-premise PanduArah

> Trial ter-hosting milik vendor (Supabase + Cloudflare Pages, F2-K) bukan paket ini: lihat
> `deploy/hosting/README.md`.

Satu server menjalankan seluruh platform PanduArah lewat Docker Compose:

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

Klien menerima **image Docker jadi**, bukan kode sumber. Image `web`, `functions`, dan
`cad-converter` dibangun vendor dengan kunci publik lisensi vendor di dalamnya, sehingga kunci
itu tidak bisa diganti lalu di-build ulang di server klien.

## Bagian 1 · Rilis (vendor)

Dikerjakan di mesin vendor dengan checkout repo, Docker, dan kunci lisensi vendor
(`license-cli keygen`, lihat `tools/license-cli/README.md`). Folder kunci tidak boleh berada di
dalam repo.

```sh
git checkout <tag rilis>          # mis. v1.2.0; rilis selalu dibangun dari commit
deploy/build-release.sh 1.2.0 --public-key ~/indoor-license-keys/license-public.b64 --save
```

| Opsi                 | Hasil                                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| `--save`             | Semua image (aplikasi dan Supabase) ikut di arsip sebagai `images.tar`: untuk server tanpa internet |
| `--push <registry>`  | Image aplikasi didorong ke registry privat vendor (`<registry>/panduarah/*:<versi>`); server klien menariknya saat instalasi |

Keduanya boleh dipakai bersamaan. Di balik proxy, isi `DOCKER_BUILD_FLAGS` (mis.
`--network host --build-arg HTTPS_PROXY=…`) dan salin CA proxy ke `deploy/ca/*.crt`.

Skrip ini:

1. menolak tree yang belum di-commit, lalu mengambil kode commit itu (`git archive`) ke folder
   sementara;
2. menanam kunci publik vendor di salinan itu. Kunci DEV (`tools/license-cli/dev-keys/`)
   ditolak, karena kunci privatnya ada di repo. Repo sendiri tetap memakai kunci DEV untuk test;
3. membangun image `panduarah/web`, `panduarah/functions`, dan `panduarah/cad-converter` bertag
   versi, lalu memeriksa bahwa image `functions` memakai kunci vendor;
4. menyusun paket klien: mengambil pemberitahuan lisensi pihak ketiga dari setiap image
   (`licenses/`) dan daftar paket OS per image untuk penawaran kode sumber GPL
   (`SUMBER-TERBUKA.md`), lalu menolak paket bila memuat kode sumber (`apps/`, `packages/`, …),
   kunci lisensi, `.env`, `build:` di compose, atau pemanggilan `git`/`pnpm`;
5. membuat `deploy/out/panduarah-<versi>.tar.gz` beserta `.sha256`.

Isi arsip:

```
panduarah-<versi>/
  compose.yml          hanya image:, tanpa build:
  install.sh  upgrade.sh  rollback.sh  backup.sh  restore.sh  migrate.sh  lib.sh
  migrations/*.sql     migrasi database (SQL)
  db/                  roles.sql, pg_hba.conf
  release.env          APP_VERSION, IMAGE_PREFIX, commit
  SUMBER-TERBUKA.md    komponen sumber terbuka, termasuk GPL, dan penawaran kode sumbernya
  licenses/            pemberitahuan pihak ketiga per app/image dan daftar paket OS per image
  dev-hook-secret.sha256
  images.tar           (dengan --save)
  README.md
```

Kirim arsip dan berkas `.sha256` ke klien.

Image yang dikirim memuat komponen GPL (PostGIS, paket OS Alpine/Debian; lihat
`SUMBER-TERBUKA.md`). Vendor wajib bisa memenuhi penawaran kode sumber di dokumen itu selama
tiga tahun per rilis, jadi daftar `licenses/os-packages/` setiap rilis ikut diarsipkan vendor.

## Bagian 2 · Server klien

### Spesifikasi server minimum

- Ubuntu Server LTS (22.04 atau 24.04), x86_64
- 4 vCPU, 8 GB RAM (minimum 4 GB untuk satu venue kecil), disk 40 GB SSD (minimum 20 GB)
  ditambah ruang backup ±3× ukuran data
- Docker Engine 24+ dengan plugin Compose v2, `openssl`
- Internet tidak dibutuhkan bila arsip rilis berisi `images.tar`. Tanpa `images.tar`, server
  menarik image dari registry vendor dan Docker Hub. Setelah terpasang, layanan berjalan tanpa
  internet, kecuali check-in lisensi online ke vendor.
- Jam server disinkronkan NTP (lisensi menolak jam yang mundur)

### Jaringan

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
- `files`: sertifikat klien. Letakkan `certs/cert.pem` (rantai lengkap) dan `certs/key.pem` di
  folder instalasi sebelum instalasi.
- `internal`: CA internal Caddy, untuk jaringan tertutup atau uji. Pasang sertifikat root dari
  volume `indoor-map_caddy-data` (`/data/caddy/pki/authorities/local/root.crt`) di perangkat
  pengguna, karena tanpa itu browser menolak service worker Visitor.

### Instalasi

1. Pasang Docker. Untuk server tanpa internet, pasang paket `.deb` Docker Engine dan plugin
   Compose yang diunduh di mesin lain; untuk server berinternet:

   ```sh
   curl -fsSL https://get.docker.com | sh
   ```

2. Salin arsip rilis dan `.sha256` ke server, periksa, lalu ekstrak ke folder instalasi:

   ```sh
   sha256sum -c panduarah-<versi>.tar.gz.sha256
   sudo mkdir -p /opt/panduarah
   sudo tar -xzf panduarah-<versi>.tar.gz -C /opt/panduarah --strip-components=1
   ```

3. Jalankan installer sebagai root:

   ```sh
   sudo /opt/panduarah/install.sh
   ```

   Installer melakukan hal-hal berikut:

   - memeriksa prasyarat;
   - menanyakan domain, mode HTTPS, dan alamat layanan lisensi vendor (boleh kosong untuk
     aktivasi manual);
   - membangkitkan semua rahasia di server ini, tanpa kredensial bawaan: password database,
     JWT, kunci anon/service, dan rahasia hook email Auth `v1,whsec_…`;
   - membuat `/opt/panduarah/.env` dengan izin 600;
   - memuat image dari `images.tar` (lalu menghapus arsip image itu) atau menarik image versi
     paket dari registry;
   - menjalankan layanan dan migrasi, lalu mengisi alamat Edge Function untuk database;
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

Menjalankan `install.sh` ulang aman: `.env` yang sudah ada dipakai lagi.

Alamat API dan kunci anon tidak ada di dalam image. Container `web` mengisinya ke build statis
Admin dan Visitor setiap kali mulai, dari `.env`.

### Backup

`backup.sh` berjalan setiap hari pukul 02.30 lewat `/etc/cron.d/indoor-map-backup`. Layanan
tidak berhenti selama backup. Setiap backup menjadi satu folder `backups/<tanggal-jam>/` berisi:

- `db/base.tar.gz`: salinan fisik database (`pg_basebackup`), termasuk akun dan lisensi
- `storage.tar.gz`: berkas Storage (gambar denah, ikon, snapshot publish)
- `env`: salinan `.env`. **Rahasia**: folder backup hanya bisa dibaca root.
- `version`: versi aplikasi saat backup

Backup lebih tua dari 14 hari dihapus otomatis. Salin folder `backups` ke media lain (NAS atau
disk eksternal) sesuai kebijakan TI klien. Backup manual kapan saja:

```sh
sudo /opt/panduarah/backup.sh
```

### Pemulihan

```sh
sudo /opt/panduarah/restore.sh latest                      # backup terbaru
sudo /opt/panduarah/restore.sh /opt/panduarah/backups/20261005-023000
```

Seluruh data saat ini diganti dengan isi backup, dan layanan berhenti selama pemulihan. Versi
paket yang terpasang harus sama dengan berkas `version` di backup. Di server baru:

1. Ekstrak arsip rilis dengan versi yang sama dengan berkas `version` di backup.
2. Salin folder backup ke `/opt/panduarah/backups/`.
3. Jalankan `restore.sh`. Bila `.env` belum ada, file itu diambil dari backup; image dimuat dari
   `images.tar` bila belum ada.
4. Jalankan `install.sh` untuk memasang jadwal backup.
5. Arahkan DNS ke server baru.

Lisensi terikat ID instalasi yang ikut dipulihkan, jadi tidak perlu aktivasi ulang.

### Pembaruan

Salin arsip rilis baru dan `.sha256`-nya ke server, lalu:

```sh
sudo /opt/panduarah/upgrade.sh /tmp/panduarah-<versi-baru>.tar.gz
```

Urutannya:

1. periksa checksum dan muat image versi baru (dari `images.tar` arsip, atau tarik dari
   registry);
2. backup;
3. simpan berkas rilis versi lama di `releases/<versi-lama>/`;
4. pasang `compose.yml`, skrip, dan migrasi versi baru;
5. jalankan layanan dengan image versi baru;
6. migrasi database;
7. health check.

Bila image gagal dimuat, versi lama tetap berjalan tanpa tersentuh. Bila langkah 5–7 gagal,
upgrade otomatis kembali ke versi sebelumnya dan memulihkan backup langkah 2. Data yang masuk
selama pembaruan (beberapa menit) ikut kembali ke keadaan backup.

### Rollback

Untuk membatalkan pembaruan terakhir yang sudah berhasil (misalnya ada masalah yang baru
terlihat):

```sh
sudo /opt/panduarah/rollback.sh
```

Berkas rilis lama dari `releases/` dipasang lagi dan data dipulihkan dari backup sebelum
pembaruan, memakai image versi lama yang masih ada di Docker. Data yang masuk setelah pembaruan
hilang, jadi rollback diminta konfirmasi (`KEMBALI`).

### Perintah harian

```sh
cd /opt/panduarah
docker compose --env-file .env ps                 # status
docker compose --env-file .env logs -f functions
docker compose --env-file .env restart web
```
