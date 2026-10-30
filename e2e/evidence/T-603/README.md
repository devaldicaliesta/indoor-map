# T-603a · Pemindaian keamanan di CI — bukti

Test case: **TC-KOM-04** "CI dengan dependency berkerentanan tinggi → CI gagal" (level M).
Perintahnya sama dengan `.github/workflows/security.yml`, dijalankan di lingkungan cloud sesi
2026-10-30.

| Berkas | Isi | Hasil |
| --- | --- | --- |
| [01-pnpm-audit-sebelum.txt](01-pnpm-audit-sebelum.txt) | `pnpm audit --audit-level high` pada commit sebelum T-603 (`18768fe`): zod, vite, source-map-js | 3 high → **exit 1 (CI gagal)** |
| [02-pnpm-audit-sesudah.txt](02-pnpm-audit-sesudah.txt) | Setelah pembaruan | Hanya low/moderate → exit 0 |
| [03-pip-audit.txt](03-pip-audit.txt) | `pip-audit` cad-converter: Pillow 12.3.0 lalu 13.0.0 | **exit 1** → exit 0 |
| [04-trivy-image-dasar.txt](04-trivy-image-dasar.txt) | Trivy pada image dasar dengan `.trivyignore.yaml` | `caddy:2.10-alpine` exit 1 (95 high/critical); `caddy:2.11.6-alpine` sisa 3 paket Alpine; `edge-runtime:v1.76.2` 14 paket Debian; `python:3.12-slim` exit 0 |
| [05-gitleaks.txt](05-gitleaks.txt) | gitleaks atas riwayat git di checkout (106 commit, clone dangkal) | Tidak ada kebocoran; CI memakai `fetch-depth: 0` untuk seluruh riwayat |

**Image akhir diverifikasi di GitHub Actions:** sisa temuan paket OS di image `web` dan
`functions` diperbaiki oleh `apk upgrade` / `apt-get upgrade` di `deploy/Dockerfile`. Image ini
tidak bisa dibangun di lingkungan cloud karena proxy menolak `dl-cdn.alpinelinux.org` dan
`deb.debian.org` (403). Workflow Security run #1–#3 (push `develop`, PR #41, push `main`,
2026-10-30) hijau untuk kelima job: dependency, gitleaks, dan Trivy `web`/`functions`/`cad`.

Lainnya:
- `pnpm check` dan `pnpm build` hijau setelah pembaruan zod/vite/source-map-js.
- `services/cad-converter`: 18 test lulus dengan Pillow 12.3.0 maupun 13.0.0.
- `caddy validate` atas `deploy/Caddyfile` lulus dengan Caddy 2.11.6.
- Tinjauan ASVS L2: `docs/keamanan/asvs-l2.md` (7 temuan sedang/rendah, tanpa tinggi/kritis).

| ID | Hasil |
| --- | --- |
| TC-KOM-04 | Lulus (pnpm audit, pip-audit, Trivy gagal pada kerentanan tinggi yang belum ditangani) |
