# Dokumen legal

Draf dan template untuk penjualan (T-602) dan kepatuhan **UU No. 27 Tahun 2022 tentang
Pelindungan Data Pribadi** (UU PDP, T-601a). Naskah final **wajib ditinjau konsultan hukum** sebelum dipakai
dengan klien. Repo hanya menyimpan draf dan template. Bagian bertanda **[tinjau]** adalah hal
yang perlu dipastikan konsultan, misalnya rujukan pasal, tenggat, atau aturan pelaksana yang
terbit kemudian.

| Dokumen | Isi | Untuk siapa |
| --- | --- | --- |
| [eula.md](eula.md) | Perjanjian Lisensi Pengguna Akhir on-premise. **Teks ini ditampilkan apa adanya** di `/aktivasi` dan wajib disetujui | Klien (disetujui saat aktivasi) |
| [syarat-layanan.md](syarat-layanan.md) | Syarat layanan berlangganan, SLA dukungan (jam layanan, waktu respons P1–P4, saluran email), ketentuan trial | Klien (Lampiran I kontrak) |
| [template-kontrak-berlangganan.md](template-kontrak-berlangganan.md) | Template kontrak berlangganan | Vendor, klien |
| [berita-acara-instalasi.md](berita-acara-instalasi.md) | Template berita acara instalasi dan serah terima, berisi daftar pemeriksaan | Vendor, klien (Lampiran IV kontrak) |
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

## EULA di aplikasi

- `docs/legal/eula.md` adalah **satu-satunya sumber teks EULA**. Admin mengimpornya saat build
  (`apps/admin/src/features/license/eula-consent.tsx`) dan menampilkannya di `/aktivasi`.
  Format yang didukung: judul `#`/`##`, paragraf, dan daftar bernomor `1.`, tanpa format inline.
- Baris `Versi YYYY-MM-DD` wajib sama dengan `EULA_VERSION` di `packages/domain/src/eula.ts`
  (dijaga test). Saat isi EULA berubah, naikkan keduanya beserta baris persetujuan di
  `supabase/seed.sql`. Aktivasi berikutnya di setiap instalasi akan meminta persetujuan ulang.
- Persetujuan tercatat permanen di tabel `eula_acceptances` (versi, waktu, Super Admin bila
  ada, ID lisensi, pemegang lisensi, ID instalasi) dan di Log audit sebagai "EULA disetujui".
  Log audit mengikuti masa simpannya, tetapi tabel persetujuan tidak.
- **[tinjau]** Untuk konsultan: pasal larangan rekayasa balik terhadap UU Hak Cipta, batas
  tanggung jawab 12 bulan biaya, jaminan, pengadilan yang dipilih, dan apakah persetujuan
  lewat centang memadai sebagai kontrak elektronik (UU ITE dan PP 71/2019).
