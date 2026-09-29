# Spesifikasi

Folder ini berisi ekspor lengkap dokumen **"Spesifikasi Kebutuhan Fungsional – Indoor Map & Navigation"**. Ini adalah sumber kebenaran untuk **apa** yang dibangun: perilaku, aturan, dan kriteria penerimaan. Playbook di `docs/00`–`docs/14` menjelaskan **bagaimana dan dalam urutan apa** membangunnya.

| File | Isi | Dipakai saat |
| --- | --- | --- |
| `01-kebutuhan-fungsional.md` | FR Admin (AUTH, SYS, VEN, MAP, VIS, NAV, LOC, DEV, PUB, LIC), aturan lintas modul, keputusan | Task menyebut ID FR Admin |
| `02-visitor-info-point.md` | FR Visitor dan Info Point, user flow pengunjung, kriteria penerimaannya | Task Visitor/Info Point |
| `03-proses-bisnis.md` | 9 proses bisnis (aktor, pemicu, langkah, pengecualian) | Memahami konteks sebuah fitur |
| `04-model-data-konseptual.md` | Entitas, atribut, aturan integritas | Task database |
| `05-user-flow.md` | 16 user flow Admin, struktur menu | Task UI Admin |
| `06-kriteria-penerimaan.md` | Checklist kriteria penerimaan semua FR Admin | Menutup task, menguji rilis |
| `07-non-fungsional-rilis.md` | 22 NFR, rencana rilis, pemetaan FR ke rilis | Perencanaan, pengujian performa |

## Cara agen memakai folder ini

- Jangan membaca seluruh folder. Cari ID FR yang disebut task (misalnya `FR-NAV-05`) di file yang relevan, lalu baca baris itu dan kriteria penerimaannya.
- Kriteria "Selesai jika" di task adalah ringkasan kriteria di sini. Jika ringkasan dan spesifikasi berbeda, **spesifikasi menang**; catat perbedaannya di `PROGRESS.md`.
- Jika spesifikasi dan playbook bertentangan soal perilaku produk, berhenti dan tulis di "Pertanyaan terbuka".

## Perbedaan yang disengaja antara spesifikasi dan playbook

| Topik | Spesifikasi | Playbook | Alasan |
| --- | --- | --- | --- |
| Rilis pertama | R1 mencakup akses admin, pengaturan sistem, dan peta | Dipecah menjadi R0 (fondasi, akses, pengaturan) dan R1 (peta) | Fondasi teknis selesai dan teruji lebih dulu |
| FR-VEN-07 | DWG/DXF bagian dari R1 | PNG/JPG/PDF di R1 (T-105); DWG/DXF di R3 (T-313) | Konversi CAD butuh layanan terpisah dan keputusan lisensi konverter |
| FR-PUB-01 | R3 | Snapshot minimal sejak R1 (T-117), lengkap di R3 (T-310) | Visitor membaca snapshot sejak awal, arsitektur tidak dibongkar di tengah |
| Model data | 28 entitas konseptual | 30 tabel (`docs/04-model-data.md`) | Tabel penghubung (`connector_stops`, `location_categories`) dan tabel teknis (`installation`, `audit_events`) ditambahkan; Template Venue berupa kode, Token Perangkat di F2 |
| Diagram | Gambar di dokumen online | Mermaid di file ini | Ekspor md tidak membawa gambar; isi diagram sama |

## Memperbarui spesifikasi

1. Ekspor ulang setiap tab dokumen spesifikasi ke md.
2. Timpa file di folder ini dengan nama yang sama.
3. Bandingkan dengan `git diff`. Untuk setiap perubahan perilaku, perbarui task terkait di `docs/1x-*.md` dan `docs/02-kebutuhan.md`, lalu catat di `PROGRESS.md` → "Catatan keputusan".

Dokumen online (untuk manusia): https://claude.ai/code/artifact/e4fd6729-2e07-4c68-819d-2354ebe86192
