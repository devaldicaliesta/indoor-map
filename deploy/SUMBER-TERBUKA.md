# Komponen sumber terbuka di paket PanduArah

PanduArah adalah perangkat lunak berlisensi milik vendor. Paket instalasi ini juga membawa
komponen sumber terbuka milik pihak lain. Komponen itu tetap berada di bawah lisensinya
masing-masing, dan lisensi itu tidak berlaku untuk kode PanduArah. Berkas ini menjelaskan
komponen tersebut dan cara mendapatkan kode sumbernya.

## Berkas lisensi di paket ini

| Berkas | Isi |
| --- | --- |
| `licenses/admin.txt`, `licenses/visitor.txt` | Pustaka JavaScript dan font di aplikasi Admin dan Visitor, beserta teks lisensinya. Juga bisa dibuka di `https://<domain>/third-party-notices.txt` |
| `licenses/functions.txt` | Pustaka di image `functions` (Edge Function) |
| `licenses/cad-converter.txt` | Pustaka Python di image `cad-converter` |
| `licenses/os-packages/*.txt` | Paket sistem operasi dan komponen di setiap image Docker, dengan versi persisnya |

Teks lisensi lengkap paket sistem operasi juga ada di dalam image itu sendiri, misalnya
`/usr/share/doc/<paket>/copyright` di image berbasis Debian dan `/usr/share/licenses` di Alpine.

## Komponen server

| Image | Komponen | Lisensi utama |
| --- | --- | --- |
| `supabase/postgres` | PostgreSQL, PostGIS, pg_cron, pg_net, Supabase Vault, dan ekstensi lain | PostgreSQL; **PostGIS GPL-2.0-or-later**; lihat di bawah |
| `supabase/gotrue` | Supabase Auth | MIT |
| `postgrest/postgrest` | PostgREST | MIT |
| `supabase/storage-api` | Supabase Storage | Apache-2.0 |
| `panduarah/functions` | Supabase Edge Runtime (Deno), Edge Function PanduArah | Edge Runtime MIT; kode PanduArah milik vendor |
| `panduarah/web` | Caddy, build Admin dan Visitor | Caddy Apache-2.0; kode PanduArah milik vendor |
| `panduarah/cad-converter` | Python, ezdxf, Pillow, numpy | Python PSF-2.0; pustaka permisif (`licenses/cad-converter.txt`) |

## Komponen berlisensi GPL dan LGPL

Image di paket ini memuat program berlisensi GNU GPL atau LGPL. Program itu dikirim **tanpa
diubah** dan berjalan sebagai program terpisah: aplikasi PanduArah hanya berkomunikasi
dengannya lewat SQL, HTTP, atau baris perintah. Karena itu kode PanduArah tidak tunduk pada
GPL. Versi di bawah adalah versi saat berkas ini ditulis; versi persis untuk rilis ini ada di
`licenses/os-packages/`.

- **PostGIS 3.3.7** (GPL-2.0-or-later), di image `supabase/postgres`. Dipakai untuk data
  geometri.
- **pgRouting 3.4.1** (GPL-2.0-or-later) dan **SFCGAL 2.2.0** (LGPL-2.0-or-later, memakai
  CGAL yang sebagian GPL-3.0-or-later), di image `supabase/postgres`. Ikut di image bawaan
  Supabase tetapi tidak diaktifkan atau dipakai PanduArah.
- Paket sistem operasi di image berbasis Alpine (`supabase/postgres`, `supabase/gotrue`,
  `supabase/storage-api`, `panduarah/web`) dan Debian (`panduarah/functions`,
  `panduarah/cad-converter`), misalnya BusyBox (GPL-2.0), bash dan coreutils (GPL-3.0), serta
  glibc (LGPL-2.1). Daftar persisnya ada di `licenses/os-packages/`.

### Penawaran tertulis kode sumber

Selama sekurang-kurangnya **tiga tahun** sejak Anda menerima rilis ini, vendor PanduArah
menyediakan salinan lengkap kode sumber yang bersesuaian, dalam bentuk yang dapat dibaca
mesin, untuk setiap komponen GPL dan LGPL di image rilis ini. Biayanya tidak lebih dari ongkos
fisik penyalurannya. Penawaran ini berlaku untuk siapa pun yang menerima paket ini.

Kirim permintaan ke **panduarahid@gmail.com** dengan menyebut versi rilis (`APP_VERSION` di
`release.env`) dan nama image atau komponen.

Sumber hulu yang sama juga tersedia di:

- image `supabase/postgres` (dibangun dengan Nix): https://github.com/supabase/postgres
- PostGIS: https://download.osgeo.org/postgis/source/
- pgRouting: https://github.com/pgRouting/pgrouting
- SFCGAL: https://gitlab.com/sfcgal/SFCGAL · CGAL: https://github.com/CGAL/cgal
- paket Alpine: https://gitlab.alpinelinux.org/alpine/aports
- paket Debian: https://sources.debian.org dan https://snapshot.debian.org
