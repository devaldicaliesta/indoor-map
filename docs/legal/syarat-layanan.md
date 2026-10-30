# Syarat layanan berlangganan, SLA dukungan, dan ketentuan trial (draf)

Draf T-602 yang **siap ditinjau konsultan hukum**. Bagian bertanda **[tinjau]** perlu
dipastikan. Paket dan harga belum ditetapkan pemilik (keputusan 2026-10-05), jadi ditulis
sebagai `{…}`. Dokumen ini menjadi lampiran kontrak berlangganan
([template-kontrak-berlangganan.md](template-kontrak-berlangganan.md)) dan melengkapi EULA
([eula.md](eula.md)).

## 1. Layanan yang termasuk langganan

| Layanan | Isi |
| --- | --- |
| Hak pakai | Lisensi on-premise untuk satu instalasi sesuai paket (kuota venue, gedung, lantai, Info Point, fitur) |
| Pembaruan | Versi perbaikan dan versi fitur selama berlangganan, lewat paket image rilis (`deploy/upgrade.sh`) |
| Dukungan | Lewat email, sesuai SLA di §3 |
| Pemeriksaan lisensi | Perpanjangan lisensi otomatis lewat check-in, atau berkas lisensi manual untuk server tanpa internet |

Tidak termasuk, kecuali disepakati terpisah: pemasangan di lokasi, pembuatan peta (digitasi
denah), pelatihan tambahan, kustomisasi, server dan perangkat Info Point, serta jaringan.

## 2. Kewajiban klien

1. Menyediakan server sesuai spesifikasi minimum di `deploy/README.md` beserta sistem operasi,
   jaringan, dan sertifikat HTTPS.
2. Menjalankan cadangan terjadwal (`deploy/backup.sh`) dan menyimpannya di luar server.
3. Memasang pembaruan keamanan dalam 30 hari sejak dirilis. **[tinjau]**
4. Menunjuk satu kontak teknis dan satu kontak pelindungan data pribadi.
5. Memberi akses sementara (akun Admin dan/atau akses server) saat diperlukan untuk dukungan.
   Akses ini diatur DPA ([template-dpa.md](template-dpa.md)).

## 3. SLA dukungan

**Saluran:** email ke **panduarahid@gmail.com** dengan judul
`[PanduArah] {nama instansi} · {ID instalasi} · P{1-4}: {ringkasan}`. Sertakan versi aplikasi,
langkah yang memicu masalah, waktu kejadian, dan tangkapan layar atau log bila ada.

**Jam layanan:** Senin–Jumat 08.00–17.00 WIB, kecuali hari libur nasional. Waktu respons
dihitung dalam jam kerja ini sejak email diterima.

| Tingkat | Contoh | Respons pertama | Target pemulihan |
| --- | --- | --- | --- |
| P1 Kritis | Visitor dan Info Point tidak bisa dibuka sama sekali; Admin tidak bisa dimasuki semua pengguna; dugaan kebocoran data | 4 jam kerja | Solusi sementara dalam 1 hari kerja |
| P2 Tinggi | Fitur utama terganggu (publish gagal, rute salah di banyak lokasi) tetapi masih ada jalan pintas | 1 hari kerja | 3 hari kerja |
| P3 Sedang | Fitur pendukung terganggu, tampilan salah, kinerja menurun | 2 hari kerja | Rilis perbaikan berikutnya |
| P4 Rendah | Pertanyaan pemakaian, permintaan fitur, dokumentasi | 3 hari kerja | Sesuai rencana produk |

Tingkat diusulkan klien dan dapat disesuaikan Vendor bila tidak sesuai contoh, disertai
alasannya. Insiden data pribadi selalu P1 dan mengikuti
[prosedur-insiden.md](prosedur-insiden.md).

**Di luar SLA:**

- Gangguan karena perangkat keras, sistem operasi, jaringan, atau listrik di sisi klien.
- Perubahan pada Perangkat Lunak, database, atau konfigurasi yang tidak dilakukan atau disetujui
  Vendor.
- Versi yang sudah tidak didukung (kebijakan dukungan versi di T-604).
- Lisensi trial.

**Kompensasi:** **[tinjau]** Bila target respons P1 terlewat lebih dari {N} kali dalam satu
bulan, klien berhak atas {perpanjangan masa langganan …}.

## 4. Ketentuan trial

| Hal | Trial on-premise (`/aktivasi` → Mulai trial) | Trial ter-hosting (landing page) |
| --- | --- | --- |
| Lama | 14–30 hari sesuai berkas lisensi trial | 17 hari, tetap |
| Batas data | Kuota trial di berkas lisensi | 1 venue, 4 gedung, 8 lantai, 250 lokasi, 3 Info Point, 2 pengguna, dan seterusnya (`docs/23-trial-hosting.md` §1) |
| Jumlah | Satu per instalasi, email, dan domain kantor | Satu per email dan domain kantor |
| Setelah berakhir | Admin hanya-baca selama masa tenggang. Data tetap ada dan langsung terpakai saat lisensi berbayar dipasang | Terkunci pada hari ke-17 dan dihapus permanen pada hari ke-24 |
| Dukungan | Pertanyaan lewat email tanpa SLA | Sama |
| Pemakaian | Evaluasi, bukan produksi | Evaluasi, bukan produksi |

Trial tunduk pada EULA. Vendor dapat menghentikan trial yang dipakai di luar evaluasi atau
melanggar EULA.

## 5. Biaya, pembayaran, dan perpanjangan

**[tinjau]** Diisi setelah paket dan harga ditetapkan:

- Biaya berlangganan per {tahun} per instalasi sesuai paket: `{…}`.
- Ditagih di muka; jatuh tempo {14} hari sejak faktur.
- Perpanjangan otomatis kecuali diberhentikan tertulis {30} hari sebelum masa berakhir.
- Keterlambatan pembayaran lebih dari {30} hari dapat menyebabkan lisensi tidak diperpanjang;
  masa tenggang 14 hari tetap berlaku.

## 6. Perubahan syarat

Vendor memberi tahu perubahan syarat ini paling lambat 30 hari sebelum berlaku lewat email
kontak klien. Perubahan tidak berlaku surut untuk masa langganan yang sudah dibayar.
