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

Server Windows: lihat Bagian 3 (VM Ubuntu di Hyper-V atau VMware).

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

## Bagian 3 · Server Windows (lewat VM Ubuntu)

Paket instalasi berjalan di Linux. Di server Windows, PanduArah dipasang di dalam **VM Ubuntu
Server** (Hyper-V atau VMware), lalu langkah Bagian 2 dijalankan di VM itu tanpa perubahan.
Dukungan Windows Server tanpa VM menyusul (T-523).

### Kebutuhan host

- Windows Server 2019/2022/2025, atau Windows 10/11 Pro/Enterprise (Windows Home tidak punya
  Hyper-V)
- Virtualisasi CPU (Intel VT-x/AMD-V) aktif di BIOS/UEFI
- Sisa sumber daya untuk VM: **4 vCPU, 8 GB RAM, disk 80 GB** (40 GB data ditambah ruang backup;
  spesifikasi minimum di Bagian 2 berlaku untuk VM)
- ISO Ubuntu Server 24.04 LTS (`ubuntu-24.04-live-server-amd64.iso`)

### A. Membuat VM di Hyper-V

1. Pasang Hyper-V (PowerShell sebagai Administrator, host akan restart):

   ```powershell
   # Windows Server
   Install-WindowsFeature -Name Hyper-V -IncludeManagementTools -Restart
   # Windows 10/11 Pro/Enterprise
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
   ```

