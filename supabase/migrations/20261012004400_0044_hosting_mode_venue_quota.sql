-- T-612a: mode hosting dan kuota dihitung per venue (arch §3.4, FR-HT-05).
--
-- Di instalasi on-premise satu database melayani satu klien, jadi kuota lisensi dihitung
-- global: `app.quota_used('locations')` mencacah SEMUA lokasi. Di project ter-hosting satu
-- database melayani sampai 15 trial, sehingga perhitungan global salah — trial pertama yang
-- memakai 100 lokasi akan memblokir trial lain. T-612a membuat kuota punya cakupan venue.
--
-- Bentuk yang dipakai: fungsi kuota yang sudah ada mendapat sepupu bercakupan venue, dan versi
-- lamanya mendelegasi ke cakupan PEMANGGIL (`app.quota_venue()`).
--   • Trigger  → selalu memakai venue BARIS yang ditulis (tepat, tidak bergantung siapa pemanggil).
--   • Pra-cek dan tampilan (`license_usage`, `license_upload_check`, `license_import_check`)
--     → cakupan pemanggil, sehingga tanda tangan RPC dan kode klien tidak berubah.
--
-- On-premise tidak berubah (NFR-HT-03): setiap jalur mengambil cakupannya lewat
-- `app.quota_scope()`, yang hanya mengembalikan venue bila venue itu memang venue trial
-- ter-hosting. Tanpa `hosting_mode` cakupannya selalu NULL → batas tetap dari berkas lisensi
-- DAN pemakaian tetap dihitung global, termasuk saat beberapa venue berbagi satu kuota paket.
--
-- Lingkup T-612a: batas per venue. Venue terkunci menolak tulis → T-612b. Undangan anggota
-- lewat `admin-users` dan halaman Pengguna → T-612c.

-- ---------------------------------------------------------------------
-- 1. Penanda mode hosting
-- ---------------------------------------------------------------------
-- `app.server_settings` adalah tabel kunci/nilai (0021), jadi mode hosting menjadi satu baris
-- di sana, bukan kolom baru. Installer klien tidak mengisinya → on-premise tetap false.
create function app.hosting_mode() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select s.value = 'true' from app.server_settings s where s.key = 'hosting_mode'),
    false
  )
$$;
revoke execute on function app.hosting_mode() from public;

comment on table app.server_settings is
  'functions_url: alamat Edge Function yang bisa dijangkau dari database, mis. http://kong:8000/functions/v1. Diisi installer. hosting_mode: "true" hanya di project vendor ter-hosting (T-612).';

-- ---------------------------------------------------------------------
-- 2. Skema `hosting`: keadaan trial ter-hosting
-- ---------------------------------------------------------------------
-- Tidak diekspos PostgREST (`config.toml` hanya membuka `public` dan `graphql_public`), jadi
-- pengguna trial tidak punya jalur REST ke sini. Isian form pemohon, blokir, dan staf vendor
-- menyusul di T-614; `request_id` ditambahkan di sana karena tabelnya belum ada.
create schema hosting;
revoke all on schema hosting from public;
grant usage on schema hosting to service_role;

