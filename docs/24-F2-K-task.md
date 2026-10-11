# 24 · F2-K Trial ter-hosting — rincian task

Rincian langkah dan kriteria selesai untuk task di `23-trial-hosting.md §4`. Mengikuti
`docs/templates/task.md`. Task besar dipecah agar tiap PR < 400 baris (`CLAUDE.md`).

T-611 dipecah tiga karena menyentuh RLS seluruh tabel, fungsi RPC, dan UI sekaligus:

| Sub-task | Isi | Status |
| --- | --- | --- |
| T-611a | Isolasi data lewat RLS (tabel + profil) | review |
| T-611b | Menu Admin sadar-venue | review |
| T-611c | Jaga fungsi RPC/`security definer` ber-venue | review |

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
  6. Migrasi 0042: syarat venue untuk 18 kebijakan `storage.objects` — id venue ada di
     `foldername[1]` untuk bucket `floor-plans` dan `snapshots`, dan di `[2]` untuk
     `public-assets` (`categories`/`facility-types`/`locations`/`venues`). pgTAP
     `venue_storage_isolation`.
- **File:** `supabase/migrations/20261011003900_0039_venue_workspace.sql`,
  `supabase/migrations/20261012004100_0041_venue_rls_initplan.sql`,
  `supabase/tests/venue_isolation.test.sql`, `packages/data/src/database.types.ts`.
- **Catatan performa (migrasi 0041):** menaruh `app.can_access_venue(venue_id)` langsung di
  kebijakan membuatnya SubPlan per baris (tiap panggilan membaca `profiles` + `venue_members`) —
  mengulang masalah yang dihilangkan 0037, dan integrasi `server-tables` TC-TBL-03 (20 halaman
  × 100 baris dari 2.000 lokasi) melewati batas 20 detik. Bentuk yang dipakai sekarang:
  `case when (select app.all_venues_user()) then true else <cek venue> end` — `(select …)` tanpa
  acuan baris menjadi InitPlan (sekali per pernyataan) dan `case` menjamin short-circuit,
  sehingga on-premise tidak membayar apa pun per baris. **Pelajaran:** jangan memanggil fungsi
  ber-argumen kolom langsung di kebijakan RLS pada tabel besar.
- **Selesai jika:**
  - [ ] Seluruh test on-premise tetap hijau tanpa diubah (`permissions_matrix` 720 uji) — NFR-HT-03.
  - [ ] pgTAP `venue_isolation` lulus: trial A tak bisa baca/insert/update/delete data venue B;
        trial tak bisa membuat venue; akses-semua tetap melihat semua.
  - [ ] pgTAP `venue_storage_isolation` lulus: trial A tak bisa membaca atau mengunggah berkas
        venue B di `floor-plans`, `public-assets`, dan `snapshots`.
  - [ ] `pnpm check` hijau.
- **Jangan:** mengubah makna peran global; menghapus/mengganti nama kolom; menambah `hosting_mode`
  atau kuota per-venue (T-612); menjaga fungsi RPC (T-611c); mengubah `admin-users`/menu (T-611b).

## T-611b · Menu Admin sadar-venue

- **Untuk:** FR-HT-04 (bagian UI). **Bergantung pada:** T-611a.
- **Temuan saat dikerjakan (mengubah lingkup):** modul **Lisensi** dan **Pengguna** serta aksi
  `settings.system`, `user.manage`, dan `license.manage` di `permissions.ts` **khusus
  `super_admin`**, sedangkan pengguna trial berperan `admin` (arch §3.2: trial tidak pernah
  Super Admin). Jadi menu sistem, lisensi, dan catatan peristiwa **sudah** tersembunyi untuk
  trial lewat gating peran yang ada — tidak perlu kode baru. Satu-satunya celah khusus
  `all_venues` adalah tombol "Tambah venue", yang server sudah tolak lewat RLS 0039 sehingga
  hanya menuntun pengguna ke galat.
- **Langkah (dikerjakan):**
  1. `Profile.allVenues` ditambahkan di domain dan dipetakan dari kolom `profiles.all_venues`
     (`COLUMNS` + `mapProfileRow`), sehingga klien tahu statusnya lewat `useCurrentProfile`.
  2. Tombol "Tambah venue" disembunyikan saat `all_venues = false`.
- **File:** `packages/domain/src/profile.ts`, `packages/data/src/repositories/profiles.ts`,
  `packages/data/test/repositories.test.ts`, `apps/admin/src/features/venues/venues-page.tsx`.
- **Selesai jika:**
  - [x] Menu Sistem/Lisensi/Catatan tidak tampil untuk pengguna trial (dipenuhi gating peran).
  - [x] Tombol "Tambah venue" tidak tampil saat `all_venues = false`.
  - [x] `pnpm check` hijau; perilaku on-premise tak berubah (`all_venues` default true).
- **Dipindah ke T-612:** kemampuan admin-venue **mengundang** anggota — butuh modul Pengguna
  tampil untuk admin-venue dan perubahan Edge Function `admin-users` (kini `requireSuperAdmin`,
  jadi trial sudah terkunci total). Tidak dikerjakan di sini karena tak terpisahkan dari
  penegakan **batas 2 pengguna**, yang memang milik T-612; mengizinkan undangan tanpa batas di
  layanan gratis justru berisiko.
- **Jangan:** menyentuh RLS (T-611a), fungsi RPC (T-611c), atau kuota/undangan (T-612).

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
