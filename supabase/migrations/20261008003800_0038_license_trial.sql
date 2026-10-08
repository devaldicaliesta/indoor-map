-- =====================================================================
-- 0038_license_trial.sql — lisensi trial dan batas data trial (T-504)
-- Kuota lisensi diperluas dengan batas yang dibaca dari berkas lisensi (`quota.*`); yang tidak
-- diisi berarti tidak dibatasi, jadi lisensi berbayar lama tidak berubah perilakunya:
--   features      fitur peta per lantai          locations     lokasi
--   originPoints  titik asal (QR)                users         pengguna aktif
--   storageMb     total Storage (MB)             maxUploadMb   ukuran satu berkas (MB)
--   importRows    baris per impor                publishPerDay publish per venue per hari
-- Semua penolakan memakai IM422; saat lisensi trial pesannya "Batas trial tercapai: … n/n".
-- =====================================================================

-- Lisensi berlaku berpaket trial.
create function app.license_is_trial() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select l.payload->>'plan' = 'trial' from public.licenses l where l.is_current),
    false
  )
$$;
revoke execute on function app.license_is_trial() from public;

-- Pesan penolakan kuota; nama dan saran mengikuti jenisnya.
create function app.quota_message(p_kind text, p_used bigint, p_limit bigint) returns text
language sql stable security definer
set search_path = ''
as $$
  select format(
    '%s: %s %s/%s. %s %s.',
    case when app.license_is_trial() then 'Batas trial tercapai' else 'Kuota paket tercapai' end,
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
    case when app.license_is_trial() then 'pasang lisensi berbayar' else 'tingkatkan paket' end
  )
$$;
revoke execute on function app.quota_message(text, bigint, bigint) from public;

-- Pemakaian per jenis. `features` = lantai terpadat; `publishPerDay` = venue dengan publish
-- terbanyak hari ini menurut zona waktu venue; `storageMb` dibulatkan ke atas.
create or replace function app.quota_used(p_kind text) returns integer
language sql stable security definer
set search_path = ''
as $$
  select case p_kind
    when 'venues' then (select count(*) from public.venues)
    when 'buildings' then (select count(*) from public.buildings)
    when 'floors' then (select count(*) from public.floors where not is_outdoor)
    when 'infoPoints' then (select count(*) from public.info_points)
    when 'locations' then (select count(*) from public.locations)
    when 'originPoints' then (select count(*) from public.origin_points)
    when 'users' then (select count(*) from public.profiles where is_active)
    when 'features' then (
      select coalesce(max(n), 0) from (
        select count(*) as n from public.features group by floor_id
      ) per_floor
    )
    when 'storageMb' then (
      select ceil(coalesce(sum((o.metadata->>'size')::bigint), 0) / 1048576.0)
      from storage.objects o
    )
    when 'publishPerDay' then (
      select coalesce(max(n), 0) from (
        select count(*) as n
        from public.publications p
        join public.venues v on v.id = p.venue_id
        where (p.published_at at time zone v.timezone)::date = (now() at time zone v.timezone)::date
        group by p.venue_id
      ) per_venue
    )
  end::integer
$$;

create or replace function app.enforce_quota() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_kind text := tg_argv[0];
  v_limit integer;
  v_used integer;
begin
  -- Bersarang: kolom is_outdoor dan is_active hanya ada di tabelnya masing-masing.
  if v_kind = 'floors' then
    if new.is_outdoor then
      return new;
    end if;
  elsif v_kind = 'users' then
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
  v_limit := app.quota_limit(v_kind);
  if v_limit is null then
    return new;
  end if;
  -- Dua penambahan bersamaan tidak boleh sama-sama lolos di batas kuota.
  if v_kind = 'features' then
    perform pg_advisory_xact_lock(hashtext('quota:features:' || new.floor_id::text));
    select count(*) into v_used from public.features f where f.floor_id = new.floor_id;
  else
    perform pg_advisory_xact_lock(hashtext('quota:' || v_kind));
    v_used := app.quota_used(v_kind);
  end if;
  if v_used >= v_limit then
    raise exception '%', app.quota_message(v_kind, v_used, v_limit) using errcode = 'IM422';
  end if;
  return new;
end
$$;

create trigger locations_quota before insert on public.locations
  for each row execute function app.enforce_quota('locations');
create trigger origin_points_quota before insert on public.origin_points
  for each row execute function app.enforce_quota('originPoints');
create trigger profiles_quota before insert or update of is_active on public.profiles
  for each row execute function app.enforce_quota('users');
create trigger features_quota before insert on public.features
  for each row execute function app.enforce_quota('features');

-- Publish per venue per hari (zona waktu venue). Rollback juga membuat versi baru, jadi ikut
-- dihitung; publish yang gagal di tengah jalan pun tercatat sebagai percobaan.
create function app.enforce_publish_per_day() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_limit integer := app.quota_limit('publishPerDay');
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
    raise exception '%', app.quota_message('publishPerDay', v_used, v_limit) using errcode = 'IM422';
  end if;
  return new;
end
$$;
revoke execute on function app.enforce_publish_per_day() from public;

create trigger publications_per_day before insert on public.publications
  for each row execute function app.enforce_publish_per_day();

-- Storage: ukuran satu berkas dan total Storage diperiksa saat Storage API mencatat objek
-- (ukurannya ada di `metadata.size`). Snapshot ditulis sistem saat publish: ikut dihitung tetapi
-- tidak ditolak, agar publish dan rollback tidak gagal di tengah jalan; ukurannya kecil karena
-- data venue sendiri sudah dibatasi.
create function app.enforce_storage_quota() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_size bigint := nullif(new.metadata->>'size', '')::bigint;
  v_limit integer;
  v_used bigint;