create table hosting.trials (
  venue_id uuid primary key references public.venues (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  reminded_at timestamptz,
  locked_at timestamptz,
  deleted_at timestamptz
);
alter table hosting.trials enable row level security;
revoke all on hosting.trials from public, anon, authenticated;
grant select, insert, update, delete on hosting.trials to service_role;

comment on table hosting.trials is
  'Satu baris per venue trial ter-hosting. Tanpa kebijakan RLS: hanya fungsi security definer dan service role yang menjangkaunya.';

-- ---------------------------------------------------------------------
-- 3. Batas trial ter-hosting (§1) dan pengenal venue trial
-- ---------------------------------------------------------------------
-- Bentuknya sama dengan `quota` di berkas lisensi agar bisa dipakai fungsi yang sama.
create function app.trial_quota() returns jsonb
language sql immutable
as $$
  select jsonb_build_object(
    'venues', 1, 'buildings', 1, 'floors', 3, 'features', 1000,
    'locations', 100, 'originPoints', 10, 'infoPoints', 2, 'users', 2,
    'storageMb', 50, 'maxUploadMb', 5, 'importRows', 100, 'publishPerDay', 10
  )
$$;
revoke execute on function app.trial_quota() from public;

-- Venue yang batasnya diambil dari batas trial, bukan dari lisensi server. Venue demo publik
-- dan venue vendor tidak punya baris `trials` → tetap memakai lisensi server (§3.4).
create function app.trial_venue(p_venue_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select p_venue_id is not null
    and app.hosting_mode()
    and exists (
      select 1 from hosting.trials t
      where t.venue_id = p_venue_id and t.deleted_at is null
    )
$$;
revoke execute on function app.trial_venue(uuid) from public;

-- Satu-satunya pintu masuk ke cakupan venue: NULL kecuali venue itu memang venue trial
-- ter-hosting. Inilah yang menjaga NFR-HT-03 — di on-premise cakupan selalu NULL, sehingga
-- kuota lisensi tetap dihitung untuk seluruh instalasi, bukan per venue.
create function app.quota_scope(p_venue_id uuid) returns uuid
language sql stable security definer
set search_path = ''
as $$ select case when app.trial_venue(p_venue_id) then p_venue_id end $$;
revoke execute on function app.quota_scope(uuid) from public;

-- Cakupan venue milik PEMANGGIL, untuk pra-cek dan tampilan. Pengguna akses-semua (on-premise,
-- vendor) tidak punya cakupan → kuota global seperti sebelumnya. Pengguna trial adalah anggota
-- tepat satu venue (§1: batas 1 venue); keanggotaan ganda sengaja menghasilkan NULL agar tidak
-- menebak venue mana yang dimaksud — penegakan sebenarnya tetap per baris di trigger.
create function app.quota_venue() returns uuid
language sql stable security definer
set search_path = ''
as $$
  select app.quota_scope(case when cardinality(s.ids) = 1 then s.ids[1] end)
  from (
    select case
      when app.all_venues_user() then array[]::uuid[]
      else array(
        select m.venue_id from public.venue_members m
        where m.user_id = app.current_user_id()
        limit 2)
    end as ids
  ) s
$$;
revoke execute on function app.quota_venue() from public;

-- Venue pemilik satu objek Storage, dari posisi id venue di path (lihat 0042).
-- Path tak terduga menghasilkan NULL, bukan galat cast.
create function app.storage_venue(p_bucket text, p_name text) returns uuid
language sql stable
set search_path = ''
as $$
  select case
    when s.part ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then s.part::uuid
  end
  from (
    select case p_bucket
      when 'floor-plans' then (storage.foldername(p_name))[1]
      when 'snapshots' then (storage.foldername(p_name))[1]
      when 'public-assets' then (storage.foldername(p_name))[2]
    end as part
  ) s
$$;
revoke execute on function app.storage_venue(text, text) from public;

-- ---------------------------------------------------------------------
-- 4. Batas dan pemakaian bercakupan venue (p_venue_id NULL = global/lisensi, perilaku lama)
-- ---------------------------------------------------------------------
create function app.quota_limit(p_kind text, p_venue_id uuid) returns integer
language sql stable security definer
set search_path = ''
as $$
  select case
    when app.trial_venue(p_venue_id) then (app.trial_quota()->>p_kind)::integer
    else (select (l.payload->'quota'->>p_kind)::integer from public.licenses l where l.is_current)
  end
$$;
revoke execute on function app.quota_limit(text, uuid) from public;

create function app.quota_used(p_kind text, p_venue_id uuid) returns integer
language sql stable security definer
set search_path = ''
as $$
  select case
    when p_venue_id is null then app.quota_used(p_kind)
    else case p_kind
      when 'venues' then (select count(*) from public.venues v where v.id = p_venue_id)
      when 'buildings' then (select count(*) from public.buildings b where b.venue_id = p_venue_id)
      when 'floors' then (
        select count(*) from public.floors f where f.venue_id = p_venue_id and not f.is_outdoor)
      when 'infoPoints' then (
        select count(*) from public.info_points i where i.venue_id = p_venue_id)
      when 'locations' then (select count(*) from public.locations l where l.venue_id = p_venue_id)
      when 'originPoints' then (
        select count(*) from public.origin_points o where o.venue_id = p_venue_id)
      when 'users' then (
        select count(*) from public.venue_members m
        join public.profiles p on p.user_id = m.user_id
        where m.venue_id = p_venue_id and p.is_active)
      when 'features' then (
        select coalesce(max(n), 0) from (
          select count(*) as n from public.features f
          where f.venue_id = p_venue_id group by f.floor_id
        ) per_floor)
      when 'storageMb' then (
        select ceil(coalesce(sum((o.metadata->>'size')::bigint), 0) / 1048576.0)
        from storage.objects o
        where app.storage_venue(o.bucket_id, o.name) = p_venue_id)
      when 'publishPerDay' then (
        select count(*)
        from public.publications p
        join public.venues v on v.id = p.venue_id
        where p.venue_id = p_venue_id
          and (p.published_at at time zone v.timezone)::date
              = (now() at time zone v.timezone)::date)
    end
  end::integer
$$;
revoke execute on function app.quota_used(text, uuid) from public;

-- Versi tanpa venue kini bercakupan pemanggil: `license_usage`, `license_upload_check`, dan
-- `license_import_check` ikut benar untuk pengguna trial tanpa perubahan tanda tangan RPC.
create or replace function app.quota_limit(p_kind text) returns integer
language sql stable security definer
set search_path = ''
as $$ select app.quota_limit(p_kind, app.quota_venue()) $$;

-- ---------------------------------------------------------------------
-- 5. Pesan penolakan: "Batas trial tercapai" juga untuk trial ter-hosting
-- ---------------------------------------------------------------------
-- Di project ter-hosting lisensi servernya berpaket `hosting`, bukan `trial`, sehingga
-- `app.license_is_trial()` saja akan salah menyebut "Kuota paket tercapai" (FR-HT-05).
create function app.quota_message(p_kind text, p_used bigint, p_limit bigint, p_trial boolean)
returns text
language sql immutable
set search_path = ''
as $$
  select format(
    '%s: %s %s/%s. %s %s.',
    case when p_trial then 'Batas trial tercapai' else 'Kuota paket tercapai' end,
    case p_kind
      when 'venues' then 'venue'
      when 'buildings' then 'gedung'
      when 'floors' then 'lantai'
      when 'infoPoints' then 'Info Point'
      when 'locations' then 'lokasi'
      when 'originPoints' then 'titik asal'
      when 'users' then 'pengguna aktif'
      when 'features' then 'fitur peta di lantai ini'
      when 'storageMb' then 'Storage (MB)'
      when 'maxUploadMb' then 'ukuran berkas (MB)'
      when 'importRows' then 'baris impor'
      when 'publishPerDay' then 'publish hari ini'
      else p_kind
    end,
    p_used,
    p_limit,
    case p_kind
      when 'publishPerDay' then 'Coba lagi besok atau'
      when 'maxUploadMb' then 'Perkecil berkas atau'
      when 'importRows' then 'Bagi impor menjadi beberapa bagian atau'
      else 'Hapus yang tidak dipakai atau'
    end,
    case when p_trial then 'pasang lisensi berbayar' else 'tingkatkan paket' end
  )
$$;
revoke execute on function app.quota_message(text, bigint, bigint, boolean) from public;

create or replace function app.quota_message(p_kind text, p_used bigint, p_limit bigint)
returns text
language sql stable security definer
set search_path = ''
as $$ select app.quota_message(p_kind, p_used, p_limit, app.license_is_trial()) $$;

-- ---------------------------------------------------------------------
-- 6. Trigger kuota memakai venue baris yang ditulis
-- ---------------------------------------------------------------------
-- `venues` dan `profiles` tidak punya kolom `venue_id` → cakupannya NULL, jadi keduanya tetap
-- memakai kuota lisensi server, sesuai §3.4 "venue demo dan venue vendor memakai lisensi
-- server". Acuan kolom pada `new` hanya dieksekusi untuk tabel yang memilikinya (seperti
-- `new.is_outdoor` sejak 0038), sehingga tabel baru tanpa `venue_id` harus didaftarkan di sini.
-- Venue baris tetap disaring `app.quota_scope`: venue biasa dihitung global seperti sebelumnya.
create or replace function app.enforce_quota() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_kind text := tg_argv[0];
  v_venue uuid;
  v_limit integer;
  v_used integer;
begin
  if tg_table_name not in ('venues', 'profiles') then
    v_venue := app.quota_scope(new.venue_id);
  end if;
  -- Bersarang: kolom is_outdoor dan is_active hanya ada di tabelnya masing-masing.
  if v_kind = 'floors' then
    if new.is_outdoor then
      return new;
    end if;
  elsif v_kind = 'users' and tg_table_name = 'profiles' then
    -- Hanya pengguna aktif yang dihitung; mengaktifkan kembali juga diperiksa.
    if not new.is_active then
      return new;
    end if;
    if tg_op = 'UPDATE' then
      if old.is_active then
        return new;
      end if;
    end if;
  end if;
  v_limit := app.quota_limit(v_kind, v_venue);
  if v_limit is null then
    return new;
  end if;
  -- Dua penambahan bersamaan tidak boleh sama-sama lolos di batas kuota. Kuncinya ikut
  -- bercakupan venue agar trial satu venue tidak saling menunggu dengan trial venue lain.
  if v_kind = 'features' then
    perform pg_advisory_xact_lock(hashtext('quota:features:' || new.floor_id::text));
    select count(*) into v_used from public.features f where f.floor_id = new.floor_id;
  else
    perform pg_advisory_xact_lock(
      hashtext('quota:' || v_kind || ':' || coalesce(v_venue::text, '')));
    v_used := app.quota_used(v_kind, v_venue);
  end if;
  if v_used >= v_limit then
    raise exception '%',
      app.quota_message(v_kind, v_used, v_limit,
        app.trial_venue(v_venue) or app.license_is_trial())
      using errcode = 'IM422';
  end if;
  return new;
end
$$;

-- Batas 2 pengguna per venue trial ditegakkan pada keanggotaan venue, bukan pada `profiles`:
-- hanya keanggotaan yang tahu venue mana. Kuota `users` dari lisensi server tetap diperiksa
-- trigger `profiles_quota` yang ada, jadi keduanya berlaku di project ter-hosting.
create trigger venue_members_quota before insert on public.venue_members
  for each row execute function app.enforce_quota('users');

create or replace function app.enforce_publish_per_day() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_limit integer := app.quota_limit('publishPerDay', app.quota_scope(new.venue_id));
  v_used integer;
begin
  if v_limit is null then
    return new;
  end if;
  select count(*) into v_used
  from public.publications p
  join public.venues v on v.id = p.venue_id
  where p.venue_id = new.venue_id
    and (p.published_at at time zone v.timezone)::date = (now() at time zone v.timezone)::date;
  if v_used >= v_limit then
    raise exception '%',
      app.quota_message('publishPerDay', v_used, v_limit,
        app.trial_venue(new.venue_id) or app.license_is_trial())
      using errcode = 'IM422';
  end if;
  return new;
end
$$;

-- Storage: venue diambil dari path objek. Snapshot tetap dikecualikan agar publish dan rollback
-- tidak gagal di tengah jalan (0038), tetapi tetap ikut dihitung sebagai pemakaian.
create or replace function app.enforce_storage_quota() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_size bigint := nullif(new.metadata->>'size', '')::bigint;
  v_venue uuid := app.quota_scope(app.storage_venue(new.bucket_id, new.name));
  v_trial boolean;
  v_limit integer;
  v_used bigint;
begin
  if v_size is null or new.bucket_id = 'snapshots' then
    return new;
  end if;
  v_trial := app.trial_venue(v_venue) or app.license_is_trial();
  v_limit := app.quota_limit('maxUploadMb', v_venue);
  if v_limit is not null and v_size > v_limit::bigint * 1048576 then
    raise exception '%',
      app.quota_message('maxUploadMb', ceil(v_size / 1048576.0)::bigint, v_limit, v_trial)
      using errcode = 'IM422';
  end if;
  v_limit := app.quota_limit('storageMb', v_venue);
  if v_limit is null then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('quota:storageMb:' || coalesce(v_venue::text, '')));
  select coalesce(sum((o.metadata->>'size')::bigint), 0) into v_used
  from storage.objects o
  where o.id is distinct from new.id
    and (v_venue is null or app.storage_venue(o.bucket_id, o.name) = v_venue);
  if v_used + v_size > v_limit::bigint * 1048576 then
    raise exception '%',
      app.quota_message('storageMb', ceil(v_used / 1048576.0)::bigint, v_limit, v_trial)
      using errcode = 'IM422';
  end if;
  return new;
