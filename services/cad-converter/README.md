# cad-converter

Layanan kecil yang mengubah denah **DXF** menjadi gambar per layer untuk Admin (T-313). Ikut dalam
paket instalasi (T-411) sebagai container terpisah. Tanpa state: berkas dikirim di badan
permintaan, tidak disimpan, dan layanan tidak menyentuh database.

- **DXF** dibaca dengan [ezdxf](https://github.com/mozman/ezdxf) (MIT).
- **DWG ditolak** dengan arahan menyimpan sebagai DXF/PDF dari software CAD atau DWG TrueView
  (gratis). ODA File Converter/SDK dan Aspose tidak dipakai karena redistribusinya berbayar;
  LibreDWG (GPLv3) ditunda (lihat catatan keputusan T-313 di `docs/PROGRESS.md`).

## Endpoint

| Metode | Path | Badan | Hasil |
| --- | --- | --- | --- |
| `POST` | `/inspect` | DXF | `{ layers: [{name, entities}], unit, metersPerUnit, extents }` |
| `POST` | `/render?layer=A&layer=B&maxPx=4000` | DXF | `{ svg, widthPx, heightPx, extents }` |
| `GET` | `/health` | – | `{ ok: true }` |

Setiap `POST` wajib membawa `Authorization: Bearer <token sesi Supabase>`; token diperiksa ke
`SUPABASE_URL/auth/v1/user`. Maksimal 50 MB.

## Konfigurasi

| Variabel | Isi |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Untuk memeriksa sesi pengguna Admin |
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
```
