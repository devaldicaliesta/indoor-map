# T-002 · Scaffold aplikasi Admin dan Visitor — bukti E2E

Spec: `e2e/tests/admin/verify/T-002-scaffold-admin.spec.ts`, `e2e/tests/visitor/verify/T-002-scaffold-visitor.spec.ts`.
Hasil: **lulus 3/3** (`--repeat-each=3`, 2026-10-02). Test case: TC-AUTH-37 (route terlindungi → login), TC-VIS-04 (venue tidak ada), TC-NAV-43 sebagian (id rusak), TC-SEC-59 (tanpa layar galat pengembang).

| Gambar | Langkah |
| --- | --- |
| [01](01-admin-login.png) | Admin :5173 `/login`, judul "Admin · Indoor Map", `lang="id"` |
| [02](02-admin-beranda.png) | `/` tanpa sesi → login; setelah masuk → `/venues` |
| [03](03-admin-404.png) | Alamat tidak dikenal → "Halaman tidak ditemukan" di dalam kerangka Admin |
| [04](04-visitor-beranda.png) | Visitor :5174 `/` — pesan dan arahan langsung terlihat |
| [05](05-visitor-venue.png) | `/v/:venueId` venue terbit — peta tampil |
| [06](06-visitor-venue-tidak-ada.png) | `/v/bukan-uuid` dan UUID acak → "Peta belum tersedia" |
| [07](07-info-point-placeholder.png) | `/ip/IP-LOBI` placeholder (mode Info Point dibuat di T-408) |
| [08](08-visitor-404.png) | Alamat tidak dikenal → halaman 404 Visitor, tombol "Ke beranda" berfungsi |

Juga dicek: tanpa galat JavaScript di halaman, aset contoh Vite (`/vite.svg`) tidak ada.

## Temuan

- [TINGGI] Visitor tanpa halaman 404/galat: alamat salah menampilkan layar bawaan pengembang React Router ("Unexpected Application Error!", bahasa Inggris). **Diperbaiki:** `apps/visitor/src/routes/route-error.tsx` (404 dan galat tak terduga, ID/EN) dipasang sebagai `errorElement` dan route `*`.
- [SEDANG] Di HP, halaman pesan tanpa peta (beranda, "Peta belum tersedia", gagal muat, 404) membuka sheet di posisi intip sehingga arahan dan tombol "Coba lagi"/"Ke beranda" tersembunyi. **Diperbaiki:** sheet halaman tanpa peta dibuka setengah layar (`initialSnap`).
- [RENDAH] Halaman tanpa venue tetap menampilkan kolom cari yang belum berfungsi (bentuk saja, sesuai T-011). Dicatat, tidak diubah.

Tinjauan: code-reviewer — Setuju; security-reviewer — tidak relevan (tanpa auth/data baru).
