# Dokumen legal: kepatuhan UU PDP

Draf dan template untuk kepatuhan **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi**
(UU PDP), dibuat di T-601a. Naskah final **wajib ditinjau konsultan hukum** sebelum dipakai
dengan klien. Repo hanya menyimpan draf dan template. Bagian bertanda **[tinjau]** adalah hal
yang perlu dipastikan konsultan, misalnya rujukan pasal, tenggat, atau aturan pelaksana yang
terbit kemudian.

| Dokumen | Isi | Untuk siapa |
| --- | --- | --- |
| [inventaris-data.md](inventaris-data.md) | Data pribadi yang diproses PanduArah: tujuan, dasar pemrosesan, masa simpan, lokasi, pengendali | Vendor, klien (lampiran DPA), auditor |
| [kebijakan-privasi-visitor.md](kebijakan-privasi-visitor.md) | Template kebijakan privasi Visitor dan Info Point yang diterbitkan **klien** sebagai pengendali data | Klien |
| [kebijakan-privasi-landing.md](kebijakan-privasi-landing.md) | Naskah kebijakan privasi landing page dan trial ter-hosting (pengendali: vendor), sumber teks `/privasi/` | Vendor |
| [prosedur-insiden.md](prosedur-insiden.md) | Prosedur insiden kebocoran data: deteksi, penahanan, pemberitahuan 3 × 24 jam ke klien, subjek data, dan lembaga | Vendor, klien |
| [template-dpa.md](template-dpa.md) | Template perjanjian pemrosesan data (DPA) vendor–klien | Vendor, klien |

## Peran

- **On-premise** (paket klien): aplikasi dan database berjalan di server klien. **Klien adalah
  pengendali data pribadi** (akun Admin stafnya, log audit). Vendor tidak menerima data itu,
  kecuali saat memberi dukungan teknis atas permintaan klien. Pada saat itu vendor bertindak
  sebagai **prosesor**, sehingga DPA diperlukan.
- **Trial ter-hosting dan landing page** (server vendor): **vendor adalah pengendali** data form
  trial, akun trial, dan email.

## Fitur aplikasi yang mendukung hak subjek data

| Hak (UU PDP) | Di aplikasi | Catatan |
| --- | --- | --- |
| Akses dan salinan (Pasal 7) | Admin → Pengguna → ⋯ → **Ekspor data akun (JSON)** | Super Admin saja; tercatat `Data akun diekspor` |
| Perbaikan (Pasal 6) | Nama dan role diubah Super Admin; email lewat akun Auth | |
| Penghapusan (Pasal 8) | Admin → Pengguna → ⋯ → **Hapus akun…** | Permanen; tercatat `Akun dihapus` tanpa nama/email |
| Portabilitas (Pasal 13) | Berkas export JSON berformat versi `panduarah.user-data/1` | |
| Masa simpan terbatas | Pengaturan → Sistem → **Masa simpan log audit** (30–3650 hari, bawaan 365) | Dibersihkan job harian `audit-retention` |
| Pemberitahuan analitik | Menyusul di T-601b bersama analitik anonim (T-591) | |

Permintaan dari pengunjung gedung atau calon klien yang tidak punya akun dijawab manual oleh
pengendalinya (klien atau vendor), dengan inventaris sebagai acuan letak datanya.
