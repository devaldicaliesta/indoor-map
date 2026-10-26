# Uji performa, beban, kompatibilitas, dan aksesibilitas (T-412)

Semua pengukuran memakai **paket instalasi** (`deploy/`), agar yang diukur adalah build produksi,
service worker, kompresi gateway, dan Supabase self-host yang sama dengan server klien. Hasil ada
di `results/`; ringkasan dan analisisnya di `docs/laporan-performa.md`.

## Persiapan

1. Pasang paket instalasi (lihat `deploy/README.md`), aktivasi lisensi, buat Super Admin.
2. Isi variabel lingkungan:

   ```sh
   export PERF_API_URL=https://api.<domain>   PERF_ADMIN_URL=https://admin.<domain>
   export PERF_VISITOR_URL=https://<domain>   PERF_ANON_KEY=<ANON_KEY dari .env folder instalasi>
   export PERF_EMAIL=<super admin>            PERF_PASSWORD=<password>
   # Instalasi dengan TLS_MODE=internal: NODE_TLS_REJECT_UNAUTHORIZED=0
   ```

3. Isi data uji (venue besar 10 lantai / 2.000 fitur / 20.000 edge, lantai padat 1.000 fitur,
   venue contoh kecil), lalu publish. Venue `Perf …` lama dihapus dulu:

   ```sh
   pnpm --filter @indoor/perf exec playwright test --project=seed
   ```

## Pengukuran

| Perintah | Isi |
| --- | --- |
| `playwright test specs/visitor.perf.ts` | Muat awal dan kunjungan ulang Visitor (4G dan Slow 4G, CPU 4×), rute antar-lantai terjauh |
| `playwright test specs/editor.perf.ts` | FPS editor di lantai 1.000 fitur dibanding lantai kosong |
| `playwright test specs/a11y.perf.ts` | Audit axe WCAG 2.1 AA di 15 halaman |
| `playwright test -c playwright.compat.config.ts` | Matriks Chromium/Edge, Firefox, WebKit/Safari, Android, iPhone |
| k6 (di bawah) | 200 pengunjung + 20 Admin bersamaan |

`@axe-core/playwright` (MPL-2.0) adalah devDependency paket ini saja, hanya alat test, tidak ikut
produk atau paket instalasi (keputusan pemilik 2026-10-05).

Matriks browser butuh Firefox dan WebKit; jalankan di image Playwright resmi:

```sh
docker run --rm --network host --ipc=host -v "$PWD/../..:/repo" -w /repo/tests/perf \
  -e PERF_API_URL -e PERF_ANON_KEY -e PERF_ADMIN_URL -e PERF_VISITOR_URL -e PERF_EMAIL -e PERF_PASSWORD \
  mcr.microsoft.com/playwright:v1.56.1-noble npx playwright test -c playwright.compat.config.ts
```

Uji beban (k6 lewat Docker; `LOAD_VENUE_ID` dan `LOAD_LOCATION_ID` dari `results/venue.json`):

```sh
docker run --rm --network host -v "$PWD/k6:/scripts" \
  -e LOAD_API_URL=$PERF_API_URL -e LOAD_VISITOR_URL=$PERF_VISITOR_URL -e LOAD_ANON_KEY=$PERF_ANON_KEY \
  -e LOAD_VENUE_ID=… -e LOAD_LOCATION_ID=… -e LOAD_EMAIL=$PERF_EMAIL -e LOAD_PASSWORD=$PERF_PASSWORD \
  grafana/k6 run /scripts/load.js
```

Skenario `tables` (T-503) membuka tabel server Lokasi, Penutupan, Riwayat publish, dan Log audit
(cari, filter, pindah halaman) dengan `LOAD_TABLE_USERS` Admin (bawaan 10); ambang p95 < 500 ms.
Lama tahan beban diatur `LOAD_HOLD` (bawaan `2m`).

`pnpm check` hanya menjalankan test generator fixture (`test/`); spec di atas dijalankan manual
karena butuh instalasi yang berjalan.
