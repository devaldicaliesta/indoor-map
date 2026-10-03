# T-316 · Ikon POI di peta Visitor — bukti

Gambar dari Mal Demo Sentosa (`pnpm db:seed-demo`) di Visitor lokal (2026-10-03).

| Gambar | Isi |
| --- | --- |
| [01](01-mal-poi-desktop.png) | Desktop: setiap lokasi berpenanda lingkaran berwarna kategorinya (cincin putih, piktogram kategori atau titik) dengan nama di bawahnya; penanda yang bertumpuk disembunyikan menurut prioritas, sama dengan ikon fasilitas |
| [02](02-mal-poi-hp.png) | HP: penanda yang sama; gedung memanjang masih kecil di bingkai awal (T-317) |

Diuji unit: `mapLabels` membawa `categoryId` (domain), `labelCollection` mengisi `icon` (`facility-category-<id>` untuk lokasi berkategori, kosong tanpa kategori) dan layer label memakai `['get', 'icon']` dengan nama di bawah ikon (map-core). Mengetuk penanda membuka detail lokasi lewat ketukan unit yang sudah diuji di T-119/T-214.
