# PROGRESS

Papan status proyek. Agen membaca file ini di awal sesi dan memperbaruinya di akhir sesi (lihat `06-alur-kerja.md`).

Status: `siap` · `menunggu` · `dikerjakan` · `review` · `selesai` · `diblokir`

**Rilis aktif:** R0 Fondasi
**Task berikutnya:** T-002, T-003, T-004

## R0 · Fondasi (`10-R0-fondasi.md`)

| Task | Judul | Bergantung pada | Status | Catatan |
| --- | --- | --- | --- | --- |
| T-001 | Monorepo dan tooling | – | review | pnpm + Turborepo + Biome + Vitest + TS 7; CI & template PR. Kriteria "CI hijau di PR" menunggu PR pertama |
| T-002 | Scaffold aplikasi Admin dan Visitor | T-001 | review | Vite 8 + React 19 + React Router 8; Admin 5173, Visitor 5174 |
| T-003 | Kerangka paket bersama | T-001 | review | 5 paket `@indoor/*` (exports ke src); batas impor di Biome |
| T-004 | Supabase lokal dan skema inti | T-001 | siap | |
| T-005 | Lapisan data | T-003, T-004 | menunggu | |
| T-006 | Sistem desain | T-003 | siap | |
| T-007 | Kerangka Admin | T-002, T-005, T-006 | menunggu | |
| T-008 | Login, logout, reset password | T-007 | menunggu | |
| T-009 | Kelola pengguna dan otorisasi | T-008 | menunggu | |
| T-010 | Pengaturan sistem | T-009 | menunggu | |
| T-011 | Kerangka Visitor | T-002, T-006 | menunggu | |
| T-012 | Catatan peristiwa penting | T-009 | menunggu | |

## R1 · Inti peta (`11-R1-inti-peta.md`)

| Task | Judul | Bergantung pada | Status | Catatan |
| --- | --- | --- | --- | --- |
| T-104 | Fondasi peta (map-core) | T-003, T-006 | menunggu | boleh paralel dengan akhir R0 |
| T-101 | Venue dan multi-venue | R0 | menunggu | |
| T-102 | Gedung dan Area Luar | T-101, T-104 | menunggu | |
| T-103 | Lantai dan default tampilan | T-102 | menunggu | |
| T-105 | Unggah denah PNG/JPG/PDF | T-103 | menunggu | |
| T-106 | Georeferensi dan opasitas | T-105 | menunggu | |
| T-107 | Lapisan acuan lantai lain | T-106 | menunggu | |
| T-108 | Editor: kanvas, alat gambar, draft | T-104, T-106 | menunggu | model besar |
| T-109 | Jenis fitur dan atribut unit | T-108 | menunggu | |
| T-110 | Edit geometri, multi-select, snapping | T-109 | menunggu | |
| T-111 | Undo/redo | T-110 | menunggu | |
| T-112 | Fasilitas dan jenis fasilitas | T-109 | menunggu | |
| T-113 | Panel daftar fitur | T-109 | menunggu | |
| T-114 | Validasi geometri | T-109 | menunggu | |
| T-115 | Tampilan 2D/3D | T-104, T-109 | menunggu | |
| T-116 | Lokasi dasar, kategori, tautan unit | T-109 | menunggu | |
| T-117 | Snapshot minimal | T-115, T-116 | menunggu | |
| T-118 | Visitor: peta, gedung, lantai | T-117, T-011 | menunggu | |
| T-119 | Visitor: cari, kategori, detail, A–Z | T-118 | menunggu | |
| T-120 | Visitor: bahasa ID/EN | T-119 | menunggu | |

## R2 · Navigasi (`12-R2-navigasi.md`)

| Task | Judul | Bergantung pada | Status | Catatan |
| --- | --- | --- | --- | --- |
| T-213 | Spesifikasi deep link | – | menunggu | boleh paralel sejak R1 |
| T-201 | Routing: graf dan A* | R1 | menunggu | model besar |
| T-202 | Routing: konektor | T-201 | menunggu | |
| T-203 | Routing: aksesibel, penutupan, titik masuk | T-202 | menunggu | |
| T-204 | Routing: instruksi | T-203 | menunggu | |
| T-205 | Editor graf | T-201 | menunggu | |
| T-206 | Titik masuk unit/fasilitas | T-205 | menunggu | |
| T-207 | Editor konektor dan aksesibilitas | T-205 | menunggu | |
| T-208 | Tampilan graf | T-207 | menunggu | |
| T-209 | Test route | T-204, T-207 | menunggu | |
| T-210 | Template instruksi | T-204 | menunggu | |
| T-211 | Penutupan dan role Operator | T-203, T-208 | menunggu | |
| T-212 | QR titik asal | T-205 | menunggu | |
| T-214 | Visitor: titik asal | T-213, T-118 | menunggu | |
| T-215 | Visitor: rute dan instruksi | T-204, T-214 | menunggu | |
| T-216 | Visitor: penutupan live | T-211, T-215 | menunggu | |
| T-217 | Visitor: bagikan | T-213, T-215 | menunggu | |

## R3 · Operasional (`13-R3-operasional.md`)

