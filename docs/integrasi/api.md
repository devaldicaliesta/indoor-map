# API dan webhook integrasi

Ditujukan untuk tim TI yang menghubungkan sistem lain (SIMRS, sistem akademik, HR, sistem fasilitas) dengan PanduArah. Integrasi berjalan dua arah:

- **API REST**: sistem klien membaca dan mengubah lokasi, kategori, status, jam operasional, dan penutupan.
- **Webhook**: PanduArah mengabari sistem klien setiap ada publish, penutupan, atau perubahan lokasi.

Spesifikasi lengkap dalam format OpenAPI 3.1 ada di [`openapi.json`](openapi.json). Instalasi yang sedang berjalan juga menyajikannya di `GET {alamat API}/v1/openapi.json` tanpa kunci. Contoh sinkronisasi terjadwal tersedia di [`examples/sinkronisasi-jam`](../../examples/sinkronisasi-jam/README.md).

## Alamat

```
{URL Supabase instalasi}/functions/v1/api
```

Alamat lengkapnya tertulis di Admin → **Integrasi** → **Alamat API**. Contoh: `https://panduarah.rs.id/functions/v1/api`. Setiap endpoint di bawah berada di bawah alamat itu, misalnya `.../functions/v1/api/v1/venues`.

## Kunci API

Kunci dibuat, dilihat, dan dicabut oleh **Super Admin** di Admin → **Integrasi** → **Kunci API**. Role lain tidak melihat menu ini, dan server menolak permintaan mereka.

- Buat satu kunci untuk setiap sistem, supaya satu sistem bisa dicabut tanpa mengganggu yang lain.
- **Izin** diberikan per modul. Berikan seperlunya saja.

  | Izin | Untuk |
  | --- | --- |
  | `locations:read` | Membaca venue, lokasi, kategori, dan jam |
  | `locations:write` | Upsert lokasi (nama, tipe, status, kategori, jam) |
  | `closures:read` | Membaca penutupan yang berjalan dan terjadwal |
  | `closures:write` | Membuat dan mengakhiri penutupan |

- **Venue**: semua venue, termasuk yang dibuat nanti, atau beberapa venue tertentu saja. Venue di luar jangkauan kunci dijawab 404.
- Kunci berbentuk `pa_` diikuti 48 karakter heksadesimal, dan **hanya tampil sekali** saat dibuat. Server hanya menyimpan sidik SHA-256-nya. Bila kunci hilang atau bocor, cabut lalu buat kunci baru.
- Kunci yang dicabut langsung ditolak (401). Pembuatan dan pencabutan kunci, serta setiap perubahan lewat API, tercatat di log audit (Pengaturan → Catatan) bersama nama kuncinya.
- Selama lisensi tidak berlaku, permintaan yang mengubah data ditolak (403). Permintaan baca tetap dilayani.

Kirim kunci di header:

```
Authorization: Bearer pa_...
```

Header `X-API-Key: pa_...` juga diterima. Batasnya 120 permintaan per menit untuk setiap kunci; lewat dari itu dijawab 429.

## Galat

Setiap galat berbentuk JSON `{"message": "...", "errors": ["..."]}`. Bagian `errors` hanya ada bila isian tidak sah.

| Status | Arti |
| --- | --- |
| 400 | Badan permintaan bukan JSON, atau nilai tidak bisa dibaca |
| 401 | Kunci tidak dikirim, salah, atau sudah dicabut |
| 403 | Kunci tidak punya izin yang diperlukan, lisensi tidak berlaku, atau venue terkunci |
| 404 | Venue, lokasi, unit, atau penutupan tidak ada (atau di luar jangkauan kunci) |
| 409 | Bentrok keadaan, misalnya penutupan yang sudah berakhir |
| 413 | Badan permintaan lebih dari 2 MB |
| 422 | Isian tidak sah. Untuk upsert, seluruh permintaan dibatalkan |
| 429 | Terlalu banyak permintaan |

## Endpoint

### `GET /v1/venues`

Daftar venue yang bisa dijangkau kunci, berupa `{"venues": [{"id", "name", "timezone"}]}`.

### `GET /v1/venues/{venueId}/locations[?code=KODE]`

