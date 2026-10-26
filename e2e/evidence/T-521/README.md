# T-521 · Panduan Windows lewat VM Ubuntu — bukti

Panduan: `deploy/README.md` → "Bagian 3 · Server Windows (lewat VM Ubuntu)".

**Status: menunggu uji manual.** TC-INS-01 membutuhkan host Windows dengan Hyper-V. Lingkungan
agen (Linux di cloud, tanpa Windows) tidak bisa menjalankannya, jadi daftar di bawah dijalankan
pemilik atau tim TI lalu hasil dan screenshot-nya disimpan di folder ini.

## TC-INS-01 · Instal di VM Hyper-V mengikuti panduan; reboot host

Catat dulu: versi Windows host, CPU/RAM host, versi rilis PanduArah (`release.env`), dan mode
jaringan (bridge atau NAT).

| # | Langkah (bagian panduan) | Hasil yang diharapkan | Bukti |
| --- | --- | --- | --- |
| 1 | A: pasang Hyper-V, switch, VM generasi 2 4 vCPU/8 GB/80 GB, `AutomaticStartAction Start` | `Get-VM PanduArah` menunjukkan VM berjalan dengan setelan itu | `01-get-vm.png` |
| 2 | B: pasang Ubuntu 24.04, IP tetap, `lvextend`, `timedatectl` | `df -h /` ±75 GB, jam tersinkron | `02-ubuntu.png` |
| 3 | Bagian 2: ekstrak arsip rilis, `install.sh` | "Instalasi versi … selesai", health check lulus | `03-install.png` |
| 4 | C: jaringan (bridge + `ufw`, atau NAT + firewall Windows) dan DNS | Dari PC lain di jaringan kantor, Visitor dan Admin terbuka lewat domainnya | `04-visitor-dari-pc-kantor.png` |
| 5 | Aktivasi lisensi dan Super Admin pertama | Admin masuk | `05-admin.png` |
| 6 | D: restart host Windows, tunggu 3–5 menit tanpa menyentuh VM | VM menyala sendiri; Visitor terbuka lagi dari PC lain | `06-setelah-reboot-host.png` |
| 7 | E: `backup.sh` lalu salin ke share; `Export-VM` atau `wbadmin` | Folder backup ada di share; ekspor VM selesai | `07-backup.png` |

Hasil: — (diisi setelah uji)
