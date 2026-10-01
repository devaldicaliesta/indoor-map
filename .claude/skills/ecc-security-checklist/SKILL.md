---
name: ecc-security-checklist
description: Gunakan saat mengubah autentikasi, policy RLS, fungsi SQL, policy atau bucket Storage, Edge Function, unggahan berkas, isi snapshot publik, atau rahasia/konfigurasi server di repo indoor-map. Berisi daftar periksa keamanan khusus repo ini.
---

# Daftar periksa keamanan indoor-map

- **Otorisasi di server**: tabel baru memakai RLS dengan `app.can_read()`, `app.can_edit()`, atau `app.can_manage()` sesuai `packages/domain/src/permissions.ts`; tombol yang disembunyikan di UI bukan pengaman.
- **Fungsi SQL**: `security invoker` bila RLS cukup; `security definer` hanya bila perlu, dengan `set search_path = ''` dan nama berskema; cabut `execute` dari `public, anon` bila tidak untuk pengunjung.
- **Pesan aturan**: kesalahan aturan proyek dilempar dengan SQLSTATE `IMxxx` dan pesan Bahasa Indonesia yang menyebut penyebabnya.
- **Storage**: bucket publik hanya untuk aset publik; SVG tidak disimpan di bucket publik (ikon SVG dirasterisasi ke PNG di Admin); policy dibatasi folder dan role.
- **Edge Function**: periksa JWT dan role di server, atau tanda tangan webhook untuk Auth Hook; tanpa impor dari registry luar agar jalan on-premise.
- **Rahasia**: password SMTP hanya di Vault; kunci privat lisensi tidak pernah di repo; `.env.local` tidak di-commit.
- **Snapshot publik**: tanpa email, data pribadi, atau pengaturan server.
- **Klien**: tanpa `dangerouslySetInnerHTML` untuk data pengguna; Visitor tanpa cookie dan request pihak ketiga.
- **Bukti**: setiap aturan hak akses baru punya pgTAP per role (Super Admin, Admin, Editor, Operator, Viewer, anon).
