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
- **Catatan hak akses (migrasi 0043):** loop per golongan di 0039 mengikuti golongan 0001, padahal
  0009 sudah memindahkan `facility_types` ke Admin/Super Admin; akibatnya Editor kembali bisa
  menulis jenis fasilitas. **Pelajaran:** `alter policy` massal harus dicocokkan dengan kebijakan
  yang berlaku (`pg_policies`), bukan dengan migrasi pembuatnya.
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

---

T-612 dipecah tiga dengan pola yang sama:

| Sub-task | Isi | Status |
| --- | --- | --- |
| T-612a | Mode hosting dan kuota per venue | review |
| T-612b | Venue trial terkunci menolak tulis | review |
| T-612c | Undangan anggota oleh admin-venue | review |

## T-612a · Mode hosting dan kuota per venue

- **Untuk:** FR-HT-05, arch §3.4, NFR-HT-03. **Bergantung pada:** T-611a.
- **Konteks:** kuota lisensi (0030, 0038) dihitung global — benar untuk on-premise (satu klien
  per database), salah untuk project ter-hosting (sampai 15 trial per database): trial pertama
  yang memakai 100 lokasi akan memblokir trial lain.
- **Langkah (migrasi 0044):**
  1. `app.hosting_mode()` membaca baris `hosting_mode` di `app.server_settings` (tabel kunci/nilai,
     jadi bukan kolom seperti tertulis di §3.4). Default false.
  2. Skema `hosting` (tak diekspos PostgREST) + `hosting.trials`. `request_id` ditambahkan T-614
     bersama `trial_requests`.
  3. `app.trial_quota()` = batas §1. `app.trial_venue(v)` = mode hosting + baris `trials` aktif.
  4. **Satu pintu cakupan:** `app.quota_scope(v)` mengembalikan `v` hanya untuk venue trial,
     selain itu NULL. Semua jalur (trigger kuota, publish per hari, Storage, cek publish berlebih,
     cakupan pemanggil) lewat sini, sehingga on-premise tetap global — termasuk lisensi yang
     kuotanya dibagi beberapa venue.
  5. `quota_limit/quota_used(kind, venue)`; versi lama tanpa venue tetap ada. `license_usage` dan
     pra-cek unggah/impor memakai cakupan pemanggil (`app.quota_venue()`) tanpa ubah tanda tangan.
  6. Batas 2 pengguna ditegakkan di `venue_members` (hanya keanggotaan yang tahu venue-nya).
  7. Pesan "Batas trial tercapai" juga untuk venue trial walau lisensi server berpaket `hosting`.
- **Urutan wajib untuk T-614:** `hosting.trials` diisi **sebelum** `venue_members`, kalau tidak
  batas 2 pengguna belum berlaku saat anggota pertama ditambahkan.
- **File:** `supabase/migrations/20261012004400_0044_hosting_mode_venue_quota.sql`,
  `supabase/tests/venue_quota.test.sql`.
- **Selesai jika:**
  - [x] pgTAP `venue_quota` (25): tanpa mode hosting tak berubah; dengan mode hosting batas trial
        per venue, pemakaian per venue, venue non-trial memakai lisensi server, batas pengguna dan
        Storage per venue, `license_usage` trial memakai angka venue-nya.
  - [x] Seluruh pgTAP 1129/1129, integrasi 84/84, `pnpm check` hijau.
- **Jangan:** mengunci venue (T-612b); mengubah `admin-users` (T-612c).

## T-612b · Venue trial terkunci menolak tulis

- **Untuk:** FR-HT-09, arch §3.5 ("RLS menolak semua tulis ke venue terkunci"). **Bergantung pada:** T-612a.
- **Langkah (migrasi 0045):**
  1. `app.venue_locked(v)` = mode hosting + `trials.locked_at` terisi. `app.writable_venue_ids()` =
     venue keanggotaan dikurangi yang terkunci; pasangan `writable_venue_keys` dan penyelesai
     parent `can_write_floor/location/location_type`.
  2. Kebijakan tulis (INSERT/UPDATE/DELETE di `public` dan `storage`) **dibaca dari `pg_policies`**
     lalu hanya predikat venue yang ditukar ke versi tulis; cek peran yang berlaku tidak disentuh.
     Baca tetap memakai predikat baca, jadi data masih terlihat sampai dihapus hari ke-24.
  3. Trigger `before insert` pada `publications` dan `edit_locks`: jalur definer (publish, kunci
     edit) ikut ditolak. Berlaku juga bagi service role — membuka kunci = mengosongkan `locked_at`.
  4. `public.trial_status()` (definer, tetap terbaca setelah terkunci) untuk banner dan layar
     "Trial berakhir" di T-615.
- **File:** `supabase/migrations/20261012004500_0045_trial_lock_write.sql`,
  `supabase/tests/venue_trial_lock.test.sql`, `packages/data/src/database.types.ts`.
- **Selesai jika:**
  - [x] pgTAP `venue_trial_lock` (13): tulis/unggah/publish/kunci edit ditolak, baca tetap boleh,
        vendor akses-semua tetap bisa, tanpa mode hosting tak ada kunci, dan tak satu pun kebijakan
        tulis masih memakai predikat baca.
  - [x] Seluruh pgTAP 1142/1142 (termasuk `permissions_matrix` 720), integrasi 84/84, `pnpm check`.
