-- T-615a: siklus hidup trial ter-hosting (FR-HT-08..10, arch §3.5 `trial-lifecycle`).
--
--   hari 14  pengingat (3 hari sebelum berakhir)
--   hari 17  terkunci: tulis ditolak (0045), `latest.json` diganti penanda `trialEnded` sehingga
--            Visitor menampilkan "Trial berakhir"; slot dilepas → antrean diproses
--   hari 24  dihapus: berkas Storage, venue beserta datanya, akun pemohon; leads
--            (`trial_requests`) tetap dengan status `deleted`
--
-- Keputusan "apa yang jatuh tempo" ada di SQL (diuji pgTAP); Edge Function `trial-lifecycle`
-- mengerjakan bagian di luar database (email, Storage) dan dipanggil pg_cron tiap jam.
-- Semua langkah idempoten: panggilan ganda atau ulang setelah gagal tidak merusak apa pun.

-- ---------------------------------------------------------------------
-- 1. Lisensi server berlaku lagi tidak membuka venue trial yang terkunci
-- ---------------------------------------------------------------------
-- `license-service` memulihkan `latest.json` setiap publikasi aktif; tanpa ini, perpanjangan
-- lisensi project vendor akan menimpa penanda "Trial berakhir". On-premise tidak berubah.
create or replace function public.license_service_state()
returns table (active boolean, venue_id uuid, version integer)
language sql stable security definer
set search_path = ''
as $$
  select app.service_active(), p.venue_id, p.version
  from public.publications p
  where p.is_active and not app.venue_locked(p.venue_id)
$$;

-- ---------------------------------------------------------------------
-- 2. Langkah yang jatuh tempo (service role saja)
-- ---------------------------------------------------------------------
-- Pengingat: diklaim sekali (reminded_at) lalu dikirim. Trial yang sudah lewat waktunya tidak
-- diingatkan (mis. jadwal sempat mati) — pemohon langsung menerima email "Trial berakhir".
create function public.hosting_lifecycle_remind()
returns table (request_id uuid, venue_id uuid, ends_at timestamptz)
language sql security definer
set search_path = ''
as $$
  update hosting.trials t set reminded_at = now()
  where t.reminded_at is null and t.locked_at is null and t.deleted_at is null
    and t.ends_at > now() and t.ends_at - interval '3 days' <= now()
  returning t.request_id, t.venue_id, t.ends_at
$$;

-- Mengunci trial yang berakhir; yang baru terkunci dikembalikan untuk email.
create function public.hosting_lifecycle_lock()
returns table (request_id uuid, venue_id uuid, delete_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
begin
  return query
  with locked as (
    update hosting.trials t set locked_at = now()
    where t.locked_at is null and t.deleted_at is null and t.ends_at <= now()
    returning t.request_id, t.venue_id, t.locked_at
  ), marked as (
    update hosting.trial_requests r set status = 'locked'
    from locked l where r.id = l.request_id
  )
  select l.request_id, l.venue_id, l.locked_at + interval '7 days' from locked l;
end
$$;

-- Venue trial terkunci yang belum dihapus: penanda `trialEnded` ditulis ulang setiap putaran
-- (murah, ≤ kapasitas), sehingga kegagalan menulis sekali tidak membiarkan peta tetap terbuka.
create function public.hosting_lifecycle_locked_venues()
returns table (venue_id uuid)
language sql stable security definer
set search_path = ''
as $$ select t.venue_id from hosting.trials t where t.locked_at is not null $$;

-- Jatuh tempo dihapus: 7 hari setelah terkunci. Baris ini hilang (cascade) setelah purge, jadi
-- yang gagal di putaran ini diambil lagi di putaran berikutnya.
create function public.hosting_lifecycle_expired()
returns table (venue_id uuid, slug text)
language sql security definer
set search_path = ''
as $$
  update hosting.trials t set deleted_at = coalesce(t.deleted_at, now())
  from public.venues v
  where v.id = t.venue_id and t.locked_at <= now() - interval '7 days'
  returning t.venue_id, v.slug
$$;

-- Berkas Storage milik venue (`app.storage_venue`, 0044) beserta penunjuk slug-nya (T-613).
-- Menghapus objek lewat SQL diblokir Supabase, jadi Edge Function menghapusnya lewat Storage API.
create function public.hosting_lifecycle_files(p_venue_id uuid)
returns table (bucket_id text, name text)
language sql stable security definer
set search_path = ''
as $$
  select o.bucket_id, o.name from storage.objects o
  where app.storage_venue(o.bucket_id, o.name) = p_venue_id
  union all
  select 'snapshots', 'slugs/' || v.slug || '.json' from public.venues v
  where v.id = p_venue_id and v.slug is not null
$$;

-- Venue beserta datanya dan akun anggotanya dihapus; leads tetap dengan status `deleted`.
-- Akun yang juga anggota venue lain atau akses-semua (staf vendor) tidak disentuh.
create function public.hosting_lifecycle_purge(p_venue_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_users uuid[];
begin
  if not exists (
    select 1 from hosting.trials t
    where t.venue_id = p_venue_id and t.locked_at <= now() - interval '7 days'
  ) then
    raise exception 'Venue ini bukan trial yang jatuh tempo dihapus.' using errcode = '22023';
  end if;
  update hosting.trial_requests r set status = 'deleted'
  from hosting.trials t where t.venue_id = p_venue_id and r.id = t.request_id;
  select array_agg(m.user_id) into v_users
  from public.venue_members m
  join public.profiles p on p.user_id = m.user_id
  where m.venue_id = p_venue_id and not p.all_venues
    and not exists (
      select 1 from public.venue_members o where o.user_id = m.user_id and o.venue_id <> p_venue_id
    );
  delete from public.venues v where v.id = p_venue_id;
  delete from auth.users u where u.id = any (coalesce(v_users, array[]::uuid[]));
end
$$;

-- Antrean: permintaan tertua diaktifkan (slot dipesan) bila ada slot; NULL bila penuh/kosong.
-- Kunci sama dengan `hosting_request_verify` agar keduanya tidak melewati kapasitas bersama.
create function public.hosting_queue_next() returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('hosting:verify'));
  if (select count(*) from hosting.trial_requests r where r.status = 'active')
     >= hosting.capacity() then
    return null;
  end if;
  update hosting.trial_requests r set status = 'active'
  where r.id = (
    select q.id from hosting.trial_requests q
    where q.status = 'queued' order by q.queued_at, q.created_at limit 1
  )
  returning r.id into v_id;
  return v_id;
end
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.hosting_lifecycle_remind()',
    'public.hosting_lifecycle_lock()',
    'public.hosting_lifecycle_locked_venues()',
    'public.hosting_lifecycle_expired()',
    'public.hosting_lifecycle_files(uuid)',
    'public.hosting_lifecycle_purge(uuid)',
    'public.hosting_queue_next()'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3. Jadwal: tiap jam, hanya di project ter-hosting
-- ---------------------------------------------------------------------
create function app.request_trial_lifecycle() returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_url text;
begin
  if not app.hosting_mode() then
    return;
  end if;
  select value into v_url from app.server_settings where key = 'functions_url';
  if v_url is null then
    return;
  end if;
  perform net.http_post(
    url := rtrim(v_url, '/') || '/trial-lifecycle',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 60000
  );
end
$$;
revoke execute on function app.request_trial_lifecycle() from public, anon, authenticated;

select cron.schedule('trial-lifecycle', '27 * * * *', 'select app.request_trial_lifecycle()');