end
$$;

-- ---------------------------------------------------------------------
-- 7. Pemakaian berlebih sebelum publish: per venue yang diterbitkan
-- ---------------------------------------------------------------------
create function app.quota_exceeded(p_venue_id uuid) returns text
language sql stable security definer
set search_path = ''
as $$
  select string_agg(k, ', ')
  from unnest(array[
    'venues', 'buildings', 'floors', 'infoPoints', 'locations', 'originPoints', 'users', 'features'
  ]) k
  where app.quota_limit(k, p_venue_id) is not null
    and app.quota_used(k, p_venue_id) > app.quota_limit(k, p_venue_id)
$$;
revoke execute on function app.quota_exceeded(uuid) from public;

create or replace function app.quota_exceeded() returns text
language sql stable security definer
set search_path = ''
as $$ select app.quota_exceeded(app.quota_venue()) $$;

create or replace function app.block_publish_over_quota() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  -- Hanya venue trial yang diperiksa per venue; on-premise tetap global, agar publish tetap
  -- ditolak setelah turun paket walau datanya tersebar di beberapa venue.
  if app.quota_exceeded(app.quota_scope(new.venue_id)) is not null then
    raise exception 'Pemakaian melebihi kuota paket. Kurangi data sesuai halaman Lisensi sebelum publish.'
      using errcode = 'IM422';
  end if;
  return new;
