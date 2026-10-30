# Keamanan: pemindaian, pengecualian, dan tinjauan

Dibuat di T-603a. Cara melaporkan celah: [SECURITY.md](../../SECURITY.md).

| Dokumen | Isi |
| --- | --- |
| [asvs-l2.md](asvs-l2.md) | Daftar periksa OWASP ASVS 4.0.3 level 2 per area dan temuan tinjauan internal |
| [pentest.md](pentest.md) | Lingkup pentest independen (T-603b) dan pelacakan temuan beserta perbaikannya |

## Pemindaian di CI (`.github/workflows/security.yml`)

Berjalan di setiap PR, setiap push ke `main`/`develop`/`production`, dan setiap Senin pukul 02.23
UTC (menangkap CVE baru untuk kode yang tidak berubah).

| Job | Alat | Gagal bila |
| --- | --- | --- |
| Dependency | `pnpm audit --audit-level high` (semua dependency, termasuk dev) | Ada advisory high/critical |
| Dependency | `pip-audit` untuk `services/cad-converter/requirements.txt` | Ada kerentanan apa pun yang diketahui (pip-audit tidak punya tingkat keparahan) |
| Rahasia | gitleaks atas seluruh riwayat git | Ada rahasia yang terdeteksi |
| Image | Trivy pada image `web`, `functions`, `cad` hasil `deploy/Dockerfile` | Ada CVE high/critical yang sudah punya perbaikan (`--ignore-unfixed`) dan tidak dikecualikan |

Menjalankan secara lokal:

```bash
pnpm audit --audit-level high
```

```bash
pip install pip-audit==2.10.1 && pip-audit --requirement services/cad-converter/requirements.txt
```

```bash
docker build -f deploy/Dockerfile --target web -t panduarah/web:ci .
```

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v "$PWD:/src:ro" aquasec/trivy:0.67.2 image --scanners vuln --severity HIGH,CRITICAL --ignore-unfixed --ignorefile /src/.trivyignore.yaml panduarah/web:ci
```

Image dasar diperbarui saat build (`apk upgrade` untuk `web`, `apt-get upgrade` untuk
`functions`). Akibatnya build image butuh akses ke repositori Alpine dan Debian. Di balik proxy,
pakai `DOCKER_BUILD_FLAGS` di `deploy/build-release.sh`.

## Menangani temuan

1. **Perbarui** dependency atau image dasar ke versi yang sudah diperbaiki. Ini jalan utama.
   Pilih versi yang sudah terbit minimal dua minggu, kecuali perbaikan kritis yang sedang
   dieksploitasi.
2. **Kecualikan** hanya bila belum ada perbaikan yang bisa dipakai, dan risikonya sudah dinilai
   untuk cara PanduArah memakai komponen itu:
   - npm: `auditConfig.ignoreGhsas` di `pnpm-workspace.yaml`;
   - image: `.trivyignore.yaml` dengan `statement` dan `expired_at` paling lama 30 hari;
   - Python: `--ignore-vuln <ID>` di workflow.

   Setiap pengecualian dicatat di tabel di bawah dalam PR yang sama, lalu ditinjau ulang saat
   kedaluwarsa.
3. Temuan di kode PanduArah sendiri (bukan dependency) ditangani seperti laporan celah di
   `SECURITY.md`.

## Pengecualian yang berlaku

| ID | Komponen | Tingkat | Alasan | Kedaluwarsa |
| --- | --- | --- | --- | --- |
| CVE-2026-116587 | go-jose 4.1.5 di biner Caddy 2.11.6 (`web`) | High | DoS lewat kunci RSA buatan. Hanya terjangkau lewat ACME ke Let's Encrypt, yang opsional. Caddy 2.11.7 belum memperbaikinya | 2026-11-30 |
| CVE-2026-78669 | x/net 0.59.0 dan Go 1.26.8 di Caddy | High | DoS HTTP/2; menunggu Caddy yang dibangun dengan Go ≥ 1.26.9 | 2026-11-30 |
| CVE-2026-78667 | Go 1.26.8 di Caddy | High | DoS header Range | 2026-11-30 |
| CVE-2026-97031 | Go 1.26.8 di Caddy | High | DoS ECH; ECH tidak diaktifkan | 2026-11-30 |
| CVE-2026-111943 | Go 1.26.8 di Caddy | High | crypto/x509; verifikasi rantai hanya pada ACME opsional | 2026-11-30 |

Bila Caddy belum merilis versi dengan Go ≥ 1.26.10 sebelum tanggal kedaluwarsa, opsi
berikutnya adalah membangun Caddy sendiri dengan `xcaddy` dan Go terbaru di `deploy/Dockerfile`.

## Riwayat perbaikan

| Tanggal | Temuan | Tindakan |
| --- | --- | --- |
| 2026-10-30 | zod 4.6.5: GHSA-mrhx-c7xc-m3w5 (high, memori habis saat validasi), dependency produksi | zod 4.6.7 |
| 2026-10-30 | vite 8.3.1: GHSA-587h-7wmj-h5pm (high, dev server) | vite 8.3.5 |
| 2026-10-30 | source-map-js 1.2.1: GHSA-68fv-2mgg-jv7q (high, DoS, alat build) | source-map-js 1.2.2 |
| 2026-10-30 | Pillow 12.3.0 di cad-converter: 30+ CVE decoder (use-after-free, OOB write, …) | Pillow 13.0.0 (18 test cad-converter lulus) |
| 2026-10-30 | Image `web` `caddy:2.10-alpine`: 34 CVE OS + 61 CVE biner Go high/critical | `caddy:2.11.6-alpine` + `apk upgrade` |
| 2026-10-30 | Image `functions` `edge-runtime:v1.76.2`: 14 CVE paket Debian high/critical (perl, pcre2, …) | `apt-get upgrade` saat build |