Izin yang dibutuhkan: `locations:read`. Endpoint ini membaca **draft**, yaitu data terbaru di Admin, termasuk yang belum dipublish.

```json
{
  "locations": [
    {
      "id": "6f0c…",
      "code": "RAD-01",
      "name": "Radiologi",
      "type": "Poli",
      "status": "active",
      "openingDate": null,
      "categories": ["Pemeriksaan"],
      "units": ["UJI-GF-001"],
      "hours": {
        "weekly": { "mon": ["08:00-12:00", "13:00-16:00"], "tue": ["08:00-16:00"], "wed": [], "thu": [], "fri": [], "sat": [], "sun": [] },
        "special": [{ "date": "2026-12-24", "spans": [] }]
      },
      "visitorPath": "/v/{venueId}?loc=6f0c…",
      "updatedAt": "2026-11-22T12:00:00+00:00"
    }
  ]
}
```

Status lokasi yang mungkin: `active`, `coming_soon` (wajib `openingDate`), `inactive_temporary`, `inactive_permanent`. Hari tanpa rentang jam berarti tutup. Tanggal khusus dengan `spans` kosong berarti tutup sepanjang hari itu.

### `PUT /v1/venues/{venueId}/locations`

Izin yang dibutuhkan: `locations:write`. Endpoint ini melakukan upsert massal berdasarkan **kode lokasi**, paling banyak 1.000 lokasi per permintaan.

```json
{
  "locations": [
    {
      "code": "POLI-ANAK",
      "status": "active",
      "categories": ["Poli Spesialis"],
      "hours": {
        "weekly": { "mon": ["08:00-12:00", "13:00-16:00"], "fri": ["08:00-11:30"] },
        "special": [{ "date": "2026-12-24", "spans": [] }]
      }
    },
    { "code": "POLI-GIGI-2", "name": "Poli Gigi 2", "type": "Poli", "status": "coming_soon", "openingDate": "2027-01-04" }
  ]
}
```

- Kode dicocokkan tanpa membedakan huruf besar dan kecil, lalu disimpan dalam huruf besar. Kode yang belum ada akan **dibuat**, dan untuk itu wajib menyertakan `name` dan `type`.
- Kolom yang tidak dikirim tidak diubah.
- `type` dan `categories` memakai **nama** yang sudah ada di venue itu (lihat endpoint kategori). Daftar `categories` mengganti seluruh kategori lama. Kategori harus milik tipe lokasinya.
- Bila `hours.weekly` dikirim, seluruh jam mingguan diganti, sehingga hari yang tidak disebut menjadi tutup. Bila `hours.special` dikirim, seluruh tanggal khusus diganti. Keduanya berdiri sendiri, jadi mengirim `weekly` saja tidak menyentuh tanggal khusus.
- Rentang jam ditulis `JJ:MM-JJ:MM` dalam jam dinding venue. Jam tutup yang lebih awal dari jam buka berarti buka lewat tengah malam (`22:00-06:00`), dan jam buka sama dengan jam tutup berarti buka 24 jam (`00:00-00:00`), sama dengan formulir lokasi di Admin.
- Kiriman bersifat semua-atau-tidak-sama-sekali: satu baris salah (422) membatalkan seluruh kiriman, dan `errors` menyebut baris yang salah, misalnya `locations[3].hours.weekly.mon: "8-16" bukan rentang jam JJ:MM-JJ:MM.`
- Jawabannya menyebut hasil tiap lokasi: `created`, `updated`, atau `unchanged`. Mengirim ulang data yang sama aman dilakukan, karena hasilnya `unchanged` dan tidak memicu webhook.

```json
{ "locations": [ { "code": "POLI-ANAK", "id": "…", "action": "updated" } ] }
```

> **Perubahan lokasi dan jam masuk ke draft.** Pengunjung baru melihatnya setelah Admin atau Super Admin mem-publish venue. Ini sengaja, agar data dari sistem lain tetap melewati validasi publish. Untuk mengetahui kapan publish terjadi, pakai webhook `publish`.

### `GET /v1/venues/{venueId}/categories`

Izin yang dibutuhkan: `locations:read`. Hasilnya tipe lokasi beserta kategorinya, dalam bentuk `{"types": [{"type": "Poli", "categories": ["Umum", "Gigi"]}]}`.

