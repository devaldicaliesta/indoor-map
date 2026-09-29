# 02 · Indeks Kebutuhan

Semua kebutuhan MVP beserta rilis dan task yang mengerjakannya. Detail tiap kebutuhan ada di task-nya. Kolom "Task" adalah sumber kebenaran untuk pertanyaan "siapa yang mengerjakan FR ini".

Catatan penomoran rilis: di dokumen spesifikasi, R1 mencakup akses admin dan pengaturan sistem. Di playbook ini bagian itu dipisah menjadi **R0 Fondasi** supaya fondasi teknis selesai lebih dulu. Isinya sama.

## Kebutuhan fungsional MVP (102)

### Akses dan pengaturan (6)

| ID | Kebutuhan | Rilis | Task |
| --- | --- | --- | --- |
| FR-AUTH-01 | Login email + password, sesi berakhir saat tidak aktif | R0 | T-008 |
| FR-AUTH-02 | Reset password lewat email | R0 | T-008 |
| FR-AUTH-03 | Super Admin mengelola pengguna dan role | R0 | T-009 |
| FR-AUTH-04 | Otorisasi per role di server (RLS) | R0 | T-009, diverifikasi penuh di T-312 |
| FR-AUTH-05 | Kunci edit per lantai | R3 | T-301 |
| FR-SYS-01 | Pengaturan sistem: URL publik Visitor, SMTP, zona waktu dan bahasa default | R0 | T-010 |

### Struktur venue dan gedung (10)

| ID | Kebutuhan | Rilis | Task |
| --- | --- | --- | --- |
| FR-VEN-01 | Data venue | R1 | T-101 |
| FR-VEN-02 | Tipe venue dan template industri | R3 | T-302 |
| FR-VEN-03 | Multi-venue (dibatasi kuota) | R1 | T-101 |
| FR-VEN-04 | Kelola gedung + lapisan Area Luar otomatis | R1 | T-102 |
| FR-VEN-05 | Kelola lantai | R1 | T-103 |
| FR-VEN-06 | Gedung dan lantai default | R1 | T-103 |
| FR-VEN-07 | Upload denah PNG/JPG/PDF (R1) dan DWG/DXF (R3) | R1, R3 | T-105, T-313 |
| FR-VEN-08 | Georeferensi: 4 sudut, rotasi, skala, ukur jarak | R1 | T-106 |
| FR-VEN-09 | Opasitas denah | R1 | T-106 |
| FR-VEN-10 | Lapisan acuan lantai lain | R1 | T-107 |

### Kartografi (10)

| ID | Kebutuhan | Rilis | Task |
| --- | --- | --- | --- |
| FR-MAP-01 | Jenis fitur, termasuk area luar gedung | R1 | T-109 |
| FR-MAP-02 | Alat gambar poligon, garis, titik | R1 | T-108 |
| FR-MAP-03 | Edit geometri, multi-select | R1 | T-110 |
| FR-MAP-04 | Snapping | R1 | T-110 |
| FR-MAP-05 | Undo/redo ≥ 50 langkah | R1 | T-111 |
| FR-MAP-06 | Atribut unit: kode unik, luas, status | R1 | T-109 |
| FR-MAP-07 | Fasilitas + jenis fasilitas + ikon unggahan | R1 | T-112 |
| FR-MAP-08 | Panel daftar fitur | R1 | T-113 |
| FR-MAP-09 | Validasi geometri | R1 | T-114 |
| FR-MAP-10 | Simpan draft otomatis | R1 | T-108 |

### Tampilan 2D/3D (7)

| ID | Kebutuhan | Rilis | Task |
| --- | --- | --- | --- |
| FR-VIS-01 | Tinggi default per jenis fitur | R1 | T-115 |
| FR-VIS-02 | Override tinggi per fitur | R1 | T-115 |
| FR-VIS-03 | Warna per jenis fitur | R1 | T-115 |
| FR-VIS-04 | Mode default 2D/3D | R1 | T-115 |
| FR-VIS-05 | Kamera awal | R1 | T-115 |
| FR-VIS-06 | Preview 3D di editor | R1 | T-115 |
| FR-VIS-07 | Branding Visitor: logo, warna utama, nama tampilan | R4 | T-410 |

