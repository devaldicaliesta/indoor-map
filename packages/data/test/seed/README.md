# Data demo lokal (`pnpm db:seed-demo`)

Mengisi Supabase lokal dengan data contoh yang kaya untuk demo, rekaman layar, video, dan
motion graphic. Bukan data produksi: hanya untuk pengembangan dan materi pemasaran.

```sh
supabase start
pnpm db:reset          # opsional: mulai dari database kosong (+ Super Admin admin@local.test)
pnpm db:seed-demo      # ±20 detik; aman diulang (venue dan akun demo dibuat ulang)
```

## Isi

| Venue | Jenis | Gedung · lantai | Lokasi | Ciri |
| --- | --- | --- | --- | --- |
| Mal Demo Sentosa | pusat perbelanjaan | 1 · 3 | 195 | denah T: atrium bundar + void, sayap barat/timur ke toko jangkar, sayap utara ke lobi; 4 eskalator di cincin atrium |
| RS Demo Harapan | rumah sakit | 1 · 4 | 154 | blok bercourtyard (taman tengah), sayap IGD dengan pintu ambulans, kamar operasi di L1, lift di sudut |
| Kampus Demo Cendekia | kampus | 2 · 5 | 88 | Area Luar (jalan, taman, parkir), dua gedung |
| Menara Demo Sinergi | perkantoran | 1 · 6 | 98 | tower berinti tengah (lift, tangga, toilet), koridor keliling, suite sudut berbentuk L |
| Bandara Demo Nusantara | bandara | 2 · 5 | 136 | gerbang domestik/internasional, check-in, lounge, bagasi |
| Kawasan Demo Industri Prima | pabrik | 3 · 6 | 94 | lini produksi, gudang, kantor, APAR dan pintu darurat |
| Konser Demo Gemilang | event (stadion) | 1 · 2 | 96 | stadion oval: panggung T + runway, Moshpit, Festival A/B/C, VIP, area disabilitas, menara FOH, tribun bawah/atas per sektor dengan vomitory, booth kuliner dan merchandise di concourse, 4 gerbang, parkir |

Denah dibuat `packages/domain/test/fixtures/demo-venues/`. Bentuk bebas (koridor lurus, siku,
melengkung, atau cincin dengan unit mengikuti lengkungannya) disusun `freeform.ts` (`corridorRun`).

URL publik Visitor di Pengaturan → Sistem diisi `http://localhost:5174` bila masih kosong, agar
QR titik asal, "Coba", dan preview draft bisa dipakai.

Setiap venue juga mendapat:
- **logo dan warna merek** (`logos/*.png`, dibuat `node scripts/demo-logos.mjs`): tampil di
  tabel Venue Admin, header Visitor, dan Info Point;
- **riwayat publish** 8 versi bercatatan, termasuk satu rollback;
- **penutupan** sedang berlaku, terjadwal, dan selesai (unit dan lift/eskalator/tangga);
- titik asal QR, Info Point, alias pencarian, jam operasional, dan status lokasi beragam.

Akun demo (password sama dengan akun seed lokal, `SEED_ADMIN_PASSWORD` di `.env.local`):

| Nama | Email | Role | Status |
| --- | --- | --- | --- |
| Rina Wijayanti | rina.wijayanti@panduarah.example | Admin | aktif |
| Hendra Gunawan | hendra.gunawan@panduarah.example | Editor (sebelumnya Admin) | aktif |
| Budi Santoso | budi.santoso@panduarah.example | Editor | aktif |
| Siti Nurhaliza Putri | siti.putri@panduarah.example | Editor | aktif |
| Andi Pratama | andi.pratama@panduarah.example | Operator | aktif |
| Dewi Lestari | dewi.lestari@panduarah.example | Operator | terkunci 8 jam |
| Yusuf Hidayat | yusuf.hidayat@panduarah.example | Viewer | aktif |
| Maya Anggraini | maya.anggraini@panduarah.example | Viewer | nonaktif |

Peristiwanya (masuk, gagal masuk, role diubah, dinonaktifkan, publish, rollback) mengisi Log
audit. Domain `panduarah.example` adalah domain contoh (RFC 2606), jadi email tidak pernah
terkirim ke luar.

Semua nama orang, perusahaan, dan gerai fiktif.
