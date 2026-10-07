# T-501 · Nama produk PanduArah — bukti E2E

Spec: `e2e/tests/admin/f2/T-501-panduarah.spec.ts` (project `admin`, 1440 × 900) dan
`e2e/tests/visitor/f2/T-501-panduarah.spec.ts` (project `visitor`, HP 360 × 740, desktop 1280 × 800,
Info Point 1080 × 1920). Hasil: **6 lulus** (Supabase lokal, 2026-10-07).
Test case: TC-BRD-01 s.d. 06.

Data: venue lengkap `fullVenue` (2 gedung, 4 lantai + Area Luar, Info Point Lobi), 6 venue bervariasi
(`variedVenues`), venue terbit dengan logo monogram uji, pengguna undangan baru untuk email.

| Gambar | Langkah | Test case |
| --- | --- | --- |
| [01](01-masuk.png) | Halaman masuk: judul tab "Admin · PanduArah", logo resmi + "Admin", favicon SVG simbol | TC-BRD-01 |
| [02](02-lupa-password.png) | Lupa password memakai logo yang sama | TC-BRD-01 |
| [03](03-beranda-admin.png) | Beranda Admin: logo lengkap di header sidebar, proporsi sama dengan berkas resmi | TC-BRD-01 |
| [04](04-semua-venue.png) | Tab "Semua venue" berisi venue bervariasi (tipe, zona waktu, nama panjang/aksen) | TC-BRD-01 |
| [05](05-aktivasi.png) | `/aktivasi`: logo, ID instalasi, kontak vendor `panduarahid@gmail.com` (mailto) | TC-BRD-01 |
| [05b](05b-lisensi-kontak-vendor.png) | Halaman Lisensi: baris "Kontak vendor" | TC-BRD-01 |
| [06](06-sidebar-diciutkan.png) | Sidebar diciutkan: hanya simbol, muat di kolom 56 px | TC-BRD-04 |
| [07](07-varian-putih-latar-gelap.png) | Galeri `/_ui` → Merek: varian putih di atas `--ink`, tanpa kotak latar (latar svg transparan, semua path `--on-strong`) | TC-BRD-04 |
| [08](08-email-reset-password.png) | Email reset password di Mailpit: pengirim "PanduArah <panduarahid@gmail.com>", logo inline (`cid:logo@panduarah`), kaki email kontak vendor | TC-BRD-03 |
| [09](09-tautan-reset-berfungsi.png) | Tautan di email membuka form password baru; password disimpan lalu kembali ke halaman masuk | TC-BRD-03 |
| [10](10-email-akun-dikunci.png) | Pemberitahuan akun terkunci (5× salah password) bermerek PanduArah | TC-BRD-03 |
| [11](11-email-undangan.png) | Email undangan bermerek PanduArah | TC-BRD-03 |
| [12](12-visitor-beranda-hp.png) | Visitor HP tanpa venue: judul "PanduArah" | TC-BRD-01 |
| [13](13-visitor-beranda-desktop.png) | Visitor desktop: ikon PanduArah + nama produk | TC-BRD-01 |
| [14](14-venue-tanpa-logo-desktop.png) | Venue tanpa logo: ikon bawaan PanduArah di samping nama venue (judul tab = nama venue) | TC-BRD-01, 05 |
| [15](15-tentang-id.png) | Dialog informasi peta: "Didukung oleh PanduArah — Indoor Navigation" | TC-BRD-05 |
| [16](16-tentang-en.png) | Bahasa EN: "Powered by PanduArah — Indoor Navigation" | TC-BRD-05 |
| [17](17-info-point-potret.png) | Info Point potret: ikon PanduArah + nama venue, tanpa "Indoor Map" | TC-BRD-01 |
| [18](18-venue-dengan-logo-hp.png) | Venue dengan logo (HP): logo venue di header, ikon PanduArah tidak tampil | TC-BRD-05 |
| [19](19-venue-dengan-logo-tentang.png) | Venue dengan logo (desktop): logo venue utama; PanduArah hanya teks kecil di dialog | TC-BRD-05 |
| [20](20-ikon-pwa.png) | Build produksi: ikon 512/192 (any), maskable dipotong lingkaran, apple-touch dibulatkan, favicon; latar terang dan gelap | TC-BRD-02 |

Pemeriksaan otomatis TC-BRD-02 (build produksi, `vite preview` port 4175): manifest `name` dan
`short_name` "PanduArah", `description` "PanduArah — Indoor Navigation"; setiap ikon berukuran sesuai
manifest dan tidak ada piksel simbol di tepi kanvas; isi ikon maskable berada di lingkaran aman 80%
(jari-jari terjauh ≤ 0,40 lebar); apple-touch tanpa piksel transparan.

**TC-BRD-06 (manual, 2026-10-07):** `rg -i "indoor map" apps/ supabase/functions/ deploy/` → tidak ada
hasil. Sisa `indoor-map` (tanda hubung) hanya nama internal yang tidak terlihat pengguna dan tidak
boleh diganti tanpa migrasi data: nama proyek Compose dan volume (`indoor-map_db-data`), nama image,
berkas cron `/etc/cron.d/indoor-map-backup`, contoh folder `/opt/indoor-map`, dan paket `@indoor/*`.

| ID | Hasil |
| --- | --- |
| TC-BRD-01 | Lulus |
| TC-BRD-02 | Lulus |
| TC-BRD-03 | Lulus |
| TC-BRD-04 | Lulus |
| TC-BRD-05 | Lulus |
| TC-BRD-06 | Lulus (manual) |

Logo: `packages/ui/src/brand/panduarah-logo.svg` hasil jiplak vektor `docs/brand/panduarah-logo.webp`
(potrace per warna, 4× supersampling); selisih rata-rata dengan berkas asli < 1/255 per piksel
(dirender ulang di Chromium dan dibandingkan per piksel). Turunan (simbol, varian putih, favicon, ikon
PWA, PNG email) dibuat `node scripts/brand-assets.mjs`; `packages/ui/test/brand.test.ts` menjaga
semuanya tetap sama dengan sumber.

Test lama yang diperbarui karena nama produk berubah (harapan lama tidak berlaku lagi): judul
`T-002-scaffold-admin`, subjek email `T-008-auth`, `T-009b-users`, dan integrasi
`packages/data/test/integration/auth-email.test.ts`. Dijalankan ulang bersama `branding.spec.ts`,
`T-002-scaffold-visitor`, dan `T-011-visitor-shell` (termasuk build PWA): **16 lulus**. Gambar bukti
task lama tidak diganti.

Temuan:
- [SEDANG] Bundel utama Visitor 2.097.156 byte, 4 byte di atas batas precache service worker 2 MiB,
  karena path tulisan logo ikut terbawa — build produksi gagal. Diperbaiki di commit ini: path tulisan
  hanya dirujuk `BrandLogo` sehingga Visitor (yang hanya memakai simbol) tidak memuatnya; bundel kini
  2.090.242 byte. Ruang tersisa ±6,9 kB, dicatat di PROGRESS sebagai risiko.
- [RENDAH] Gambar dialog terpotret saat animasi buka belum selesai (transparan) dan logo uji mengecil
  karena halaman perender ikut emulasi HP → test menunggu animasi selesai dan perender tanpa emulasi.

Tinjauan: code-reviewer (lihat PR), security-reviewer tidak relevan selain email (isi email tetap
di-escape; gambar logo inline dari berkas statis, bukan masukan pengguna).