### Jaringan navigasi (11)

| ID | Kebutuhan | Rilis | Task |
| --- | --- | --- | --- |
| FR-NAV-01 | Gambar jalur, node/edge otomatis, jalur Area Luar | R2 | T-205 |
| FR-NAV-02 | Edit graf | R2 | T-205 |
| FR-NAV-03 | Titik masuk unit dan fasilitas | R2 | T-206 |
| FR-NAV-04 | Lift dengan daftar lantai dilayani | R2 | T-202, T-207 |
| FR-NAV-05 | Eskalator dengan arah | R2 | T-202, T-207 |
| FR-NAV-06 | Tangga (dan pintu gedung) | R2 | T-202, T-207 |
| FR-NAV-07 | Flag aksesibel dan rute kursi roda | R2 | T-203, T-207 |
| FR-NAV-08 | Penutupan sementara berjadwal | R2 | T-203, T-211 |
| FR-NAV-09 | Template instruksi ID/EN | R2 | T-204, T-210 |
| FR-NAV-10 | Test route di editor | R2 | T-209 |
| FR-NAV-11 | Tampilan graf | R2 | T-208 |

### Lokasi / POI (10)

| ID | Kebutuhan | Rilis | Task |
| --- | --- | --- | --- |
| FR-LOC-01 | Tipe lokasi | R3 | T-303 |
| FR-LOC-02 | Field kustom per tipe | R3 | T-303 |
| FR-LOC-03 | Data lokasi + kode lokasi opsional | R1 | T-116 |
| FR-LOC-04 | Tautan lokasi ke unit | R1 | T-116 |
| FR-LOC-05 | Status lokasi | R3 | T-304 |
| FR-LOC-06 | Jam operasional | R3 | T-304 |
| FR-LOC-07 | Kategori | R1 | T-116 |
| FR-LOC-08 | Import CSV/Excel | R3 | T-305 |
| FR-LOC-09 | Alias pencarian | R3 | T-306 |
| FR-LOC-10 | Daftar dan filter lokasi | R1 | T-116 |

### Titik asal (4)

| ID | Kebutuhan | Rilis | Task |
| --- | --- | --- | --- |
| FR-DEV-01 | QR titik asal + unduh PNG/PDF | R2 | T-212 |
| FR-DEV-02 | Snap titik asal ke jalur | R2 | T-212 |
| FR-DEV-03 | Registrasi Info Point + URL | R4 | T-407 |
| FR-DEV-04 | Konfigurasi Info Point | R4 | T-407 |

### Kontrol kualitas dan publish (8)

| ID | Kebutuhan | Rilis | Task |
| --- | --- | --- | --- |
| FR-PUB-01 | Draft vs published | R1 (dasar), R3 (lengkap) | T-117, T-310 |
| FR-PUB-02 | Ringkasan perubahan | R3 | T-308 |
| FR-PUB-03 | Validasi Error/Peringatan | R3 | T-307 |
| FR-PUB-04 | Klik temuan menuju fitur | R3 | T-307 |
| FR-PUB-05 | Preview HP dan Info Point | R3 | T-309 |
| FR-PUB-06 | Publish berversi | R3 | T-310 |
| FR-PUB-07 | Riwayat versi | R3 | T-310 |
| FR-PUB-08 | Rollback | R3 | T-310 |

### Lisensi (12)