2. Buat switch jaringan. Pilih **satu** cara di bagian [Jaringan VM](#c-jaringan-vm); contoh di
   sini memakai bridge (switch External) ke adapter jaringan kantor:

   ```powershell
   Get-NetAdapter                       # catat nama adapter LAN, mis. "Ethernet"
   New-VMSwitch -Name "PanduArah-LAN" -NetAdapterName "Ethernet" -AllowManagementOS $true
   ```

3. Buat VM generasi 2:

   ```powershell
   $vm = "PanduArah"
   New-VM -Name $vm -Generation 2 -MemoryStartupBytes 8GB -SwitchName "PanduArah-LAN" `
     -NewVHDPath "D:\Hyper-V\$vm.vhdx" -NewVHDSizeBytes 80GB
   Set-VMProcessor $vm -Count 4
   # Memori tetap: Postgres tidak boleh kehilangan RAM karena memori dinamis.
   Set-VMMemory $vm -DynamicMemoryEnabled $false
   # Secure Boot untuk Linux memakai templat CA UEFI Microsoft.
   Set-VMFirmware $vm -SecureBootTemplate MicrosoftUEFICertificateAuthority
   Add-VMDvdDrive $vm -Path "D:\iso\ubuntu-24.04-live-server-amd64.iso"
   Set-VMFirmware $vm -FirstBootDevice (Get-VMDvdDrive $vm)
   # Menyala sendiri 60 detik setelah host menyala; dimatikan rapi saat host shutdown.
   Set-VM $vm -AutomaticStartAction Start -AutomaticStartDelay 60 `
     -AutomaticStopAction ShutDown -CheckpointType Production
   Start-VM $vm
   vmconnect localhost $vm
   ```

4. Lanjutkan ke [Memasang Ubuntu di VM](#b-memasang-ubuntu-di-vm).

### A2. Membuat VM di VMware

**VMware ESXi / vSphere:** buat VM baru dengan Guest OS *Ubuntu Linux (64-bit)*, 4 vCPU, 8 GB RAM
(*Reserve all guest memory*), disk 80 GB, adapter jaringan ke port group LAN kantor, dan ISO
Ubuntu di CD/DVD. Aktifkan **Autostart** di host (*Manage → System → Autostart*) dan masukkan VM
ini ke daftar dengan jeda mulai 60 detik.

**VMware Workstation Pro** (host Windows): buat VM dengan setelan yang sama dan jaringan
**Bridged**. Agar menyala saat host reboot, jadikan VM *Shared VM* lalu atur *Configure Auto
Start VMs* dari menu *Library*.

Di VM VMware, pastikan `open-vm-tools` terpasang (`sudo apt install open-vm-tools`) agar shutdown
dari host berjalan rapi.

### B. Memasang Ubuntu di VM

1. Pasang Ubuntu Server 24.04 dengan pilihan bawaan, centang **Install OpenSSH server**, dan
   **jangan** pilih snap Docker di layar *Featured server snaps* (Docker dipasang di langkah
   instalasi Bagian 2).
2. Beri VM **alamat IP tetap**: reservasi DHCP di router kantor, atau di VM lewat
   `/etc/netplan/*.yaml`. Alamat ini yang dituju DNS domain Admin/Visitor/API.
3. Setelah masuk ke VM:

   ```sh
   sudo apt update && sudo apt full-upgrade -y
   # Instalasi bawaan memakai LVM dan sering hanya memakai sebagian disk: pakai seluruhnya.
   sudo lvextend -r -l +100%FREE /dev/ubuntu-vg/ubuntu-lv
   df -h /                         # ±75 GB tersedia untuk disk 80 GB
   timedatectl                     # "System clock synchronized: yes"; lisensi menolak jam mundur
   sudo systemctl enable --now ssh
   # Hyper-V saja: checkpoint Production dan backup host yang konsisten di dalam VM.
   sudo apt install -y linux-cloud-tools-virtual
   ```

4. Ikuti **Bagian 2 · Instalasi** di VM. Installer Docker (`get.docker.com`) sudah membuat
   Docker menyala otomatis saat boot, dan semua layanan memakai `restart: unless-stopped`,
   sehingga PanduArah ikut hidup setiap VM menyala.

### C. Jaringan VM

Pilih salah satu:

**Bridge (disarankan).** VM mendapat IP sendiri di jaringan kantor (switch External di Hyper-V,
*Bridged* di VMware). DNS domain Admin, Visitor, dan API diarahkan ke IP VM. Lalu lintas ke VM
tidak melewati Windows Firewall host, jadi cukup buka port di Ubuntu:

```sh
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable
```

**NAT dengan port forwarding.** Dipakai bila jaringan kantor hanya mengizinkan IP host. VM
berada di jaringan internal, dan host meneruskan port 80/443 ke VM. DNS diarahkan ke **IP host**.
Contoh Hyper-V (VM memakai IP tetap `192.168.100.10`, gateway `192.168.100.1`):

```powershell
New-VMSwitch -Name "PanduArah-NAT" -SwitchType Internal
New-NetIPAddress -IPAddress 192.168.100.1 -PrefixLength 24 -InterfaceAlias "vEthernet (PanduArah-NAT)"
New-NetNat -Name PanduArahNAT -InternalIPInterfaceAddressPrefix 192.168.100.0/24
foreach ($port in 80, 443) {
  Add-NetNatStaticMapping -NatName PanduArahNAT -Protocol TCP -ExternalIPAddress 0.0.0.0 `
    -ExternalPort $port -InternalIPAddress 192.168.100.10 -InternalPort $port
}
Connect-VMNetworkAdapter -VMName PanduArah -SwitchName "PanduArah-NAT"
```

Di VMware Workstation: *Edit → Virtual Network Editor → VMnet8 (NAT) → NAT Settings → Add*
untuk port 80 dan 443 ke IP VM.

**Firewall Windows (mode NAT).** Buka port 80/443 di host untuk jaringan kantor:

```powershell
New-NetFirewallRule -DisplayName "PanduArah HTTP/HTTPS" -Direction Inbound -Protocol TCP `
  -LocalPort 80,443 -Action Allow -Profile Domain,Private
```

Port 80/443 host tidak boleh dipakai program lain, misalnya IIS. Periksa dengan
`Get-NetTCPConnection -LocalPort 80,443 -State Listen`. Bila IIS terpasang dan tidak dipakai,
matikan dengan `Stop-Service W3SVC; Set-Service W3SVC -StartupType Disabled`.

**HTTPS di jaringan kantor.** Mode `auto` (Let's Encrypt) hanya berjalan bila domain bisa
dijangkau dari internet di port 80. Di jaringan internal pakai `files` (sertifikat dari CA kantor)
atau `internal`. Pada `internal`, sebarkan sertifikat root Caddy ke PC dan HP kantor (misalnya
lewat Group Policy), karena tanpa itu service worker Visitor ditolak browser.

### D. Menyala otomatis setelah host reboot

- Hyper-V: `Get-VM PanduArah | Select Name, AutomaticStartAction, AutomaticStartDelay` harus
  menunjukkan `Start`. VM yang tidak cukup RAM saat host menyala gagal start; cek *Hyper-V
  Manager → Event Viewer → Hyper-V-Worker*.
- VMware: cek daftar Autostart (ESXi) atau *Configure Auto Start VMs* (Workstation).
- Di VM: `systemctl is-enabled docker` harus `enabled`.

Uji sekali setelah instalasi: restart host, tunggu 3–5 menit, lalu buka Visitor dari PC lain di
jaringan kantor.

### E. Backup

Dua lapis, keduanya perlu:

1. **Backup aplikasi** (`backup.sh`, harian 02.30, Bagian 2). Ini yang dipakai untuk memulihkan
   data, termasuk ke server lain. Salin folder `/opt/panduarah/backups` keluar VM setiap hari,
   misalnya ke share Windows/NAS:

   ```sh
   sudo apt install -y cifs-utils
   sudo mkdir -p /mnt/backup-panduarah
   # /etc/fstab (kredensial di /root/.smb-panduarah berizin 600):
   # //nas-kantor/backup/panduarah /mnt/backup-panduarah cifs credentials=/root/.smb-panduarah,uid=0,gid=0,file_mode=0600,dir_mode=0700 0 0
   sudo mount -a
   # Setelah backup harian (cron root):
   # 0 4 * * * rsync -a --delete /opt/panduarah/backups/ /mnt/backup-panduarah/
   ```

   Folder backup berisi salinan `.env` (rahasia), jadi share tujuan hanya boleh dibaca TI.

2. **Backup VM** untuk memulihkan seluruh server dengan cepat (OS, Docker, image):
   - Windows Server Backup: `wbadmin start backup -backupTarget:E: -hyperv:PanduArah -quiet`,
     dijadwalkan lewat Task Scheduler, atau
   - `Export-VM -Name PanduArah -Path E:\VM-Export` (bisa saat VM menyala), atau
   - fitur backup VM dari perangkat lunak backup kantor (Veeam, vSphere, dan sejenisnya).

   Setelah memulihkan VM dari backup lama, data database ikut kembali ke saat backup VM itu.
   Bila butuh data lebih baru, pulihkan backup aplikasi terbaru dengan `restore.sh`.

Uji pemulihan minimal sekali sebelum go-live.

### F. Pemecahan masalah

| Gejala | Periksa |
| --- | --- |
| Visitor tidak terbuka dari PC lain | IP VM (`ip -4 addr`), DNS domain mengarah ke IP yang benar (bridge: IP VM; NAT: IP host), `sudo ufw status`, aturan firewall Windows dan pemetaan NAT (`Get-NetNatStaticMapping`) pada mode NAT |
| Port 80/443 host sudah dipakai (mode NAT) | `Get-NetTCPConnection -LocalPort 80,443 -State Listen`, lalu matikan IIS atau program lain |
| Browser memperingatkan sertifikat / Visitor tidak bisa dipasang sebagai aplikasi | Mode `internal`: sertifikat root Caddy belum dipasang di perangkat; mode `files`: rantai sertifikat `cert.pem` tidak lengkap |
| VM tidak menyala setelah host restart | `AutomaticStartAction` (Hyper-V) atau daftar Autostart (VMware); RAM host cukup untuk 8 GB tetap |
| Layanan mati setelah VM restart | `systemctl status docker`; `docker compose --env-file .env ps` di `/opt/panduarah`; `sudo /opt/panduarah/install.sh` aman dijalankan ulang |
| Aktivasi lisensi ditolak karena jam | `timedatectl`; di Hyper-V aktifkan *Integration Services → Time synchronization*, atau NTP kantor di `/etc/systemd/timesyncd.conf` |
| Disk VM penuh | `df -h`; perbesar disk (`Resize-VHD -Path D:\Hyper-V\PanduArah.vhdx -SizeBytes 120GB` saat VM mati), lalu di VM (LVM bawaan, cek `lsblk`): `sudo growpart /dev/sda 3 && sudo pvresize /dev/sda3 && sudo lvextend -r -l +100%FREE /dev/ubuntu-vg/ubuntu-lv` |
| ISO Ubuntu tidak mau boot di Hyper-V generasi 2 | Templat Secure Boot harus `MicrosoftUEFICertificateAuthority` |
