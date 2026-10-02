# T-005 · Lapisan data — bukti verifikasi

Spec: `e2e/tests/admin/verify/T-005-data-layer.spec.ts`. Hasil: **lulus 3/3** (2026-10-02).
Test case: TC-SEC-02, TC-SEC-07, TC-SEC-59 (pesan tidak membocorkan SQL), TC-VEN-39, TC-REL-04, NFR-MNT-02.

| Bukti | Isi | Hasil |
| --- | --- | --- |
| [01-unit-data.txt](01-unit-data.txt) | Vitest `packages/data`: 22 berkas, 79 test | Lulus |
| [02-integrasi.txt](02-integrasi.txt) | Test integrasi repository ke Supabase lokal: 43 test | Lulus |
| [03-admin-offline.png](03-admin-offline.png) | Admin saat server tidak terjangkau: "Server tidak terjangkau" + "Muat ulang" | Lulus |
| [04-ringkasan.png](04-ringkasan.png) | 10 pemeriksaan galat nyata per role | Semua lulus |

Galat nyata dari Supabase lokal (bukan tiruan) semuanya menjadi `DataError` berbahasa Indonesia tanpa SQL/nama tabel:
Editor ubah venue (RLS 0 baris) → `forbidden`; Viewer ubah tampilan → `forbidden`; kode gedung ganda → `conflict`
("Kode UJI sudah dipakai gedung lain di venue ini."); venue tidak ada → `not_found`; id rusak → `invalid`; server mati → `network`.
Repository mengembalikan tipe domain; `DataClient` tidak mengekspos klien Supabase mentah.

## Temuan

- [SEDANG] Admin menampilkan kerangka memuat **±24 detik** (13 request) sebelum pesan "Server tidak terjangkau" saat server mati: supabase-js sudah mengulang GET 3 kali (1, 2, 4 s) lalu TanStack Query mengulang lagi 3 kali. **Diperbaiki:** galat `network` tidak diulang lagi di `apps/admin/src/app/query-client.ts`; pesan kini muncul dalam ±10 detik (dijaga test ≤ 12 s). Sisa waktu berasal dari pengulangan bawaan supabase-js.
- [RENDAH] Visitor memuat snapshot lewat `fetch` biasa (tanpa pengulangan supabase-js), jadi pengulangan TanStack Query di Visitor tetap dipertahankan. Dicatat.

Tinjauan: code-reviewer — Setuju; security-reviewer — Setuju (pesan galat aman, OWASP A05/A09, CWE-209).