| ID | Kebutuhan | Rilis | Task |
| --- | --- | --- | --- |
| FR-LIC-01 | Aktivasi online dan manual | R4 | T-402 |
| FR-LIC-02 | Verifikasi tanda tangan lokal | R4 | T-401 |
| FR-LIC-03 | Isi lisensi | R4 | T-401 |
| FR-LIC-04 | Check-in online 24 jam | R4 | T-403 |
| FR-LIC-05 | Halaman status | R4 | T-404 |
| FR-LIC-06 | Penegakan kuota di server | R4 | T-404 |
| FR-LIC-07 | Fitur per paket | R4 | T-405 |
| FR-LIC-08 | Pengingat H-30/H-7/H-1 | R4 | T-406 |
| FR-LIC-09 | Masa tenggang 14 hari dan kedaluwarsa | R4 | T-406 |
| FR-LIC-10 | Perpanjangan dan perubahan paket | R4 | T-406 |
| FR-LIC-11 | Proteksi manipulasi waktu | R4 | T-403 |
| FR-LIC-12 | Pencabutan | R4 | T-403 |

### Visitor (16)

| ID | Kebutuhan | Rilis | Task |
| --- | --- | --- | --- |
| FR-VST-01 | Akses tanpa login | R1 | T-118 |
| FR-VST-02 | Memuat snapshot + cache | R1 | T-117, T-118 |
| FR-VST-03 | Navigasi peta, pemilih gedung/lantai, 2D/3D | R1 | T-118 |
| FR-VST-04 | Pencarian | R1 | T-119 |
| FR-VST-05 | Jelajah kategori dan fasilitas | R1 | T-119 |
| FR-VST-06 | Detail lokasi | R1 | T-119 |
| FR-VST-07 | Titik asal (QR, pilih lokasi, ketuk peta) | R2 | T-214 |
| FR-VST-08 | Hitung rute + rute aksesibel | R2 | T-215 |
| FR-VST-09 | Tampilan rute multi-lantai/gedung | R2 | T-215 |
| FR-VST-10 | Instruksi langkah demi langkah | R2 | T-215 |
| FR-VST-11 | Bahasa ID/EN | R1 | T-120 |
| FR-VST-12 | Bagikan + deep link | R2 | T-213, T-217 |
| FR-VST-13 | Informasi penutupan live | R2 | T-216 |
| FR-VST-14 | Pembaruan versi | R3 | T-311 |
| FR-VST-15 | Pesan layanan tidak aktif | R4 | T-406 |
| FR-VST-19 | Direktori A–Z | R1 | T-119 |

### Info Point (8)

| ID | Kebutuhan | Rilis | Task |
| --- | --- | --- | --- |
| FR-IP-01 | Mode Info Point via URL | R4 | T-408 |
| FR-IP-02 | Titik asal tetap | R4 | T-408 |
| FR-IP-03 | Antarmuka layar sentuh + keyboard virtual | R4 | T-408 |
| FR-IP-04 | QR lanjutkan di HP | R4 | T-409 |
| FR-IP-05 | Idle dan reset | R4 | T-408 |
| FR-IP-06 | Pembaruan otomatis saat idle | R4 | T-409 |
| FR-IP-07 | Tahan gangguan jaringan | R4 | T-409 |
| FR-IP-08 | Paksa 2D | R4 | T-408 |

Jumlah per rilis: R0 5 · R1 37 · R2 19 · R3 17 · R4 24 = **102**. FR-VEN-07 dihitung di R1 (bagian DWG/DXF di R3) dan FR-PUB-01 dihitung di R3 (bagian dasarnya di R1).

## Kebutuhan non-fungsional (22)

