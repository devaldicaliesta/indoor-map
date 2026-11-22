# Contoh sinkronisasi jam operasional

Skrip ini mengirim jadwal dari sistem klien (SIMRS, sistem akademik, HR) ke PanduArah lewat API integrasi. Ia membaca CSV atau JSON lalu memanggil `PUT /v1/venues/{venueId}/locations`. Lokasi dicocokkan berdasarkan kode. Panduan lengkap API ada di [`docs/integrasi/api.md`](../../docs/integrasi/api.md).

Yang dibutuhkan: Node.js 20 atau lebih baru. Tidak ada paket tambahan.

## 1. Siapkan kunci

Di Admin → **Integrasi** → **Buat kunci API** (khusus Super Admin):

- Nama: nama sistem, misalnya `SIMRS`.
- Izin: **Ubah lokasi, status, kategori, dan jam**.
- Venue: venue rumah sakit itu saja.

Salin kunci yang tampil. Kunci hanya ditampilkan sekali.

## 2. Format CSV

```csv
kode,hari,jam
POLI-ANAK,senin,08:00-12:00
POLI-ANAK,senin,13:00-16:00
POLI-ANAK,jumat,08:00-11:30
POLI-ANAK,2026-12-24,tutup
RAD-01,sabtu,07:00-14:00
RAD-01,2026-12-31,07:00-12:00
```

- `kode` adalah kode lokasi di PanduArah. Huruf besar dan kecil dianggap sama.
- `hari` diisi `senin` sampai `minggu`, atau tanggal `YYYY-MM-DD` untuk tanggal khusus.
- `jam` diisi `JJ:MM-JJ:MM`, atau `tutup`. Satu baris berisi satu rentang; dua rentang dalam sehari (istirahat siang) ditulis di dua baris.
- Jam mingguan lokasi yang ada di berkas diganti seluruhnya, jadi hari yang tidak disebut berarti tutup.
- Tanggal khusus hanya diganti bila berkas memuat setidaknya satu tanggal untuk lokasi itu. Bila tidak ada, tanggal khusus yang sudah ada tetap.
- Lokasi yang tidak ada di berkas tidak diubah.

Sebagai pengganti CSV, berkas `.json` boleh dipakai dengan isi `{"locations": [...]}` yang sama persis dengan badan permintaan API.

## 3. Jalankan

Periksa hasil olahan berkas tanpa mengirim apa pun:

```sh
node sync.mjs jadwal.csv --dry-run
```

Lalu kirim:

```sh
export PANDUARAH_API_URL=https://panduarah.rs.id/functions/v1/api
export PANDUARAH_API_KEY=pa_...
export PANDUARAH_VENUE_ID=...   # dari GET /v1/venues
node sync.mjs jadwal.csv
```

Contoh keluaran:

```
2 lokasi: 2 diubah, 0 tetap, 0 baru.
Selesai. Perubahan tampil di Visitor setelah venue dipublish dari Admin.
```

Bila ada satu baris yang salah, misalnya kode yang belum ada tanpa nama dan tipe, semua baris dalam permintaan itu ditolak (HTTP 422). Skrip lalu menampilkan daftar kesalahannya dan keluar dengan kode 1.

## 4. Jadwalkan

Dengan cron, setiap hari pukul 05.00:

```cron
0 5 * * * cd /opt/panduarah-sync && PANDUARAH_API_URL=... PANDUARAH_API_KEY=... PANDUARAH_VENUE_ID=... node sync.mjs /data/export/jadwal-poli.csv >> /var/log/panduarah-sync.log 2>&1
```

Di Windows, pakai Task Scheduler dengan perintah yang sama.

Perubahan jam masuk ke draft dan baru terlihat pengunjung setelah Admin mem-publish venue. Bila ingin tahu kapan publish selesai, daftarkan webhook dengan peristiwa **Publish** (lihat dokumen API).