end
$$;

-- ---------------------------------------------------------------------
-- 8. Pra-cek unggah: pemakaian Storage ikut bercakupan venue pemanggil
-- ---------------------------------------------------------------------
create or replace function public.license_upload_check(p_bytes bigint) returns void
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_venue uuid := app.quota_venue();
  v_limit integer := app.quota_limit('maxUploadMb', v_venue);
  v_storage integer := app.quota_limit('storageMb', v_venue);
  v_trial boolean := app.trial_venue(v_venue) or app.license_is_trial();
  v_used bigint;
begin
  if not app.can_edit() then
    raise exception 'Tidak berhak mengunggah.' using errcode = '42501';
  end if;
  if v_limit is not null and p_bytes > v_limit::bigint * 1048576 then
    raise exception '%',
      app.quota_message('maxUploadMb', ceil(p_bytes / 1048576.0)::bigint, v_limit, v_trial)
      using errcode = 'IM422';
  end if;
  if v_storage is not null then
    select coalesce(sum((o.metadata->>'size')::bigint), 0) into v_used
    from storage.objects o
    where v_venue is null or app.storage_venue(o.bucket_id, o.name) = v_venue;
    if v_used + p_bytes > v_storage::bigint * 1048576 then
      raise exception '%',
        app.quota_message('storageMb', ceil(v_used / 1048576.0)::bigint, v_storage, v_trial)
        using errcode = 'IM422';
    end if;
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 9. Halaman Lisensi: pengguna trial melihat pemakaian venue-nya sendiri
-- ---------------------------------------------------------------------
-- `app.quota_used(text)` sengaja tetap global (dipakai sebagai acuan oleh test lisensi dan oleh
-- versi dua argumen untuk cabang NULL), jadi cakupan pemanggil disebutkan eksplisit di sini.
create or replace function public.license_usage()
returns table (kind text, used integer, quota integer)
language sql stable security definer
set search_path = ''
as $$
  select k, app.quota_used(k, app.quota_venue()), app.quota_limit(k, app.quota_venue())
  from unnest(array[
    'venues', 'buildings', 'floors', 'infoPoints', 'locations', 'originPoints', 'users',
    'features', 'storageMb', 'publishPerDay'
  ]) k
  where (select app.can_read())
  union all
  select k, null, app.quota_limit(k, app.quota_venue())
  from unnest(array['maxUploadMb', 'importRows']) k
  where (select app.can_read())
$$;

-- `license_import_check` tidak diubah: ia memakai `app.quota_limit('importRows')` yang kini
-- bercakupan pemanggil.