- **Belum:** repositori klien untuk `trial_status` dan tampilannya — T-615.

## T-612c · Undangan anggota oleh admin-venue

- **Untuk:** arch §3.2 ("pengguna trial hanya melihat dan mengundang anggota venue-nya, batas 2
  pengguna"). **Bergantung pada:** T-612a. Dipindah dari T-611b.
- **Langkah:**
  1. Migrasi 0046 `public.user_invite_check(role)` → NULL (Super Admin, tingkat instalasi) atau
     id venue (Admin venue). Menolak `42501` untuk peran lain, Admin venue yang mengundang Super
     Admin, keanggotaan ≠ 1 venue, dan venue terkunci; menolak `IM422` bila batas pengguna penuh.
  2. `admin-users` memanggilnya dengan JWT pemanggil sebelum `auth/v1/invite`, lalu membuat profil
     `all_venues = (venue null)` dan baris `venue_members`. Gagal sesudah undangan → akun dihapus.
  3. Domain `permissions.ts`: `AdminUser` (`role` + `allVenues`), `moduleAccessFor`,
     `visibleModulesFor`, `canInviteUsers`, `invitableRoles`. Shell Admin memakai versi ini.
  4. Halaman Pengguna: mode baca untuk Admin venue (role sebagai teks, tanpa kolom aksi), tombol
     undang dengan pilihan role tanpa Super Admin.
- **File:** `supabase/migrations/20261012004600_0046_user_invite_check.sql`,
  `supabase/tests/user_invite_check.test.sql`, `supabase/functions/admin-users/index.ts`,
  `supabase/functions/_shared/auth.ts`, `packages/domain/src/permissions.ts` (+ test),
  `apps/admin/src/app/{module-route.tsx,layout/sidebar.tsx,layout/app-layout.tsx}`,
  `apps/admin/src/features/users/*`, `packages/data/test/integration/venue-invite.test.ts`.
- **Selesai jika:**
  - [x] pgTAP `user_invite_check` (9) dan integrasi `venue-invite` (4): anggota baru hanya venue
        itu, anggota ketiga ditolak tanpa akun tersisa, Super Admin tak bisa diberikan, daftar
        Pengguna hanya anggota venue.
  - [x] Perilaku on-premise sama: domain diuji identik dengan aturan per role; integrasi
        `users` (Super Admin mengundang, Editor ditolak) tetap lulus.
- **Jangan:** mengubah role/status anggota oleh Admin venue (tidak diminta §3.2; RLS `profiles`
  tetap khusus Super Admin).

---

## T-613 · Slug venue dan demo publik

- **Untuk:** FR-HT-07, §1 demo publik `app.panduarah.my.id/v/demo`. **Bergantung pada:** T-611a.
- **Keputusan bentuk:** slug **tidak** diselesaikan lewat RPC per kunjungan. Visitor sengaja hanya
  membaca berkas Storage (prefetch dari HTML, cache service worker untuk offline, tanpa beban
  database per pengunjung di Supabase Free), jadi setiap publish menulis penunjuk
  `snapshots/slugs/{slug}.json` = `{ "venueId": … }`. Slug baru/berpindah berlaku pada publish
  berikutnya, sama seperti isi peta.
- **Langkah:**
  1. Migrasi 0047: `venues.slug` + `venues_slug_format` + `venues_slug_key`; trigger
     `venues_slug_guard` — hanya pengguna akses-semua atau jalur tanpa pengguna (service role
     provisioning) yang boleh mengisi/mengganti slug.
  2. `_shared/snapshot-files.ts` `writeLatest`: setelah `latest.json`, tulis penunjuk bila venue
     ber-slug (dipakai publish dan license-service).
  3. Domain `venue-slug.ts`: `VenueSlugSchema`, `SlugPointerSchema`, `parseVenueRef`.
  4. Data `snapshots.slugPointerUrl` / `venueIdForSlug` (`not_found` → "Peta belum tersedia").
  5. Visitor: rute `/v/:venue`; slug → penunjuk → tampilan venue biasa; parameter tautan dibaca
     dengan id hasil penunjuk. `index.html` memprefetch penunjuk lalu `latest.json`; aturan
     NetworkFirst service worker mencakup `snapshots/slugs/`.
  6. `db:seed-demo`: slug `demo` (RS Demo Harapan), `demo-mal`, `demo-kampus`, `demo-kantor`,
     `demo-bandara`, `demo-pabrik`, `demo-konser`.
- **Untuk T-614/T-615:** provisioning mengisi slug sebelum publish pertama; penghapusan hari ke-24
  juga menghapus `slugs/{slug}.json`; mengunci cukup menghapus `{venue}/latest.json` (penunjuk
  tetap, Visitor menampilkan "Trial berakhir" setelah T-615).
- **Selesai jika:**
  - [x] pgTAP `venue_slug` (8): bentuk, keunikan, trial tak bisa mengganti slug, vendor dan
        service role bisa.
  - [x] Domain (16) dan data (+4) hijau; E2E `T-613-slug` (2) di build produksi Visitor.
  - [x] `db:seed-demo` menulis `slugs/demo.json` → RS Demo Harapan.
