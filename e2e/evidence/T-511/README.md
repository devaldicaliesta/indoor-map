# T-511 · Distribusi image Docker jadi — bukti

Uji manual (M) di lingkungan cloud, 2026-10-26: Docker Engine 29.9, Compose v5.6. Rilis uji
`1.0.0` dan `1.0.1` dibangun dengan `deploy/build-release.sh … --save` memakai **kunci vendor uji**
dari `license-cli keygen` (di luar repo, bukan kunci DEV). Server klien disimulasikan di mesin
yang sama: semua image dihapus, lalu `dockerd` dinyalakan ulang dengan proxy yang mati
(`HTTPS_PROXY=http://127.0.0.1:9`), sehingga `docker pull` apa pun gagal ("connection refused").
Domain `admin|peta|api.panduarah.test` diarahkan ke 127.0.0.1, HTTPS mode `internal`.

| Bukti | Isi | Test case |
| --- | --- | --- |
| [hrd02-isi-paket.txt](hrd02-isi-paket.txt) | Isi arsip `panduarah-1.0.0.tar.gz`: compose, skrip, 54 migrasi, `release.env`, `images.tar` (7 image). 0 berkas di `apps/`, `packages/`, `supabase/`, `services/`, `tools/`; tanpa kunci lisensi; `build:` 0 | TC-HRD-02 |
| (di bawah) | `build-release.sh 1.0.0 --public-key tools/license-cli/dev-keys/license-public.b64 --save` → "Kunci lisensi DEV ditolak" (exit 1) | TC-HRD-02 |
| [hrd01-install.log](hrd01-install.log) | `install.sh` dari arsip tanpa internet: image dimuat dari `images.tar`, 54 migrasi, health check lulus, 69 detik | TC-HRD-01 |
| [01](01-aktivasi-dari-arsip.png) | Admin dari image `panduarah/web:1.0.0`: halaman aktivasi dengan ID instalasi | TC-HRD-01 |
| [02](02-lisensi-kunci-dev-ditolak.png) | Lisensi yang ditandatangani kunci DEV ditolak "Tanda tangan lisensi tidak cocok": image `functions` memeriksa dengan kunci vendor | TC-HRD-02 |
| [03](03-super-admin-masuk.png) | Lisensi kunci vendor diterima ("Lisensi aktif · RS Uji T-511"), Super Admin pertama dibuat dan masuk | TC-HRD-01 |
| [04](04-visitor-1.0.0.png) | Visitor (390 × 844) tampil dari image yang sama; alamat API dan kunci anon diisi `web-entrypoint.sh` saat container mulai (0 penanda tersisa di build statis) | TC-HRD-01 |
| [hrd03-upgrade.log](hrd03-upgrade.log) | `upgrade.sh panduarah-1.0.1.tar.gz`: image dimuat, backup, rilis lama disimpan di `releases/1.0.0/`, image `1.0.1` berjalan, health check lulus (42 detik) | TC-HRD-03 |
| [hrd03-rollback.log](hrd03-rollback.log) | `rollback.sh --yes`: berkas rilis 1.0.0 dipasang lagi, backup sebelum pembaruan dipulihkan, image `1.0.0` berjalan (28 detik) | TC-HRD-03 |
| [hrd03-upgrade-gagal.log](hrd03-upgrade-gagal.log) | Arsip 1.0.2 rekaan dengan migrasi `select 1 / 0`: migrasi gagal → otomatis kembali ke 1.0.0 dan backup dipulihkan (perilaku T-411) | TC-HRD-03 |
| [hrd03-tanpa-image.log](hrd03-tanpa-image.log) | Arsip 1.0.3 tanpa `images.tar` di server offline: pull gagal → berhenti sebelum backup dan sebelum layanan disentuh, 1.0.0 tetap berjalan | TC-HRD-03 |
| [05](05-admin-setelah-rollback.png) | Admin setelah upgrade, rollback, dan upgrade gagal: venue penanda masih ada | TC-HRD-03 |

Data penanda diperiksa di setiap tahap: venue "RS Penanda T-511", lisensi "RS Uji T-511", satu
Super Admin, 54 migrasi, dan berkas Storage `public-assets/uji/penanda-t511.png` (sha256
`7a1a3658e2275045…`). Hasilnya sama setelah instalasi, upgrade ke 1.0.1, rollback ke 1.0.0,
upgrade gagal ke 1.0.2, dan upgrade tanpa image ke 1.0.3.

| ID | Hasil |
| --- | --- |
| TC-HRD-01 | Lulus. Visitor yang tampil adalah halaman awal (belum ada venue terbit) |
| TC-HRD-02 | Lulus |
| TC-HRD-03 | Lulus. Upgrade 1.0.0 → 1.0.1 tidak membawa migrasi baru (kedua rilis dari skema yang sama); jalur migrasi diuji lewat arsip 1.0.2 yang gagal |

Belum diuji: `--push` ke registry privat (tidak ada registry di lingkungan ini), instalasi di
VM Ubuntu yang benar-benar terputus dari jaringan, dan arsitektur selain x86_64.