| ID | Target | Dipastikan di |
| --- | --- | --- |
| NFR-PERF-01 | Muat awal Visitor ≤ 3 s (4G, 10 lantai, 2.000 fitur); kunjungan ulang ≤ 1,5 s | T-117, T-412 |
| NFR-PERF-02 | Hitung rute ≤ 500 ms di HP kelas menengah | T-201, T-412 |
| NFR-PERF-03 | Editor lancar untuk 1.000 fitur per lantai | T-108, T-412 |
| NFR-PERF-04 | Validasi + publish ≤ 60 s per venue | T-310 |
| NFR-CAP-01 | 200 pengunjung + 20 admin bersamaan per server | T-412 |
| NFR-COMP-01 | Chrome, Edge, Safari, Firefox (dua versi terbaru) | T-412 |
| NFR-COMP-02 | Android 10+, iOS 15+, lebar mulai 360 px | T-118, T-412 |
| NFR-COMP-03 | Admin di layar ≥ 1280 px | T-007 |
| NFR-COMP-04 | Info Point: Windows 10/11, Chrome/Edge, potret dan lanskap, ≥ 1080p | T-408 |
| NFR-SEC-01 | HTTPS untuk semua akses | T-411 |
| NFR-SEC-02 | Password di-hash, minimal 8 karakter, kunci setelah 5 gagal | T-008 |
| NFR-SEC-03 | Setiap aksi diperiksa di server (role + lisensi) | T-009, T-404, semua task |
| NFR-SEC-04 | Validasi tipe file; denah ≤ 50 MB, gambar ≤ 5 MB | T-105 |
| NFR-SEC-05 | Catat login, publish, rollback, perubahan role, perubahan lisensi | T-012 |
| NFR-SEC-06 | Visitor tidak menyimpan data pribadi (UU PDP) | T-011 |
| NFR-REL-01 | Backup harian, retensi 14 hari, bisa dipulihkan | T-411 |
| NFR-REL-02 | Update versi tanpa kehilangan data, backup sebelum migrasi | T-411 |
| NFR-REL-03 | Visitor/Info Point tetap jalan saat server terganggu | T-117, T-409 |
| NFR-USE-01 | Kontras WCAG AA; target sentuh ≥ 44 px (Visitor), ≥ 60 px (Info Point) | T-006, T-408 |
| NFR-MNT-01 | Satu paket deploy untuk lokal dan server klien | T-004, T-411 |
| NFR-MNT-02 | Model data portabel (tidak terkunci Supabase) | T-005 |
| NFR-MNT-03 | GeoJSON, WGS84 | T-004 |

## F2 dan backlog (jangan dikerjakan tanpa keputusan baru)

- **Akses:** hak akses granular (AUTH-06), audit log lengkap (AUTH-07)
- **Venue:** label kustom (VEN-11), pintu masuk + Google Maps (VEN-12), duplikasi lantai (VEN-13), import vektor CAD (VEN-14), deteksi ruang dengan AI (BL)
- **Peta:** landmark (MAP-11), kontrol label (MAP-12), area temporer (MAP-13), model 3D GLB dengan Three.js (MAP-14, BL), export peta cetak (MAP-15)
- **Tampilan:** warna per kategori (VIS-08), lantai bertumpuk (VIS-09)
- **Navigasi:** instruksi landmark (NAV-12), edge satu arah dan berjam buka (NAV-13), bobot preferensi (NAV-14), estimasi waktu (NAV-15), mode evakuasi (NAV-16, BL)
- **Lokasi:** konten multi-bahasa (LOC-11)
- **Titik asal:** pairing perangkat (DEV-05), status Info Point (DEV-06), reload jarak jauh (DEV-07), shell WPF (DEV-08), beacon (DEV-09, BL)
- **Publish:** publish terjadwal (PUB-09)
- **Lisensi:** riwayat lisensi (LIC-13)
- **Visitor:** fasilitas terdekat (VST-16), estimasi waktu (VST-17), konten multi-bahasa (VST-18), lapisan keselamatan (VST-20), mode teks/pembaca layar WCAG 2.2 AA (VST-21), embed (VST-22), rute multi-tujuan (VST-23), minimap (VST-24), peta privat (VST-25)
- **Info Point:** mode aksesibilitas (IP-09), pemantauan perangkat (IP-10)

Struktur data dan kode boleh **tidak menghalangi** fitur-fitur ini, tetapi jangan membangunnya lebih awal.
