# Landing page PanduArah (T-505)

Situs vendor statis: pengenalan produk, jenis gedung, fitur, peta 3D interaktif (venue demo konser
stadion dan rumah sakit, lengkap dengan orang mini), cara kerja, model on-premise dan lisensi,
tangkapan layar, ajakan kontak lewat email, dan kebijakan privasi (`/privasi/`). Dua bahasa (ID/EN,
`?lang=en`). **Bukan bagian paket instalasi klien.**

Versi terbit ada di branch `landing-publish` dan dihosting di Cloudflare Pages dengan domain
**https://panduarah.my.id** (nameserver domain dari Rumahweb diarahkan ke Cloudflare). Alamat domain
juga tertulis di tag canonical/Open Graph `index.html` dan `privasi/index.html`, `public/robots.txt`,
dan `public/sitemap.xml`; ubah semuanya bila domain berganti.

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
