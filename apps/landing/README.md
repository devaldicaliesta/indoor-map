# Landing page PanduArah (T-505)

Situs vendor statis: pengenalan produk, jenis gedung, fitur, peta 3D interaktif (venue demo konser
stadion dan rumah sakit, lengkap dengan orang mini; klik lokasi atau pilih tujuan untuk melihat rute
dari titik asal venue), cara kerja, model on-premise dan lisensi,
tangkapan layar, ajakan kontak lewat email, dan kebijakan privasi (`/privasi/`). Dua bahasa (ID/EN,
`?lang=en`). **Bukan bagian paket instalasi klien.**

```
pnpm dev:landing                           # http://localhost:5175
pnpm --filter @indoor/landing build        # dist/ siap di-host statis (index.html + privasi/index.html)
node scripts/landing-motion.mjs            # render ulang video motion graphic (public/media/)
```

## Form trial (belum dipasang)

Di branch `landing-publish` (versi yang diterbitkan) form permintaan trial dilepas: tombol utama
menuju bagian "Hubungi kami" yang berisi tautan email vendor, dan kebijakan privasi hanya membahas
email yang dikirim pengunjung. Edge Function `supabase/functions/trial-request` dan aturan validasi
`@indoor/domain/trial-request` tetap ada di repo dan tidak dipasang. Form lengkapnya ada di branch
pengembangan (T-505) bila nanti trial dibuka lewat situs.

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
