# Landing page PanduArah (T-505)

Situs vendor statis: pengenalan produk, jenis gedung, fitur, peta 3D interaktif (venue demo konser
stadion dan rumah sakit, lengkap dengan orang mini; klik lokasi atau pilih tujuan untuk melihat rute
dari titik asal venue), cara kerja, model on-premise dan lisensi,
tangkapan layar, ajakan kontak lewat email, dan kebijakan privasi (`/privasi/`). Dua bahasa (ID/EN,
`?lang=en`). **Bukan bagian paket instalasi klien.**

Versi terbit ada di branch `production` dan dihosting di Cloudflare Pages dengan domain
**https://panduarah.my.id** (nameserver domain dari Rumahweb diarahkan ke Cloudflare). Alamat domain
juga tertulis di tag canonical/Open Graph `index.html` dan `privasi/index.html`, `public/robots.txt`,
dan `public/sitemap.xml`; ubah semuanya bila domain berganti.

```
pnpm dev:landing                           # http://localhost:5175
pnpm --filter @indoor/landing build        # dist/ siap di-host statis (index.html, privasi/, trial/verifikasi/)
node scripts/landing-motion.mjs            # render ulang video motion graphic (public/media/)
node scripts/promo-motion.mjs --concept pengelola --size 1920x1080 --lang id   # video promosi (motion-promo/README.md)
```

## Trial otomatis (T-616)

Bagian **"Coba gratis 17 hari"** (`#trial`) mengirim form ke Edge Function `trial-request`;
pemohon menerima email berisi tautan ke **`/trial/verifikasi/?token=…`** (halaman HTML ketiga,
`noindex`, tanpa Referer), yang memanggil `trial-verify` lalu menampilkan hasilnya: ruang kerja
siap (tautan Admin dan Visitor), antre, ditolak, kedaluwarsa, atau tidak berlaku. Token dihapus
dari alamat setelah dibaca. Validasi di peramban memakai `@indoor/domain/trial-request`
(`checkHostedTrialRequest`), sama dengan server. Tombol **"Lihat demo"** membuka Visitor
sungguhan di `/v/demo` (T-613).

Variabel build (Cloudflare Pages): `VITE_SUPABASE_URL` (project vendor ter-hosting) dan
`VITE_VISITOR_URL` (bawaan `https://app.panduarah.my.id`). Kebijakan privasi menyebut isian form,
alasan, dan masa simpannya; masa simpan 12 bulan ditegakkan `hosting_lifecycle_forget` (migrasi
0051) lewat siklus hidup trial.

## Performa

MapLibre dan data demo hanya dimuat saat bagian demo hampir terlihat (atau tombol "Muat peta 3D"),
video memakai poster dan `preload="none"`, tangkapan layar `loading="lazy"`. Modul `@indoor/ui` dan
`@indoor/domain` ditandai bebas efek samping di `vite.config.ts` agar komponen yang tidak dipakai
tidak ikut bundel.

## Rute di peta demo

Klik lokasi di peta (atau pilih dari daftar "Tujuan") menyorot lokasi itu dan menggambar rute dari
QR titik asal pertama venue demo (Gerbang 1 konser, Lobi Utama rumah sakit), dihitung di browser
dengan `@indoor/routing` yang sama dengan Visitor. Kartu rute menampilkan jarak, lantai yang
dilewati, dan teks langkah dari template instruksi venue. Graf rute baru dibangun saat rute pertama
diminta.

Test E2E proyek `landing` dijalankan terhadap build produksi (`vite preview` di port 5175) karena
masalah seperti worker MapLibre yang tidak ikut di-bundle tidak terlihat di dev server.
