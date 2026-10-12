# 05 · Desain UI

Tujuan: produk terlihat seperti alat wayfinding profesional, bukan template dashboard buatan AI. Setiap task UI wajib mengikuti dokumen ini. Jika ragu, pilih yang lebih sederhana dan lebih kontras.

## 1. Arah visual

**Bahasa papan penunjuk arah (signage)** bandara dan rumah sakit: kontras tinggi, piktogram jelas, hierarki tegas, sedikit dekorasi. Peta adalah pusat perhatian; UI di sekitarnya tenang dan padat informasi.

Tiga kata kunci untuk menilai setiap layar: **terbaca, tenang, presisi.**

## 2. Acuan tampilan: Mappedin

Mappedin adalah acuan produk terdekat. Ambil **pola tata letak dan alur interaksinya**, bukan merek, warna, ilustrasi, ikon, atau teksnya.

| Halaman acuan | Yang dipelajari |
| --- | --- |
| [Demo Mappedin Web](https://www.mappedin.com/demos/) | Tata letak Visitor desktop dan HP, alur cari → profil → rute, pemilih lantai, tampilan rute multi-lantai |
| [Wayfinding](https://www.mappedin.com/wayfinding/) | Instruksi langkah demi langkah, rute aksesibel, QR dari layar ke HP |
| [Directory](https://www.mappedin.com/directory/) | Layar sentuh (Info Point): peta + panel bawah, kategori besar, profil ringkas |
| [Editor / Maker](https://www.mappedin.com/editor/) | Editor peta: kanvas di tengah, alat di kiri, properti di kanan |
| [Developer Showcase](https://developer.mappedin.com/showcase) | Variasi gaya peta 2D/3D, label, penanda |

### Pola yang diadopsi

**Visitor, desktop**
- Panel kiri tetap (±380 px): kolom cari, chip kategori, daftar hasil atau profil atau rute. Peta memenuhi sisa layar.
- Pemilih lantai vertikal di tepi kanan peta; kontrol zoom dan tombol 2D/3D di pojok kanan bawah.

**Visitor, HP**
- Peta penuh layar, kolom cari mengambang di atas.
- *Bottom sheet* tiga tinggi: intip (±96 px), setengah, penuh. Isi sheet sama dengan panel kiri desktop.

**Profil lokasi**
- Urutan: nama, tipe · kategori, gedung · lantai · kode unit, status buka/tutup, tombol utama **Rute ke sini**, lalu detail lainnya.

**Rute**
- Dua kolom Dari/Ke dengan tombol tukar, sakelar **Rute aksesibel**, ringkasan jarak.
- Daftar langkah dengan ikon aksi; langkah aktif disorot dan peta mengikuti segmennya.
- Perpindahan lantai ditandai chip ("Naik lift ke L3") dan peta berpindah lantai otomatis.

**Peta**
- 3D miring ±50° dengan ruang diekstrusi rendah; label berupa ikon + nama di atas ruang.
- Hanya lantai aktif yang digambar; lantai lain disembunyikan (lantai bertumpuk di F2).

**Info Point (directory)**
- Orientasi potret: peta di atas (±60%), panel bawah dengan kolom cari besar, grid kategori, keyboard di layar.
- Penanda "Anda di sini" paling menonjol di layar; peta diputar sesuai arah hadap perangkat.
- Hasil rute menampilkan QR "Lanjutkan di HP".

**Editor (Admin)**
- Kanvas peta di tengah, toolbar alat vertikal di kiri, panel daftar fitur di kiri, panel properti kontekstual di kanan, pemilih gedung/lantai di atas, status draft dan tombol publish di kanan atas.

### Yang tidak ditiru
- Warna merek, logo, ilustrasi, font, dan teks pemasaran Mappedin. Pengecualian: landing page vendor memakai Figtree (font open source OFL, juga dipakai Mappedin) atas keputusan pemilik 2026-10-12; Admin, Visitor, dan Info Point tidak.
- Iklan layar penuh dan konten promosi di layar sentuh (di luar lingkup).
- Blue dot dan fitur positioning.

## 3. Token desain

Didefinisikan sebagai CSS variables di `packages/ui/src/styles/tokens.css` dan dipetakan ke tema shadcn/Tailwind. Tidak ada warna hex di komponen; semua lewat token.

### Warna antarmuka

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| `--ink` | `#111418` | Teks utama, ikon |
| `--ink-muted` | `#545B64` | Teks sekunder |
| `--line` | `#D5D9DE` | Garis pemisah, border input |
| `--surface` | `#FFFFFF` | Panel, kartu, sheet |
| `--canvas` | `#F2F3EF` | Latar aplikasi dan latar peta |
| `--signal` | `#FFC20E` | Aksi utama, sorotan "Anda di sini", fokus (teks di atasnya selalu `--ink`) |
| `--signal-soft` | `#FFE9A8` | Latar seleksi, hover aksi utama |
| `--route` | `#1463FF` | Garis rute dan penanda tujuan |
| `--danger` | `#C8321E` | Penutupan, error, hapus |
| `--ok` | `#12805C` | Buka sekarang, validasi lolos |
| `--warn` | `#B26A00` | Peringatan validasi, segera buka |

Warna `--signal` dan `--route` dapat ditimpa branding venue (FR-VIS-07, R4), tetapi kontras teks di atasnya tetap harus lolos WCAG AA; jika tidak lolos, sistem memakai `--ink` atau putih otomatis.

### Warna peta (default, dapat diubah per venue lewat FR-VIS-03)

| Jenis fitur | Isi | Garis | Tinggi 3D default |
| --- | --- | --- | --- |
| `unit` | `#FFFFFF` | `#BFC5CC` | 4 m |
| `unit` terpilih | `#FFE9A8` | `#111418` | 4 m |
| `unit` kosong | `#F7F7F4` | `#D5D9DE` putus-putus | 4 m |
| `corridor` | `#ECEEEA` | – | 0 |
| `wall` | – | `#8A929B` 2 px | 5 m |
| `non_walkable` | `#DADDD7` | – | 0 |
| `outdoor_area` (jalan/trotoar) | `#E6E3DA` | – | 0 |
| `outdoor_area` (taman) | `#D5E8C8` | – | 0 |
| `elevator`, `escalator`, `stairs` | `#E3E7EE` | `#8A929B` | 4 m |
| Penutupan | pola arsir `#C8321E` 40% | `#C8321E` | – |
| Garis rute | – | `--route` 6 px, tepi putih 2 px | – |

### Tipografi

| Pemakaian | Font | Ukuran dasar |
| --- | --- | --- |
| Visitor | Atkinson Hyperlegible | 16 px |
| Info Point | Atkinson Hyperlegible | 20 px |
| Admin | IBM Plex Sans | 14 px |
| Kode unit, koordinat, ID | IBM Plex Mono | 13 px |
| Label peta | Atkinson Hyperlegible, halo putih 1,5 px | 12–14 px sesuai zoom |
| Landing page vendor (`apps/landing`) | Figtree, di-host di app landing | 16 px, judul sampai 64 px |

Skala: 12 · 14 · 16 · 20 · 24 · 32. Berat hanya 400 dan 700. Font di-host sendiri (on-premise), tidak memanggil Google Fonts saat runtime.

### Ruang, bentuk, ikon

- Spasi kelipatan 4 px. Padding panel 16 px (Admin), 20 px (Visitor), 24 px (Info Point).
- Radius: 4 px (input, tombol), 8 px (sheet, kartu). Tidak ada radius besar "bubbly".
- Bayangan hanya untuk elemen mengambang di atas peta: `0 1px 2px rgb(0 0 0 / .12), 0 4px 12px rgb(0 0 0 / .08)`.
- Ikon UI: Lucide, stroke 1,75. Ikon peta (fasilitas/kategori): set piktogram sendiri berbentuk seragam (latar lingkaran, simbol `--ink`), dengan fasilitas keselamatan berlatar merah.
- Target sentuh minimal 44 px (Visitor), 60 px (Info Point).

## 4. Wireframe layar utama

### Admin: Editor peta

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ▣ RS Harapan ▾   Gedung Utama ▾   [B1][GF][L1][L2][Area Luar]    Draft tersimpan│
│                                                    ● 3 Error  [Validasi][Publish]│
├──┬──────────────┬─────────────────────────────────────────────┬───────────────┤
│▢ │ Fitur L1   🔍│                                             │ Unit          │
│⬠ │ ▸ Unit (42)  │                                             │ Kode  L1-023  │
│╱ │ ▸ Fasilitas  │              KANVAS PETA                    │ Luas  84 m²   │
│• │ ▸ Jalur      │        (denah + fitur, 2D saat edit)        │ Status Terisi ▾│
│⤧ │ ▸ Konektor   │                                             │ Tinggi 4 m    │
│⌖ │              │                                             │ Lokasi        │
│  │              │                                  [2D|3D]    │ Radiologi  ↗  │
│  │              │                                  [+][−][⌖]  │ [Hapus fitur] │
├──┴──────────────┴─────────────────────────────────────────────┴───────────────┤
│ Snap: on · 1:250 · -6.1754, 106.8272 · Dikunci oleh Anda                         │
└───────────────────────────────────────────────────────────────────────────────┘
```
Toolbar kiri (atas ke bawah): pilih, poligon, garis, titik, jalur, konektor. Panel properti kanan berubah sesuai jenis fitur terpilih; kosong saat tidak ada seleksi.

### Admin: Halaman data (lokasi, pengguna, titik asal)

```
┌───────────┬───────────────────────────────────────────────────────────────────┐
│ Venue      │ Lokasi                                         [Import] [+ Lokasi] │
│ Editor Peta│ 🔍 Cari nama/kode   Tipe ▾  Kategori ▾  Status ▾  Gedung ▾  Lantai ▾│
│ Lokasi   ● │ ────────────────────────────────────────────────────────────────── │
│ Penutupan  │ Kode    Nama              Tipe     Lantai  Unit     Status         │
│ Titik Asal │ POL-01  Poli Anak         Poli     L1      L1-023   ● Aktif        │
│ Publish    │ LAB-02  Laboratorium      Lab      GF      GF-004   ● Aktif        │
│ Pengaturan │ —       Apotek 2          Apotek   —       ⚠ belum  ○ Segera buka  │
│ Pengguna   │                                                                     │
│ Lisensi    │                                         1–50 dari 212   ‹  ›        │
└───────────┴───────────────────────────────────────────────────────────────────┘
```
Tabel padat (tinggi baris 40 px), tanpa kartu. Kode dalam font mono.

### Visitor: HP

```
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│ 🔍 Cari lokasi…  ID▾ │   │ ← Radiologi          │   │ Dari  ◉ Anda di sini │
│                      │   │                      │   │ Ke    ◎ Radiologi  ⇅ │
│       PETA           │   │       PETA           │   │ ♿ Rute aksesibel ○   │
│  (gedung/lantai      │   │   (unit tersorot)    │   │       PETA + RUTE    │
│   default)       L2  │   │                  L1▣ │   │                  L1▣ │
│                  L1▣ │   │                      │   │ ┌──────────────────┐ │
│                  GF  │   ├──────────────────────┤   │ │ 120 m · 4 langkah│ │
├──────────────────────┤   │ Radiologi            │   │ │ ↑ Lurus 40 m     │ │
│ ▔▔▔                  │   │ Lab · Pemeriksaan    │   │ │ ↱ Belok kanan    │ │
│ [Poli][Lab][Toilet]  │   │ Gedung Utama · L1    │   │ │ ⇧ Lift ke L3  ●  │ │
│ [Musala][ATM][A–Z]   │   │ ● Buka · tutup 20.00 │   │ │ ◎ Tiba           │ │
└──────────────────────┘   │ [   Rute ke sini   ] │   │ └──────────────────┘ │
     Beranda               └──────────────────────┘   └──────────────────────┘
                               Profil lokasi               Rute
```

### Visitor: Desktop

```
┌──────────────────────────┬────────────────────────────────────────────────────┐
│ ▣ RS Harapan         ID ▾│                                                    │
│ 🔍 Cari lokasi…           │                                                    │
│ [Poli][Lab][Toilet][A–Z] │                    PETA                       L3   │
│ ──────────────────────── │                                               L2   │
│ Radiologi                │                                               L1 ▣ │
│ Lab · Gedung Utama · L1  │                                               GF   │
│ ● Buka · tutup 20.00     │                                                    │
│ [    Rute ke sini     ]  │                                        [2D|3D]     │
│ [Bagikan]                │                                        [+][−][⌖]   │
└──────────────────────────┴────────────────────────────────────────────────────┘
```

### Info Point (potret, 1080 × 1920)

```
┌────────────────────────────┐
│ ▣ RS Harapan     ID | EN   │
│                            │
│          PETA              │
│    ◉ ANDA DI SINI          │
│   (diputar sesuai arah     │
│      hadap perangkat)      │
│                        L1▣ │
├────────────────────────────┤
│ 🔍  Mau ke mana?            │
│ ┌──────┐┌──────┐┌──────┐   │
│ │ Poli ││ Lab  ││Apotek│   │
│ └──────┘└──────┘└──────┘   │
│ ┌──────┐┌──────┐┌──────┐   │
│ │Toilet││Musala││ A–Z  │   │
│ └──────┘└──────┘└──────┘   │
│ ── keyboard di layar ──    │
└────────────────────────────┘
```
Hasil rute di Info Point: panel bawah menampilkan langkah-langkah plus QR "Lanjutkan di HP" berukuran minimal 200 px.

### QR titik asal (cetak A6)

```
┌──────────────────────┐
│ ▣ RS Harapan          │
│                       │
│      ┌─────────┐      │
│      │  █▀▀█   │      │
│      │  QR     │      │
│      └─────────┘      │
│ Pindai untuk petunjuk │
│ arah dari titik ini   │
│ Lobi Utama · GF       │
└──────────────────────┘
```

## 5. Larangan (anti AI slop)

Setiap PR UI dicek terhadap daftar ini:

- ✗ Gradien, terutama ungu-biru; glassmorphism; latar blur dekoratif
- ✗ Emoji sebagai ikon di UI produk (wireframe di dokumen ini hanya sketsa)
- ✗ Kartu bertumpuk dengan bayangan tebal untuk data tabular; gunakan tabel
- ✗ Hero section, ilustrasi dekoratif, teks sambutan ("Welcome back! ✨")
- ✗ Radius besar (> 8 px), tombol berbentuk pil untuk aksi utama
- ✗ Warna selain token; lebih dari satu warna aksen per layar
- ✗ Loading spinner di tengah layar untuk data kecil; gunakan skeleton sesuai bentuk konten
- ✗ Teks placeholder palsu ("Lorem ipsum", nama orang fiktif di kode produksi)
- ✗ Animasi dekoratif; gerak hanya untuk transisi kamera peta, sheet, dan perpindahan lantai (≤ 300 ms, hormati `prefers-reduced-motion`)
- ✗ Menu hamburger di Admin desktop

Yang diharapkan:

- ✓ Peta adalah elemen terbesar di setiap layar peta
- ✓ Satu aksi utama per layar, berwarna `--signal`
- ✓ Status dengan titik berwarna + teks, bukan warna saja
- ✓ Angka dan kode rata kanan/mono di tabel
- ✓ Pesan kosong yang menyebut langkah berikutnya ("Belum ada gedung. Tambah gedung pertama.")
- ✓ Pesan error yang menyebut penyebab dan cara memperbaiki

## 6. Aksesibilitas minimum (MVP)

- Kontras teks ≥ 4,5 : 1, elemen UI ≥ 3 : 1.
- Semua aksi bisa dicapai dengan keyboard di Admin dan Visitor desktop; fokus terlihat (outline `--signal` 2 px + `--ink` 1 px).
- Label `aria` untuk kontrol peta (zoom, lantai, 2D/3D).
- Status tidak hanya dibedakan warna.
- Info Point: tidak ada elemen interaktif di atas 1,6 m dari lantai pada orientasi potret (area bawah layar untuk interaksi).

## 7. Cara agen memakai dokumen ini

1. Sebelum membuat komponen baru, cek apakah komponen shadcn yang sudah dikustom di `packages/ui` bisa dipakai.
2. Tata letak mengikuti wireframe di atas; ukuran dan warna mengikuti token.
3. Sertakan screenshot (atau deskripsi jelas jika tidak bisa) di PR untuk setiap perubahan UI.
4. Jika sebuah layar tidak punya wireframe, turunkan dari pola terdekat di bagian 2 dan 4, lalu catat di `PROGRESS.md`.
