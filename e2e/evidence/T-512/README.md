# T-512 · Visitor tanpa WebGL — bukti E2E

Spec: `e2e/tests/visitor-nowebgl/T-512-no-webgl.spec.ts`, proyek `visitor-nowebgl` (Chromium
`--disable-webgl --disable-3d-apis`, HP 360 × 740; Info Point 1080 × 1920 di halaman tambahan).
Setiap test juga memastikan `canvas.getContext('webgl2')` memang `null` di browser itu, tidak ada
elemen peta, dan tidak ada layar "Terjadi kesalahan" / "Something went wrong". Hasil: **3 lulus**
(Supabase lokal, 2026-10-26). Test case: TC-HRD-04.

| Gambar | Langkah |
| --- | --- |
| [01](01-hp-pesan-tanpa-peta.png) | Dibuka lewat QR titik asal (`?o=`): "Perangkat ini tidak mendukung peta" di area peta, baris "Anda di sini: Lobi Utama" dan chip tetap di sheet |
| [02](02-hp-cari-radiologi.png) | Cari "radiologi" → profil Radiologi terbuka |
| [03](03-hp-langkah-rute.png) | "Rute ke sini": Dari Lobi Utama ke Radiologi, jarak, chip lantai, daftar langkah sampai "Tiba di Radiologi"; mode langkah (Langkah 2 → 3 dari N) tetap berjalan tanpa peta |
| [04](04-hp-pilih-asal-tanpa-peta.png) | Tanpa QR: "Anda sedang di mana?" tanpa tombol "Ketuk di peta" dan tanpa kalimat ketuk peta; asal dipilih lewat cari GF-B08 → "Saya di sini" → langkah rute |
| [05](05-info-point-pesan.png) | Info Point: pesan versi layar besar (judul 32 px, ikon 64 px) di area peta, panel bawah tetap utuh |
| [06](06-info-point-langkah-rute.png) | Info Point: cari "RADIO" dengan keyboard layar → "Rute ke sini" → langkah dari Info Point Lobi sampai Radiologi dan QR "Lanjutkan di HP" |

Lapisan lain:
- **U** `packages/map-core/test/webgl.test.ts` (4): WebGL2 ada → `true` dan konteks uji dilepas;
  hanya WebGL1 → `false` (MapLibre 6 butuh WebGL2); `getContext` `null`, melempar galat, atau
  pembuatan canvas gagal → `false`.
- Peta yang tetap gagal dibuat walau pemeriksaan lolos (konteks GPU ditolak) ditangkap di
  `VenueMap` dan berganti ke pesan yang sama (`markMapFailed`).

| ID | Hasil |
| --- | --- |
| TC-HRD-04 | Lulus |
