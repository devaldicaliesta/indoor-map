# T-505 · Landing page (versi terbit, tanpa form trial) — bukti

Spec: `e2e/tests/landing/T-505-landing.spec.ts` (proyek Playwright `landing`; hanya server landing
yang dinyalakan bila dijalankan sendiri: `pnpm --filter @indoor/e2e exec playwright test --project=landing`).
Hasil di branch `landing-publish`: **4 lulus** (2026-10-08). Form trial dilepas dari situs terbit;
bukti form (TC-LND-02/03/04/05/07) ada di branch pengembangan T-505.

| Gambar | Isi | TC |
| --- | --- | --- |
| [01](01-desktop-id.png), [02](02-desktop-id-penuh.png) | Desktop 1280 × 800 ID: hero dengan video motion graphic, seluruh bagian | TC-LND-01 |
| [03](03-desktop-en.png) | Ganti ke English tanpa muat ulang | TC-LND-01 |
| [04](04-hp-en.png), [05](05-hp-id-penuh.png) | HP 360 px EN (pilihan diingat) dan ID, tanpa geser ke samping | TC-LND-01 |
| [06](06-demo-konser-3d.png), [07](07-demo-konser-l2.png) | Peta 3D interaktif konser stadion dengan orang mini; ganti ke L2 | — |
| [08](08-demo-rumah-sakit.png) | Peta 3D rumah sakit (venue berganti, orang mini dimatikan lalu dinyalakan) | — |
| [09](09-kontak.png) | Tombol "Hubungi kami" menuju bagian kontak dengan tautan email vendor; tidak ada form | — |
| [10](10-privasi-id.png) | Kebijakan privasi dari kaki halaman, ID lalu EN | TC-LND-08 |

## Langkah manual

- **TC-LND-06 Lighthouse mobile** (diukur sebelum form dilepas; build produksi `vite preview`, Lighthouse 12, Chromium Playwright):
  beranda performa **97**, aksesibilitas **100**, best practices 100, SEO 100 (LCP 2,1 s, TBT 50 ms,
  CLS 0); privasi 99 / 100 / 100 / 100. Laporan: [beranda](lighthouse-mobile-beranda.html),
  [privasi](lighthouse-mobile-privasi.html).