begin
  if v_size is null or new.bucket_id = 'snapshots' then
    return new;
  end if;
  v_limit := app.quota_limit('maxUploadMb');
  if v_limit is not null and v_size > v_limit::bigint * 1048576 then
    raise exception '%', app.quota_message('maxUploadMb', ceil(v_size / 1048576.0)::bigint, v_limit)
      using errcode = 'IM422';
  end if;
  v_limit := app.quota_limit('storageMb');
  if v_limit is null then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('quota:storageMb'));
  select coalesce(sum((o.metadata->>'size')::bigint), 0) into v_used
  from storage.objects o
  where o.id is distinct from new.id;
  if v_used + v_size > v_limit::bigint * 1048576 then
    raise exception '%', app.quota_message('storageMb', ceil(v_used / 1048576.0)::bigint, v_limit)
      using errcode = 'IM422';
  end if;
  return new;
end
$$;
revoke execute on function app.enforce_storage_quota() from public;

create trigger objects_license_quota before insert or update of metadata on storage.objects
  for each row execute function app.enforce_storage_quota();

-- Pemeriksa sebelum mengunggah atau mengimpor, agar Admin bisa menolak dengan pesan yang jelas
-- sebelum mengirim data; batas yang sama tetap ditegakkan trigger di atas dan kuota lokasi.
create function public.license_upload_check(p_bytes bigint) returns void
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_limit integer := app.quota_limit('maxUploadMb');
  v_storage integer := app.quota_limit('storageMb');
  v_used bigint;
begin
  if not app.can_edit() then
    raise exception 'Tidak berhak mengunggah.' using errcode = '42501';
  end if;
  if v_limit is not null and p_bytes > v_limit::bigint * 1048576 then
    raise exception '%', app.quota_message('maxUploadMb', ceil(p_bytes / 1048576.0)::bigint, v_limit)
      using errcode = 'IM422';
  end if;
  if v_storage is not null then
    select coalesce(sum((o.metadata->>'size')::bigint), 0) into v_used from storage.objects o;
    if v_used + p_bytes > v_storage::bigint * 1048576 then
      raise exception '%', app.quota_message('storageMb', ceil(v_used / 1048576.0)::bigint, v_storage)
        using errcode = 'IM422';
    end if;
  end if;
end
$$;
revoke execute on function public.license_upload_check(bigint) from public, anon;
grant execute on function public.license_upload_check(bigint) to authenticated;

create function public.license_import_check(p_rows integer) returns void
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_limit integer := app.quota_limit('importRows');
begin
  if not app.can_edit() then
    raise exception 'Tidak berhak mengimpor.' using errcode = '42501';
  end if;
  if v_limit is not null and p_rows > v_limit then
    raise exception '%', app.quota_message('importRows', p_rows, v_limit) using errcode = 'IM422';
  end if;
end
$$;
revoke execute on function public.license_import_check(integer) from public, anon;
grant execute on function public.license_import_check(integer) to authenticated;

-- Pemakaian semua batas untuk halaman Lisensi dan tombol tambah. Batas per tindakan
-- (`maxUploadMb`, `importRows`) tidak punya pemakaian berjalan (`used` kosong).
create or replace function public.license_usage()
returns table (kind text, used integer, quota integer)
language sql stable security definer
set search_path = ''
as $$
  select k, app.quota_used(k), app.quota_limit(k)
  from unnest(array[
    'venues', 'buildings', 'floors', 'infoPoints', 'locations', 'originPoints', 'users',
    'features', 'storageMb', 'publishPerDay'
  ]) k
  where (select app.can_read())
  union all
  select k, null, app.quota_limit(k)
  from unnest(array['maxUploadMb', 'importRows']) k
  where (select app.can_read())
$$;

-- Setelah turun paket (mis. lisensi berbayar → trial) publish ditolak sampai data dikurangi.
create or replace function app.quota_exceeded() returns text
language sql stable security definer
set search_path = ''
as $$
  select string_agg(k, ', ')
  from unnest(array[
    'venues', 'buildings', 'floors', 'infoPoints', 'locations', 'originPoints', 'users', 'features'
  ]) k
  where app.quota_limit(k) is not null and app.quota_used(k) > app.quota_limit(k)
$$;

-- Status lisensi kini menyebut apakah lisensi berlaku berpaket trial (banner "Trial — sisa N
-- hari" dan pesan batas). Masa tenggang trial sama dengan lisensi biasa: 14 hari.
drop function public.license_status();
create function public.license_status()
returns table (state text, instance_id uuid, needs_admin boolean, is_trial boolean)
language sql stable security definer
set search_path = ''
as $$
  select
    case
      when l.id is null then 'missing'
      when l.status = 'revoked' then 'revoked'
      when app.clock_rolled_back() then 'clock_behind'
      when now() < (l.payload->>'validFrom')::timestamptz then 'not_yet_valid'
      when now() < (l.payload->>'validUntil')::timestamptz then 'active'
      when now() < (l.payload->>'validUntil')::timestamptz + interval '14 days' then 'grace'
      else 'expired'
    end,
    i.instance_id,
    not exists (
      select 1 from public.profiles p where p.role = 'super_admin' and p.is_active
    ),
    coalesce(l.payload->>'plan' = 'trial', false)
  from public.installation i
  left join public.licenses l on l.is_current
$$;
revoke execute on function public.license_status() from public;
grant execute on function public.license_status() to anon, authenticated, service_role;
