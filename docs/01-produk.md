# 01 · Produk

## Ringkasan

Sistem untuk membangun, mengelola, dan menerbitkan **peta dalam gedung** beserta **navigasi langkah demi langkah**, untuk semua jenis gedung. Klien memasangnya di server sendiri (on-premise) dan membayar langganan; hak pakai dikendalikan file lisensi bertanda tangan digital dari vendor.

Positioning produk mirip Situm dan Mappedin, **tanpa positioning real-time (blue dot)** di versi awal. Titik "Anda di sini" berasal dari QR titik asal, Info Point, atau pilihan manual pengunjung.

## Tiga aplikasi

| Aplikasi | Pengguna | Fungsi | Platform |
| --- | --- | --- | --- |
| Admin | Tim pengelola gedung milik klien (login, dengan role) | Membangun peta, jalur navigasi, lokasi, titik asal, publish, lisensi | Web desktop, layar ≥ 1280 px |
| Visitor | Pengunjung dengan HP sendiri, tanpa login | Mencari lokasi, melihat detail, mengikuti rute | Web/PWA, layar ≥ 360 px |
| Info Point | Pengunjung di lokasi, tanpa login | Mode khusus Visitor: layar penuh, titik asal tetap, reset saat idle | Browser layar penuh di layar sentuh Windows; shell WPF menyusul |

Info Point bersifat opsional. Venue tanpa layar sentuh cukup memakai QR titik asal.

## Istilah (dipakai persis sama di kode)

| Istilah | Nama di kode | Arti |
| --- | --- | --- |
| Klien | – | Organisasi yang berlangganan dan memasang sistem |
| Venue | `venue` | Satu kawasan milik klien: satu rumah sakit, satu kampus, satu bandara |
| Gedung | `building` | Bangunan dalam venue; venue bisa punya banyak gedung |
| Lantai | `floor` | Lantai milik gedung. Setiap venue juga punya satu lapisan **Area Luar** (`floor` dengan `is_outdoor = true`, tanpa gedung) untuk jalan, taman, parkir, dan jalur antar-gedung |
| Denah | `floor_plan` | Gambar/PDF/CAD acuan yang ditempatkan di peta |
| Fitur | `feature` | Semua yang digambar: unit, koridor, dinding, pintu, fasilitas, area |
| Unit | `feature` dengan `kind = 'unit'` | Ruang fisik yang ditempati lokasi; punya kode unit |
| Lokasi / POI | `location` | Tujuan yang dicari pengunjung: poli, ruang kelas, gate, gerai |
| Tipe lokasi | `location_type` | Jenis lokasi beserta field kustomnya |
| Fasilitas | `feature` dengan `kind = 'facility'` | Toilet, musala, ATM, APAR, titik kumpul, dan lain-lain |
| Node / Edge | `nav_node` / `nav_edge` | Graf jalur navigasi |
| Konektor | `connector` | Penghubung antar-lantai atau gedung–Area Luar: lift, eskalator, tangga, pintu gedung |
| Penutupan | `closure` | Elemen yang ditutup sementara; rute menghindarinya tanpa publish |
| Titik asal QR | `origin_point` | Titik "Anda di sini" dengan QR yang ditempel di lokasi |
| Info Point | `info_point` | Layar sentuh tetap dengan titik asal tetap |
| Snapshot | `publication` | Data venue yang sudah dipublish, dalam satu file JSON berversi |
| Pengunjung | – | Pasien, mahasiswa, karyawan, tamu, penumpang, pelanggan |

**Larangan:** istilah industri ("tenant", "toko", "mall", "poli", "kiosk") tidak boleh menjadi nama di kode. Istilah itu hanya muncul di data template dan label yang bisa diubah.

## Role pengguna Admin

| Role | Kode | Hak akses |
| --- | --- | --- |
| Super Admin | `super_admin` | Semua, termasuk pengguna, pengaturan sistem, lisensi |
| Admin | `admin` | Semua data dan peta, publish, rollback |
| Editor | `editor` | Mengedit draft peta, jalur, lokasi, titik asal; menjalankan validasi. Tidak bisa publish/rollback |
| Operator | `operator` | Hanya membuat, memperpanjang, dan mengakhiri penutupan; melihat peta |
| Viewer | `viewer` | Melihat semua menu kecuali Pengguna dan Lisensi, tanpa mengubah apa pun |

Pengunjung (Visitor dan Info Point) tidak login dan hanya bisa membaca data published serta penutupan aktif.

## Keputusan produk yang sudah final

| Topik | Keputusan |
| --- | --- |
| Deploy | On-premise saja. Paket yang sama dipakai di server klien dan laptop developer |
| Koneksi server | Selalu terhubung internet; aktivasi dan check-in lisensi online |
| Bahasa | Visitor/Info Point: Indonesia (default) + Inggris. Admin: Indonesia |
| Format denah | PNG, JPG, PDF, DWG, DXF |
| Masa tenggang lisensi | 14 hari |
| Tampilan | 2D dan 3D dari data yang sama |
| Multi-venue, multi-gedung | Didukung sejak MVP, dibatasi kuota lisensi |

## Di luar lingkup (jangan dibangun)

Event dan promo, iklan, analitik, portal pemilik lokasi, blue dot/beacon, SDK native, integrasi pihak ketiga, Vendor Portal lengkap (hanya alat pembuat lisensi minimal di R4). Semua ini tercatat sebagai F2 atau backlog di `02-kebutuhan.md`.

## Sumber lengkap

Spesifikasi lengkap (FR, proses bisnis, user flow, kriteria penerimaan, diagram) ada di `docs/spec/`, hasil ekspor dokumen "Spesifikasi Kebutuhan Fungsional – Indoor Map & Navigation". Spesifikasi adalah sumber kebenaran untuk perilaku; playbook ini adalah turunannya yang siap dikerjakan. Perbedaan yang disengaja dicatat di `docs/spec/README.md`; perbedaan lain ditanyakan di `PROGRESS.md`, jangan ditebak.
