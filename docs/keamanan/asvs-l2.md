# Daftar periksa OWASP ASVS 4.0.3 level 2 (tinjauan internal)

Tinjauan internal T-603a pada 2026-10-30, terhadap `develop` setelah T-602. Tinjauan ini **bukan
pengganti pentest independen** (T-603b, [pentest.md](pentest.md)). Ringkasan per bab dengan
bukti di kode. Temuan yang belum terpenuhi dirangkum di §2 beserta tindak lanjutnya.

Area: **A** = Admin, **V** = Visitor dan Info Point, **E** = Edge Function dan database,
**P** = paket instalasi (`deploy/`). Status: ✅ terpenuhi · ⚠️ sebagian (lihat temuan) · ❌ belum ·
— tidak berlaku.

## 1. Per bab

| Bab | Butir kunci | A | V | E | P | Bukti / catatan |
| --- | --- | --- | --- | --- | --- | --- |
| V1 Arsitektur | Batas kepercayaan, otorisasi di server, komponen terdokumentasi | ✅ | ✅ | ✅ | ✅ | Klien tidak pernah memanggil Supabase langsung (`packages/data`); otorisasi di RLS/fungsi SQL (CLAUDE.md, `docs/02`); inventaris data `docs/legal/inventaris-data.md` |
| V2 Autentikasi | 2.1.1 password ≥ 12 karakter | ⚠️ | — | ⚠️ | ⚠️ | Minimum 8 (`GOTRUE_PASSWORD_MIN_LENGTH`, `license-activate`) → **F-01** |
| | 2.1.7 tolak password yang pernah bocor | ❌ | — | ❌ | — | Belum ada → **F-02** |
| | 2.2.1 anti-otomasi / brute force | ✅ | — | ✅ | — | Kunci 15 menit setelah 5 gagal (0002), pesan generik tanpa membocorkan akun (0021), pemberitahuan ke pemilik akun |
| | 2.2.x autentikasi multifaktor untuk akun berhak tinggi | ⚠️ | — | ⚠️ | — | TOTP wajib baru untuk staf vendor (T-617); Super Admin klien belum → **F-03** (T-592) |
| | 2.5 pemulihan akun | ✅ | — | ✅ | — | Reset lewat tautan email sekali pakai (GoTrue); ganti password hanya lewat alur itu |
| V3 Sesi | Token acak, rotasi refresh, cabut saat dinonaktifkan | ✅ | — | ✅ | ✅ | JWT 1 jam, rotasi refresh token, sesi dicabut saat akun dinonaktifkan atau dihapus (T-009, 0057) |
| | 3.3.2 batas tidak aktif L2 (≤ 30 menit) / absolut (≤ 12 jam) | ⚠️ | — | — | ⚠️ | Tidak aktif 1 jam, tanpa batas absolut → **F-04** |
| | 3.4 cookie | — | — | — | — | Token di storage klien dan dikirim lewat header `Authorization`, tanpa cookie sesi |
| V4 Kontrol akses | Default menolak, per role dan per venue, di server | ✅ | ✅ | ✅ | — | RLS di semua tabel `public` (diperiksa: 0 tabel tanpa RLS); pgTAP per role dan per venue (`venue_isolation`, `rls`, `permissions-matrix`); semua fungsi `security definer` memakai `search_path` (0 pengecualian) |
| | 4.3 antarmuka administrasi | ✅ | — | ✅ | — | Tindakan sistem/lisensi/pengguna khusus Super Admin di server (`user_data_*`, `license_*`, `system_settings` RLS) |
| V5 Validasi | Validasi di server, query berparameter, encoding keluaran | ✅ | ✅ | ✅ | — | Skema zod di `packages/domain` + CHECK SQL; PostgREST/RPC berparameter; React meng-escape; tanpa `dangerouslySetInnerHTML` (diperiksa: 0); atribusi peta dasar di-escape (T-307) |
| V6 Kriptografi | Algoritme kuat, kunci tidak di kode | ✅ | — | ✅ | ✅ | Lisensi Ed25519; kunci publik vendor ditanam saat rilis dan kunci DEV ditolak (T-511/T-618); password SMTP di Vault (0004); token trial di-hash SHA-256 |
| V7 Log | Peristiwa keamanan dicatat, tanpa rahasia, retensi | ✅ | — | ✅ | ⚠️ | `audit_events` (masuk, gagal masuk, role, publish, lisensi, pengaturan, export/hapus data, EULA); masa simpan diatur (0057); log kontainer belum dirotasi → **F-05** |
| V8 Perlindungan data | Data sensitif tidak di-cache publik, minimalisasi | ✅ | ✅ | ✅ | — | Snapshot publik hanya berisi data yang dipublish; export/hapus data akun (T-601a); Visitor tanpa data pribadi |
| V9 Komunikasi | TLS untuk semua koneksi luar, HSTS | ✅ | ✅ | — | ⚠️ | Caddy TLS (Let's Encrypt/sertifikat klien/CA internal); HSTS 1 tahun tanpa `includeSubDomains` → **F-06** |
| V10 Kode berbahaya | Integritas dependency, pemindaian | ✅ | ✅ | ✅ | ✅ | Lockfile beku di CI; `pnpm audit`, `pip-audit`, Trivy, gitleaks (T-603a); pemeriksaan lisensi pihak ketiga (T-511) |
| V11 Logika bisnis | Batas laju dan kuota di server | ✅ | — | ✅ | — | Kuota lisensi/trial di SQL (`app.enforce_quota`), batas laju form trial per IP, publish per hari |
| V12 Berkas | Batas ukuran dan tipe, tidak dieksekusi, disimpan di luar web root | ✅ | — | ✅ | ✅ | Bucket dengan `file_size_limit` dan `allowed_mime_types` (0005, 0007, 0020), tanpa SVG; cad-converter maks 50 MB, cek origin dan lisensi `cad_import` (T-514); DWG ditolak |
| V13 API | Metode dibatasi, CORS, tanpa CSRF berbasis cookie | ✅ | ✅ | ✅ | ✅ | Edge Function hanya POST (11/11); CORS `*` aman karena autentikasi lewat header bearer, bukan cookie; cad-converter membatasi origin |
| V14 Konfigurasi | Header keamanan, image diperbarui, tanpa info debug | ⚠️ | ⚠️ | ✅ | ⚠️ | HSTS, `nosniff`, `Referrer-Policy`, header `Server` dihapus; **CSP dan `frame-ancestors` belum ada** → **F-07**; image dasar diperbarui saat build (T-603a) |

## 2. Temuan

Tingkat mengikuti dampak pada instalasi klien biasa (jaringan gedung, Admin dipakai staf).

| ID | Temuan | Tingkat | Rekomendasi | Tindak lanjut |
| --- | --- | --- | --- | --- |
| F-01 | Password minimum 8 karakter (ASVS 2.1.1 meminta ≥ 12) | Sedang | `GOTRUE_PASSWORD_MIN_LENGTH=12` di `deploy/compose.yml` dan `supabase/config.toml`, form Admin, dan `license-activate` (Super Admin pertama) | Pertanyaan terbuka T-603a (mengubah perilaku untuk pengguna) |
| F-02 | Password yang pernah bocor tidak ditolak (2.1.7) | Rendah | GoTrue `password_hibp_enabled` butuh internet. Untuk server tertutup, daftar lokal password umum di hook | Bersama F-01 |
| F-03 | Super Admin klien tanpa 2FA | Sedang | 2FA TOTP untuk Admin | **T-592** (sudah direncanakan) |
| F-04 | Batas sesi tidak aktif 1 jam dan tanpa batas absolut (3.3.2 L2: 30 menit / 12 jam) | Rendah | `GOTRUE_SESSIONS_INACTIVITY_TIMEOUT=30m`, `GOTRUE_SESSIONS_TIMEBOX=12h` | Bersama F-01 |
| F-05 | Log kontainer Docker tanpa rotasi; bisa memuat IP/email | Rendah | `logging` json-file `max-size`/`max-file` di `deploy/compose.yml` | Pertanyaan terbuka T-601a |
| F-06 | HSTS tanpa `includeSubDomains` | Rendah | Tambahkan bila klien memakai subdomain khusus untuk PanduArah. Dapat mengganggu subdomain lain milik klien, jadi dibuat opsi | Bersama F-07 |
| F-07 | Tanpa Content-Security-Policy dan `frame-ancestors`/`X-Frame-Options`; Admin bisa dibingkai situs lain (clickjacking) | Sedang | Admin: `frame-ancestors 'none'` + CSP ketat (`script-src 'self'`, `worker-src blob:` untuk MapLibre). Visitor: `frame-ancestors` dari pengaturan embed (T-556). Diuji E2E karena MapLibre, tile, dan service worker sensitif terhadap CSP | Task lanjutan (diusulkan T-603c), sebelum pentest agar tidak menjadi temuan berulang |

Tidak ditemukan celah tingkat tinggi atau kritis di kode PanduArah pada tinjauan ini. Kerentanan
tinggi di dependency dan image yang ditemukan pemindaian sudah diperbaiki (riwayat di
[README.md](README.md)).
