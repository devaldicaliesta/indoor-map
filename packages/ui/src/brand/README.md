# Logo PanduArah

Sumber resmi dari pemilik ada di `docs/brand/` (`panduarah-logo.webp`, gambar raster berlatar putih).
Folder ini berisi versi vektornya yang dipakai Admin, Visitor, dan email.

| Berkas | Isi |
| --- | --- |
| `panduarah-logo.svg` | **Sumber vektor**: simbol + tulisan, latar transparan. Hasil jiplak `panduarah-logo.webp` (potrace per warna, 4× supersampling); selisih rata-rata dengan berkas asli < 1/255 per piksel. `<view id="symbol">` menandai lebar simbol |
| `panduarah-symbol.svg` | Simbol saja (favicon, sidebar Admin diciutkan, ikon bawaan Visitor) |
| `panduarah-logo-white.svg`, `panduarah-symbol-white.svg` | Satu warna putih untuk latar gelap, tanpa kotak latar |
| `logo-paths.ts` | Path untuk komponen `BrandLogo` dan `BrandSymbol` |
| `brand-logo.tsx` | Komponen React; warna dari token `--brand-blue`, `--brand-yellow`, `--brand-ink` (`tokens.css`) |

Warna: biru `#0F4A91`, kuning `#FEC409`, hitam `#04080B`. Bentuk dan warna tidak boleh diubah.
Bila pemilik memberi berkas vektor asli, ganti `panduarah-logo.svg` dengan berkas itu (pertahankan
`id` path dan `<view id="symbol">`), lalu buat ulang semua turunan:

```
node scripts/brand-assets.mjs
```

Skrip itu juga menulis favicon (`apps/admin/public/favicon.*`, `apps/visitor/public/icons/favicon.svg`),
ikon PWA Visitor (192, 512, maskable dengan ruang aman 80%, apple-touch 180 berlatar putih), dan
PNG logo email (`supabase/functions/_shared/brand-logo.ts`, latar putih agar terbaca di mode gelap).
`test/brand.test.ts` gagal bila turunan tidak sama dengan sumber.

Di Visitor dan Info Point logo venue (branding) tetap yang utama: PanduArah hanya menjadi ikon bawaan
saat venue belum punya logo dan teks kecil "Didukung oleh PanduArah" di dialog informasi peta.