### `GET /v1/venues/{venueId}/closures`

Izin yang dibutuhkan: `closures:read`. Hasilnya penutupan yang sedang berjalan dan yang terjadwal.

### `POST /v1/venues/{venueId}/closures`

Izin yang dibutuhkan: `closures:write`. Penutupan **berlaku langsung tanpa publish**, sama dengan penutupan dari menu Penutupan.

```json
{ "locationCode": "RAD-01", "reason": "Perawatan alat", "startsAt": "2026-12-01T08:00:00+07:00", "endsAt": "2026-12-01T15:00:00+07:00" }
```

- Isi salah satu: `locationCode` (menutup semua unit lokasi itu) atau `unitCode` (satu unit). Lokasi yang belum ditautkan ke unit di peta tidak bisa ditutup (422).
- `startsAt` boleh dikosongkan, artinya mulai sekarang. `endsAt` kosong berarti sampai diakhiri. Waktu ditulis dalam format ISO 8601 **dengan zona waktu**.
- Jawabannya `201` dengan `{"closures": [...]}`, berisi satu penutupan per unit.

### `DELETE /v1/venues/{venueId}/closures/{closureId}`

Izin yang dibutuhkan: `closures:write`. Penutupan yang sedang berjalan diakhiri saat itu juga, sedangkan penutupan yang belum mulai dibatalkan. Penutupan yang sudah berakhir dijawab 409.

## Deep link Visitor

Setiap lokasi di API membawa `visitorPath`. Gabungkan dengan URL publik Visitor (Admin → Pengaturan → Sistem → URL publik Visitor):

```
https://peta.rs.id/v/{venueId}?loc={locationId}
```

Parameter yang dikenali Visitor (FR-VST-12):

| Parameter | Isi |
| --- | --- |
| `loc` | id lokasi yang dibuka |
| `b`, `f` | id gedung dan lantai yang ditampilkan |
| `from`, `to` | ujung rute: id lokasi, atau `lng,lat,floorId` |
| `o` | kode publik QR titik asal (12 heksadesimal) |
| `ip` | kode Info Point sebagai titik asal |
| `a11y` | `1` untuk rute aksesibel (tanpa tangga dan eskalator) |
| `lang` | `id` atau `en` |
| `ev` | id event atau promo |

Contoh rute dari lobi ke Radiologi untuk pengguna kursi roda, dalam bahasa Inggris:

```
https://peta.rs.id/v/{venueId}?from={idLobi}&to={idRadiologi}&a11y=1&lang=en
```

Nilai yang tidak sah diabaikan satu per satu, dan Visitor tetap terbuka.

## Webhook

Webhook didaftarkan oleh Super Admin di Admin → **Integrasi** → **Webhook**. Untuk setiap webhook, isi:

- nama dan alamat penerima (`https://`, atau `http://` untuk jaringan internal);
- peristiwa yang ingin diterima: **Publish**, **Penutupan**, **Lokasi**;
- venue: semua, atau beberapa saja.

Saat webhook dibuat, **rahasia penandatangan** (`whsec_…`) tampil sekali. Rahasia bisa diganti kapan saja lewat menu baris → **Ganti rahasia**, dan rahasia lama langsung tidak berlaku. **Kirim uji** mengirim peristiwa `ping`.

### Peristiwa

| `type` | Kapan | `data` |
| --- | --- | --- |
| `publish.completed` | Venue dipublish | `version`, `origin`, `publishedAt`, `notes` |
| `publish.rollback` | Rollback ke versi lama | `version`, `sourceVersion`, … |
| `closure.created` / `closure.updated` / `closure.deleted` | Penutupan dibuat, diubah, diakhiri, atau dihapus, baik dari Admin maupun dari API | `closure`: `id`, `reason`, `startsAt`, `endsAt`, `unitCode`, `locationCodes` |
| `location.changed` | Lokasi, jam, kategori, atau tautan unit berubah (draft) | `source` (`admin` atau `api`), `count`, `locations`: `id`, `code`, `name`, `status`, `action` (`insert`, `update`, atau `delete`), serta `truncated` |
| `ping` | Tombol Kirim uji | `message` |

