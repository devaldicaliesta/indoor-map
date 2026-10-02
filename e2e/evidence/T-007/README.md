# T-007 · Kerangka Admin — bukti E2E

Spec: `e2e/tests/admin/verify/T-007-admin-shell.spec.ts` (data: fixture `variedVenues`, `e2e/support/varied-venues.ts`). Hasil: **lulus 3/3** (24 test, 2026-10-02).
Test case: TC-AUTH-10 (menu per role), TC-AUTH-38 (URL menu terlarang), TC-VEN-06 (data per venue terpisah), TC-REL-12 sebagian (pilihan diingat), NFR-COMP-03 (layar ≥ 1280 px).

Data bervariasi: 6 venue tambahan + Venue Contoh — kampus (3 gedung, basement), perkantoran dengan nama sangat panjang (8 lantai, B2–L5), bandara WITA dengan emoji ✈, pabrik WIT tanpa gedung, pusat belanja dengan aksen "Café Lumière", venue nama 2 huruf; template industri berbeda dan branding terang/gelap/bawaan.

| Gambar | Langkah |
| --- | --- |
| [01-menu-super_admin](01-menu-super_admin.png) … [01-menu-viewer](01-menu-viewer.png) | Menu kelima role sesuai tabel `01-produk.md`; menu baca-saja diberi penanda "baca"; tanpa menu hamburger |
| [02-pemilih-venue](02-pemilih-venue.png) | Pemilih venue berisi 7 venue (nama panjang, emoji, aksen) |
| [03-venue-kampus](03-venue-kampus.png) | Kampus: 3 gedung + Area Luar |
| [04-venue-kantor-nama-panjang](04-venue-kantor-nama-panjang.png) | Pindah venue memperbarui halaman; nama panjang terpotong "…" + tooltip |
| [05-lokasi-pabrik](05-lokasi-pabrik.png) | Pindah venue di halaman Lokasi; keadaan kosong |
| [06-diingat-setelah-muat-ulang](06-diingat-setelah-muat-ulang.png) | Venue terpilih tetap setelah muat ulang |
| [07-layar-sempit](07-layar-sempit.png) | Peringatan "Admin dirancang untuk layar lebar" di 1100 px, hilang di 1440 px |
| [08-sidebar-diciutkan](08-sidebar-diciutkan.png) | Sidebar diciutkan (56 px, ikon saja): menu aktif tetap disorot, tooltip nama menu saat hover |
| [09-sidebar-dilebarkan](09-sidebar-dilebarkan.png) | Dilebarkan lagi lewat keyboard (Enter) ke 240 px |

Juga dicek: membuka URL menu terlarang (`/users`, `/license`, `/venues` untuk Operator) menampilkan pesan tidak berizin.

## Permintaan pemilik: sidebar bisa dibuka-tutup

Tombol "Ciutkan menu" / "Lebarkan menu" di bawah sidebar (`aria-expanded`, bisa dengan keyboard). Saat diciutkan sidebar menjadi deret ikon 56 px: nama menu tetap dibacakan pembaca layar dan muncul sebagai tooltip (termasuk penanda "baca"), menu aktif tetap disorot. Pilihan diingat setelah muat ulang (`localStorage` `indoor-admin.sidebar`). File: `apps/admin/src/app/layout/sidebar.tsx`, `sidebar-store.ts`, `app-layout.tsx`.

## Temuan

- [SEDANG] Saat pertama dibuat, menu aktif tidak disorot dalam mode diciutkan: pembungkus tooltip (Radix Slot) menggabungkan `className` sebagai string, sedangkan `NavLink` memakai `className` fungsi. **Diperbaiki:** status aktif dihitung dengan `useMatch` di `NavItem`; dijaga test.

- [SEDANG] Pemilih venue (dan semua Select) memotong nama panjang di tengah kata tanpa "…" karena `line-clamp-1` tidak berlaku bersama `whitespace-nowrap`. **Diperbaiki:** `packages/ui` Select memakai `truncate` + `min-w-0`; pemilih venue diberi `title` berisi nama lengkap.
- [RENDAH] Halaman Venue selalu menulis "Venue dengan satu gedung tetap memakai struktur ini." walau venue punya 3 gedung. Kalimat penjelas, tidak salah, tetapi kurang relevan. Dicatat.
- [Catatan test] Gambar sempat terambil saat kerangka memuat (Penutupan Operator, layar sempit); spec kini menunggu skeleton hilang sebelum mengambil gambar. Bukan bug aplikasi.

Tinjauan: code-reviewer — Setuju; security-reviewer — Setuju (menu bukan otorisasi; penolakan server diuji di T-004/T-005/T-009a).
