# 24 · F2-K Trial ter-hosting — rincian task

Rincian langkah dan kriteria selesai untuk task di `23-trial-hosting.md §4`. Mengikuti
`docs/templates/task.md`. Task besar dipecah agar tiap PR < 400 baris (`CLAUDE.md`).

T-611 dipecah tiga karena menyentuh RLS seluruh tabel, fungsi RPC, dan UI sekaligus:

| Sub-task | Isi | Status |
| --- | --- | --- |
| T-611a | Isolasi data lewat RLS (tabel + profil) | dikerjakan |
| T-611b | `admin-users` dan menu Admin sadar-venue | menunggu |
| T-611c | Jaga fungsi RPC/`security definer` ber-venue | menunggu |

---

## T-611a · Isolasi ruang kerja per venue di lapisan RLS

- **Untuk:** FR-HT-04, NFR-HT-02 (jalur REST/tabel), NFR-HT-03. **Mendukung:** FR-HT-05 (T-612).
- **Bergantung pada:** –
- **Konteks:** Izin saat ini murni peran global (`app.user_role` → `can_read/can_edit/can_manage`),
  tidak melihat venue. T-611a menambah dimensi venue di RLS tanpa mengubah perilaku on-premise
  (`profiles.all_venues` default `true` → `app.can_access_venue` selalu benar untuk pengguna lama).
  Fungsi RPC `security definer` bypass RLS → dijaga di T-611c, jadi T-611a **belum** menutup jalur RPC.
- **Langkah:**
  1. Migrasi `0039_venue_workspace.sql`: `venue_members(venue_id, user_id)`, `profiles.all_venues`,
     fungsi `app.can_access_venue` + penyelesai parent (`can_access_floor`/`can_access_location`/
     `can_access_location_type`) dan `app.shares_accessible_profile`.
  2. `alter policy` semua tabel ber-venue + parent: read `(select app.can_read()) and app.can_access_*`,
     write `<role> [and floor_writable] and app.can_access_*`. Baca publik anon (closures, publications)
     tak diubah.
  3. `profiles` read dibatasi: pengguna trial hanya dirinya + sesama anggota venue. `venues` insert
     menolak pengguna `all_venues=false` (tak bisa membuat venue baru).
  4. pgTAP `venue_isolation.test.sql`: trial A ditolak baca/tulis venue B di tabel ber-venue;
     pengguna akses-semua tetap melihat semua.
  5. Regenerasi `packages/data/src/database.types.ts` (`pnpm db:types`).
- **File:** `supabase/migrations/20261011003900_0039_venue_workspace.sql`,
  `supabase/tests/venue_isolation.test.sql`, `packages/data/src/database.types.ts`.
- **Selesai jika:**
  - [ ] Seluruh test on-premise tetap hijau tanpa diubah (`permissions_matrix` 720 uji) — NFR-HT-03.
  - [ ] pgTAP `venue_isolation` lulus: trial A tak bisa baca/insert/update/delete data venue B;
        trial tak bisa membuat venue; akses-semua tetap melihat semua.
  - [ ] `pnpm check` hijau.
- **Jangan:** mengubah makna peran global; menghapus/mengganti nama kolom; menambah `hosting_mode`
  atau kuota per-venue (T-612); menjaga fungsi RPC (T-611c); mengubah `admin-users`/menu (T-611b).

## T-611b · `admin-users` dan menu Admin sadar-venue

- **Untuk:** FR-HT-04 (daftar pengguna per venue). **Bergantung pada:** T-611a.
- **Langkah:** Edge Function `admin-users` memfilter dan membatasi undangan ke anggota venue
  pengguna `all_venues=false` (lewat `venue_members`); halaman Pengguna Admin hanya menampilkan
  anggota venue itu (batas jumlah ditegakkan di T-612); sembunyikan menu Sistem/Lisensi/Catatan
  peristiwa saat `all_venues=false` (otorisasi tetap di server).
- **File:** `supabase/functions/admin-users/index.ts`, `apps/admin/src/**` (menu, halaman Pengguna).
- **Selesai jika:** pengguna trial hanya melihat/mengundang anggota venue-nya; menu sistem tak tampil;
  integrasi + E2E. **Jangan:** menyentuh RLS (T-611a) atau kuota (T-612).

## T-611c · Jaga fungsi RPC/`security definer` ber-venue

- **Untuk:** NFR-HT-02 (jalur RPC). **Bergantung pada:** T-611a.
- **Konteks:** Fungsi `security definer` bypass RLS, jadi peran global saja meloloskan trial admin
  memanggilnya untuk venue lain. Tiap fungsi yang menerima venue/floor/location/publication diberi
  guard `if not app.can_access_*(…) then raise insufficient_privilege`.
- **Langkah:** tambah guard di `publish_begin`/`publish_commit`/`publish_abort`, `save_location`,
  `acquire_edit_lock`/`release_edit_lock`/`take_over_edit_lock`, `apply_template`, `import_locations`,
  `set_search_aliases`, `remove_field_definition`, `save_connector`/`delete_connector`, fungsi kuota
  yang menerima venue. Migrasi baru (redefinisi fungsi), pgTAP per fungsi.
- **Selesai jika:** pgTAP membuktikan tiap fungsi menolak venue di luar akses pemanggil; on-premise
  tetap hijau. **Wajib tinjauan `security-reviewer` (§3.7).**
