# cad-converter

Layanan kecil yang mengubah denah **DXF** menjadi gambar per layer untuk Admin (T-313) dan memindai
denah **gambar** (PNG/JPEG) menjadi kandidat ruang dan dinding (T-548). Ikut dalam
paket instalasi (T-411) sebagai container terpisah. Tanpa state: berkas dikirim di badan
permintaan, tidak disimpan, dan layanan tidak menyentuh database.

- **DXF** dibaca dengan [ezdxf](https://github.com/mozman/ezdxf) (MIT).
- **DWG ditolak** dengan arahan menyimpan sebagai DXF/PDF dari software CAD atau DWG TrueView
  (gratis). ODA File Converter/SDK dan Aspose tidak dipakai karena redistribusinya berbayar;
  LibreDWG (GPLv3) ditunda (lihat catatan keputusan T-313 di `docs/PROGRESS.md`).
- **Scan denah gambar** memakai [OpenCV](https://opencv.org/) (`opencv-python-headless`, Apache-2.0)
  di server klien sendiri. Gambar tidak dikirim ke layanan pihak ketiga atau cloud.

## Endpoint

| Metode | Path | Badan | Hasil |
| --- | --- | --- | --- |
| `POST` | `/inspect` | DXF | `{ layers: [{name, entities}], unit, metersPerUnit, extents }` |
| `POST` | `/render?layer=A&layer=B&maxPx=4000` | DXF | `{ svg, widthPx, heightPx, extents }` |
| `POST` | `/scan?sensitivity=low|medium|high` | PNG/JPEG | `{ widthPx, heightPx, rooms: [{points, confidence}], walls: [{points, confidence}] }` |
| `GET` | `/health` | – | `{ ok: true }` |

Setiap `POST` wajib membawa `Authorization: Bearer <token sesi Supabase>`. Layanan memeriksa:

1. sesi ke `SUPABASE_URL/auth/v1/user` — tidak sah: **401** `unauthorized`;
2. fitur lisensi lewat RPC `SUPABASE_URL/rest/v1/rpc/license_features` atas nama pemanggil —
   tanpa `cad_import`: **403** `feature_locked` (T-514). Kunci di UI Admin tidak bisa dilewati
   dengan memanggil layanan ini langsung.

Maksimal 50 MB.

### Scan denah (`/scan`)

Koordinat hasil dalam piksel gambar asli; Admin mengubahnya ke WGS84 lewat georeferensi denah
aktif (interpolasi bilinear empat sudut) lalu membuang poligon < 1 m², yang memotong diri, dan
dinding < 0,3 m. Langkahnya: ambang adaptif, buang komponen kecil (teks, simbol), perkirakan tebal
dinding (2 × luas / keliling), tutup celah pintu selebar `door_ratio` × tebal dinding, lalu:

- **ruang**: ruang kosong yang tidak menyentuh tepi gambar, diperbesar setebal dinding,
  disederhanakan (`approxPolyDP`) dan diluruskan ke sumbu bila hampir tegak lurus;
- **dinding**: garis horizontal/vertikal dari morphological opening dengan kernel garis, garis
  miring dari skeleton + `HoughLinesP` pada sisanya.

Kepekaan `low`/`medium`/`high` mengatur ambang, ukuran komponen yang dibuang, lebar pintu (5/7/9 ×
tebal dinding), luas ruang minimum, dan ambang Hough. Gambar diperkecil ke sisi maksimal 2000 px
untuk diproses. Batas: sisi gambar 8000 px (**413** `too_large_px`), bukan PNG/JPEG (**415**
`invalid_image`), kepekaan tidak dikenal (**400**), lebih dari 30 detik (**422** `timeout`).
`confidence` 0–1: ruang dari kedekatan bentuk ke persegi panjang dan jumlah titik sudut, dinding
dari panjang dan apakah sejajar sumbu. Admin tidak memilih otomatis yang di bawah 0,6.

## Konfigurasi

| Variabel | Isi |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Untuk memeriksa sesi pengguna Admin dan fitur lisensi `cad_import` |
| `ALLOWED_ORIGINS` | Origin Admin, dipisah koma (CORS) |
| `PORT` | Bawaan `8090` |
| `ALLOW_ANONYMOUS=1` | Hanya untuk pengembangan: tanpa pemeriksaan sesi |

Admin membaca alamat layanan dari `VITE_CAD_CONVERTER_URL`. Tanpa nilai itu, unggah DXF ditolak
dengan pesan bahwa konversi CAD belum dipasang.

## Lokal

```
pip install -r requirements.txt
SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=… ALLOWED_ORIGINS=http://localhost:5173 \
  python -m app.server
python -m unittest discover -s tests -t .
python -m tests.fixtures.make_fixtures   # buat ulang denah uji scan
```

Lisensi dev dari seed tidak memuat `cad_import`, jadi konversi lokal membalas 403 sampai lisensi
berfitur itu dipasang (E2E `tests/license/cad-floor-plan.spec.ts` dan
`tests/license/T-548-floor-plan-scan.spec.ts` memasangnya lewat
`devLicenseFile({ features })` lalu memulihkan lisensi semula).
