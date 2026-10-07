# Data demo untuk video dan motion graphic — tangkapan layar

Data dari `pnpm db:seed-demo` (isi dan akun: `packages/data/test/seed/README.md`), direkam
`node scripts/demo-screens.mjs` pada 1920 × 1080 (HP 390 × 844 @2×, Info Point potret
1080 × 1920), Supabase lokal, 2026-10-07. `DEMO_SCALE=2` merekam ulang dalam 3840 × 2160.

| Gambar | Layar |
| --- | --- |
| [a01](a01-admin-semua-venue.png) | Admin · Semua venue: enam venue demo dengan logo, tipe, dan alamat |
| [a02](a02-admin-gedung-bandara.png) | Admin · Gedung Bandara: dua terminal + Area Luar |
| [a03](a03-admin-lokasi-bandara.png) | Admin · Lokasi Bandara: gerbang, konter check-in, lounge, ritel |
| [a04](a04-admin-info-point-bandara.png) | Admin · Info Point Bandara: dua layar (keberangkatan, kedatangan) |
| [a05](a05-admin-lokasi-rumah-sakit.png) | Admin · Lokasi RS, filter status Aktif, 50 baris |
| [a06](a06-admin-penutupan-rumah-sakit.png) | Admin · Penutupan RS: sedang berlaku, terjadwal, selesai |
| [a07](a07-admin-publish-mal.png) | Admin · Publish Mal: 8 versi bercatatan, termasuk rollback |
| [a08](a08-admin-tipe-lokasi-mal.png) | Admin · Tipe lokasi Mal: field dan kategori berwarna |
| [a09](a09-admin-editor-menara.png) | Admin · Editor Peta Menara: unit, koridor, lift, eskalator, graf jalur |
| [a10](a10-admin-pengguna.png) | Admin · Pengguna: lima role, satu terkunci, satu nonaktif |
| [a11](a11-admin-log-audit.png) | Admin · Log audit: masuk, gagal masuk, role diubah, publish, rollback |
| [v01](v01-visitor-mal.png) – [v06](v06-visitor-pabrik.png) | Visitor desktop keenam venue (logo dan warna merek venue) |
| [v07](v07-rute-bandara-checkin-ke-gerbang.png) | Rute konter check-in → gerbang internasional (naik lift ke L1) |
| [v08](v08-rute-rumah-sakit-pendaftaran-ke-radiologi.png) | Rute Pendaftaran → Radiologi |
| [v09](v09-rute-mal-antar-lantai.png) | Rute antar-lantai di mal |
| [m01](m01-hp-mal.png), [m02](m02-hp-pabrik.png) | Visitor di HP |
| [k01](k01-info-point-bandara.png) | Info Point Bandara, layar potret 3D, "Anda di sini" |

Semua nama orang, perusahaan, gerai, dan alamat fiktif; logo dibuat `node scripts/demo-logos.mjs`.