Semua perubahan lokasi dalam satu transaksi, misalnya satu impor CSV, satu edit massal, atau satu panggilan upsert API, **digabung menjadi satu** `location.changed`. Isinya paling banyak 1.000 lokasi. Bila lebih dari itu, `truncated` bernilai `true`, dan penerima sebaiknya membaca ulang lewat API.

Bentuk isi:

```json
{
  "id": "1d7c…",
  "type": "closure.created",
  "createdAt": "2026-11-22T12:25:31.512+00:00",
  "venueId": "…",
  "data": { "closure": { "id": "…", "reason": "Perawatan alat", "startsAt": "…", "endsAt": null, "target": "unit", "unitCode": "R-01", "locationCodes": ["RAD-01"] } }
}
```

### Memeriksa tanda tangan

Setiap kiriman membawa header [Standard Webhooks](https://www.standardwebhooks.com/):

| Header | Isi |
| --- | --- |
| `webhook-id` | id pengiriman. Nilainya sama pada percobaan ulang, jadi bisa dipakai untuk menolak duplikat |
| `webhook-timestamp` | waktu kirim (detik Unix) |
| `webhook-signature` | `v1,` diikuti base64(HMAC-SHA256(kunci, `{webhook-id}.{webhook-timestamp}.{badan mentah}`)) |

Kunci HMAC adalah hasil base64-decode rahasia setelah awalan `whsec_` dibuang. Hitung tanda tangan dari **badan mentah** sebelum di-parse sebagai JSON, lalu tolak kiriman yang `webhook-timestamp`-nya lebih dari 5 menit dari jam server penerima.

Node.js:

```js
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(secret, headers, rawBody) {
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = `v1,${createHmac('sha256', key)
    .update(`${headers['webhook-id']}.${headers['webhook-timestamp']}.${rawBody}`)
    .digest('base64')}`;
  const age = Math.abs(Date.now() / 1000 - Number(headers['webhook-timestamp']));
  return (
    age < 300 &&
    headers['webhook-signature'].split(' ').some(
      (sig) => sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected)),
    )
  );
}
```

PHP:

```php
$key = base64_decode(substr($secret, 6));
$expected = 'v1,' . base64_encode(hash_hmac('sha256', "$id.$timestamp.$rawBody", $key, true));
$valid = hash_equals($expected, $_SERVER['HTTP_WEBHOOK_SIGNATURE']) && abs(time() - (int) $timestamp) < 300;
```

Pustaka resmi Standard Webhooks (JavaScript, Python, PHP, Go, Java, C#, Ruby) juga bisa dipakai langsung dengan rahasia `whsec_…`.

### Balasan, percobaan ulang, dan log

- Balas **2xx dalam 10 detik**. Kerjakan proses yang lama di belakang, setelah membalas.
- Balasan selain 2xx, batas waktu, atau gagal terhubung akan dicoba ulang setelah **1 menit, 5 menit, 30 menit, 2 jam, dan 6 jam**. Setelah 6 percobaan, pengiriman ditandai **Gagal**.
- Pengalihan (3xx) tidak diikuti dan dihitung gagal.
- Setiap pengiriman, beserta status HTTP, pesan galat, jumlah percobaan, dan jadwal percobaan berikutnya, tampil di Admin → Integrasi → **Log pengiriman**. Dari sana Super Admin bisa menekan **Kirim ulang**.
- Log disimpan 30 hari untuk pengiriman yang berhasil dan 90 hari untuk yang gagal.
- Webhook yang dinonaktifkan tidak menerima peristiwa baru, dan antreannya ditahan sampai webhook diaktifkan lagi.

## Catatan untuk instalasi on-premise

- Edge Function `api` dan `webhook-dispatch` ikut dalam paket instalasi. Keduanya tidak memakai JWT Supabase: `api` memeriksa kunci API sendiri, sedangkan `webhook-dispatch` hanya bisa dipanggil database dengan rahasia Vault `webhook_dispatch_secret`.
- Penerima webhook harus bisa dijangkau dari server PanduArah. Untuk penerima di jaringan internal rumah sakit, alamat `http://` diperbolehkan.
- Database membangunkan pengirim lewat `pg_net` ke `functions_url` (tabel `app.server_settings`), dan pg_cron memeriksa antrean setiap menit.
