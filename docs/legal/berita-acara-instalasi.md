# Template berita acara instalasi PanduArah

Template T-602. Diisi saat serah terima instalasi dan menjadi Lampiran IV kontrak berlangganan.
Pemeriksaan mengikuti uji asap di `deploy/README.md`. **[tinjau]** Format akhir disesuaikan
dengan kebutuhan administrasi klien.

---

## Berita Acara Instalasi dan Serah Terima

Nomor: {…} · Kontrak: {nomor kontrak}

Pada {hari, tanggal}, bertempat di {lokasi / jarak jauh}, telah dilakukan instalasi perangkat
lunak PanduArah oleh {Vendor / Klien dengan panduan Vendor}.

### 1. Data instalasi

| Hal | Isi |
| --- | --- |
| Versi aplikasi | {mis. 1.4.0} |
| ID instalasi | {dari `/aktivasi`} |
| ID lisensi dan masa berlaku | {LIC-…}, {tanggal} s.d. {tanggal} |
| Server | {nama host}, {CPU}/{RAM}/{disk}, {sistem operasi} |
| Alamat Admin | https://{…}/admin |
| Alamat Visitor | https://{…} |
| Super Admin pertama | {nama}, {email} (password diserahkan langsung ke pemiliknya, tidak ditulis di sini) |
| EULA | Versi {…} disetujui saat aktivasi pada {tanggal} (tercatat di Log audit "EULA disetujui") |
| Cadangan | Terjadwal {setiap hari pukul …}, disimpan di {lokasi}, masa simpan {14} hari |

### 2. Hasil pemeriksaan

| # | Pemeriksaan | Hasil | Catatan |
| --- | --- | --- | --- |
| 1 | Admin dapat dibuka lewat HTTPS dan Super Admin bisa masuk | ☐ Lulus ☐ Gagal | |
| 2 | Lisensi aktif; halaman Lisensi menampilkan kuota dan fitur sesuai kontrak | ☐ Lulus ☐ Gagal | |
| 3 | Email sistem terkirim (Pengaturan → Sistem → Kirim email uji) | ☐ Lulus ☐ Gagal ☐ Tidak dipakai | |
| 4 | Venue contoh atau venue klien dipublish tanpa galat | ☐ Lulus ☐ Gagal | |
| 5 | Visitor di HP: cari lokasi dan rute dari QR titik asal | ☐ Lulus ☐ Gagal | |
| 6 | Info Point terbuka di perangkat layar dan kembali ke awal saat idle | ☐ Lulus ☐ Gagal ☐ Tidak dipakai | |
| 7 | Cadangan berhasil dibuat dan dipulihkan uji (`deploy/backup.sh`, `deploy/restore.sh`) | ☐ Lulus ☐ Gagal | |
| 8 | Check-in lisensi ke vendor, atau berkas lisensi manual untuk server tanpa internet | ☐ Lulus ☐ Tidak dipakai | |

### 3. Yang diserahkan

- ☐ Akses Super Admin pertama kepada {nama}
- ☐ Paket instalasi versi {…} dan dokumen `deploy/README.md`
- ☐ Kontak dukungan dan SLA (`docs/legal/syarat-layanan.md`)
- ☐ Template kebijakan privasi Visitor (`docs/legal/kebijakan-privasi-visitor.md`)
- ☐ Pelatihan awal: {tanggal, peserta} (bila termasuk kontrak)

### 4. Catatan dan tindak lanjut

{Temuan yang belum selesai, penanggung jawab, dan batas waktunya. Bila ada pemeriksaan "Gagal",
serah terima dapat dinyatakan bersyarat sampai tindak lanjut selesai.}

### 5. Pernyataan

Dengan ditandatanganinya berita acara ini, instalasi dinyatakan
☐ diterima ☐ diterima dengan catatan di §4.

| Pihak Vendor | Pihak Klien |
| --- | --- |
| {nama, jabatan} | {nama, jabatan} |
| tanda tangan | tanda tangan dan stempel |
