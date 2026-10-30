# Kebijakan keamanan PanduArah

## Melaporkan celah keamanan

Kirim laporan ke **panduarahid@gmail.com** dengan judul `[KEAMANAN] ringkasan singkat`.
**Jangan** membuka issue publik, pull request, atau diskusi untuk celah yang belum diperbaiki.

Sertakan bila memungkinkan:

- komponen yang terdampak (Admin, Visitor, Info Point, Edge Function, paket instalasi, landing,
  dasbor vendor) dan versinya;
- langkah untuk mereproduksi, bukti konsep, dan dampak yang Anda perkirakan;
- apakah celah ini sudah diketahui pihak lain.

Kami tidak meminta, dan tidak ingin menerima, data pribadi milik pengguna mana pun. Bila data
semacam itu ikut terlihat saat pengujian, berhentilah di sana, laporkan, dan jangan simpan
salinannya.

## Yang kami lakukan

| Langkah | Waktu (hari kerja) |
| --- | --- |
| Konfirmasi laporan diterima | 2 hari |
| Penilaian awal dan tingkat keparahan (CVSS) | 5 hari |
| Perbaikan kritis/tinggi dirilis | Secepatnya, target 30 hari |
| Perbaikan sedang/rendah | Rilis terjadwal berikutnya |

Kami mengabari pelapor sampai perbaikan dirilis. Bila diizinkan, nama pelapor dicantumkan di
catatan rilis. Bila celah menyangkut data pribadi klien, kami mengikuti
[prosedur insiden](docs/legal/prosedur-insiden.md), termasuk pemberitahuan ke klien.

## Pengujian yang diizinkan

Pengujian dengan itikad baik dilakukan hanya terhadap:

- instalasi PanduArah milik Anda sendiri, misalnya hasil `supabase start` dari repo ini atau
  instalasi trial on-premise di server Anda;
- trial ter-hosting milik Anda sendiri, tanpa menyentuh ruang kerja trial lain.

Tidak diizinkan: uji beban atau penolakan layanan terhadap server vendor atau server klien,
rekayasa sosial, akses fisik, dan pengujian terhadap instalasi klien tanpa izin tertulis klien
tersebut. Pengujian yang mengikuti aturan ini tidak akan kami permasalahkan secara hukum.

## Versi yang didukung

Perbaikan keamanan diberikan untuk versi rilis terbaru. Kebijakan dukungan versi lengkap
menyusul di proses rilis (T-604).

## Untuk pengembang

Pemindaian otomatis (dependency, rahasia, image) dan daftar periksa OWASP ASVS ada di
[docs/keamanan/](docs/keamanan/README.md).