| Task | Judul | Bergantung pada | Status | Catatan |
| --- | --- | --- | --- | --- |
| T-313 | Konversi denah CAD | T-105 | menunggu | butuh keputusan lisensi konverter |
| T-301 | Kunci edit per lantai | R2 | menunggu | |
| T-303 | Tipe lokasi dan field kustom | R2 | menunggu | |
| T-302 | Tipe venue dan template industri | T-303 | menunggu | |
| T-304 | Status dan jam operasional | T-303 | menunggu | |
| T-305 | Import CSV/Excel | T-303, T-304 | menunggu | |
| T-306 | Alias pencarian | T-303 | menunggu | |
| T-307 | Validasi publish lengkap | T-303 | menunggu | model besar |
| T-308 | Ringkasan perubahan | R2 | menunggu | |
| T-309 | Preview | T-308 | menunggu | |
| T-310 | Publish berversi dan rollback | T-307, T-308 | menunggu | |
| T-311 | Visitor: pembaruan versi | T-310 | menunggu | |
| T-312 | Role Viewer dan matriks otorisasi | T-310 | menunggu | |

## R4 · Komersial (`14-R4-komersial.md`)

| Task | Judul | Bergantung pada | Status | Catatan |
| --- | --- | --- | --- | --- |
| T-410 | Branding Visitor | T-117 | menunggu | boleh paralel sejak R1 |
| T-401 | Format lisensi dan license-cli | R3 | menunggu | model besar |
| T-402 | Aktivasi online dan manual | T-401 | menunggu | |
| T-403 | Check-in, pencabutan, proteksi waktu | T-402 | menunggu | |
| T-404 | Status lisensi dan kuota | T-402 | menunggu | |
| T-405 | Fitur per paket | T-404 | menunggu | |
| T-406 | Pengingat, tenggang, kedaluwarsa | T-403, T-404 | menunggu | |
| T-407 | Info Point di Admin | T-404 | menunggu | |
| T-408 | Mode Info Point | T-407 | menunggu | |
| T-409 | Lanjutkan di HP, pembaruan, offline | T-408 | menunggu | |
| T-411 | Paket instalasi dan backup | T-402 | menunggu | |
| T-412 | Performa, kompatibilitas, pengerasan | T-409, T-411 | menunggu | |

## Pertanyaan terbuka

Format: `- [tanggal] T-xxx — pertanyaan. Opsi: A) … B) … Rekomendasi: … (status: menunggu jawaban)`

- (belum ada)

## Catatan keputusan

Format: `- [tanggal] T-xxx — keputusan — alasan`

- [2026-09-29] T-001 — Task dikerjakan berurutan di branch `claude/vibrant-davinci-uyrrka`, bukan `task/T-xxx-*` dari `main` — repo belum punya branch `main`, dan pemilik meminta task dikerjakan beruntun dalam satu sesi. Dependensi dianggap terpenuhi bila task sebelumnya sudah ter-commit dengan status `review`.
- [2026-09-29] T-001 — TypeScript 7 (kompiler native) — versi stabil terbaru; semua opsi di `tsconfig.base.json` didukung. Jika ada alat yang butuh API JS TypeScript lama, turunkan ke 6.x.
- [2026-09-29] T-001 — `pnpm lint` di root menjalankan `biome check .` untuk seluruh repo (tugas root `//#lint`, tanpa cache) — file konfigurasi root ikut diperiksa; lint per paket tetap ditambahkan di T-002/T-003 untuk cache per paket.
- [2026-09-29] T-001 — `.gitignore` mengecualikan `.env*` kecuali `.env.example` — T-004 mewajibkan `.env.example` di-commit.
- [2026-09-29] T-002 — Versi dependensi bersama lewat `catalog:` di `pnpm-workspace.yaml` — satu versi TypeScript/React/Vite/Vitest untuk semua paket. Oxlint bawaan template Vite dihapus karena Biome menggantikannya.
- [2026-09-29] T-002 — Tiap app punya `tsconfig.json` (src, DOM) dan `tsconfig.node.json` (vite.config.ts); `typecheck` menjalankan keduanya. `build` hanya `vite build` karena typecheck sudah di `pnpm check`.
- [2026-09-29] T-003 — ID bermerek dibuat dari skema zod (`z.uuid().brand<'VenueId'>()`) — satu sumber untuk tipe dan validasi saat parsing baris/URL.
- [2026-09-29] T-003 — Selain larangan React/MapLibre/Supabase di `domain` dan `routing`, Biome juga menegakkan aturan dependensi `03-arsitektur.md`: `domain` tidak mengimpor `@indoor/*`, `routing` hanya `@indoor/domain`, `map-core` tidak mengimpor `@indoor/data`/`@supabase/*`.
- [2026-09-29] T-003 — Test paket murni di folder `test/` (sejalan dengan `test/fixtures/` di `06-alur-kerja.md`); `domain` dan `routing` hanya memakai lib ES2023 tanpa DOM.
- [2026-09-29] T-001 — `agentGuidance: false` di `turbo.json` — Turborepo 2.11 otomatis menulis `AGENTS.md` saat mendeteksi agen; aturan agen sudah ada di `CLAUDE.md`.

## Riwayat rilis

| Rilis | Tag | Tanggal | Ringkasan |
| --- | --- | --- | --- |
| – | – | – | – |
