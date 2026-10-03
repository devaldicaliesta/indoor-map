-- =====================================================================
-- 0029_license_checkin.sql — check-in lisensi, pencabutan, proteksi jam (T-403)
-- Setiap jam pg_cron menjalankan app.license_tick(): mencatat waktu terbesar yang pernah
-- terlihat, dan bila check-in jatuh tempo meminta Edge Function `license-checkin` (lewat
-- pg_net) menanyakan lisensi terbaru ke vendor. Hasilnya dicatat lewat fungsi
-- license_checkin_* (khusus service role). Check-in yang gagal tidak pernah mematikan sistem.
-- Keadaan check-in milik instalasi, bukan baris lisensi: memasang lisensi lain tidak boleh
-- menghapus proteksi jam. Kolom licenses.last_checkin_at/last_seen_at (0001) tidak dipakai.
-- Setiap UPDATE ke installation (satu baris) memakai `where id` karena safeupdate menolak
-- UPDATE tanpa WHERE untuk permintaan lewat PostgREST. license_install (0027) diganti agar
-- berkas yang dicabut vendor tidak bisa dipasang ulang lewat aktivasi atau unggah manual.
-- =====================================================================

create extension if not exists pg_cron with schema pg_catalog;

alter table public.installation
  add column last_seen_at timestamptz,
  add column last_checkin_at timestamptz,
  add column checkin_error text,
  add column checkin_requested_at timestamptz;

comment on column public.installation.last_seen_at is
  'Waktu terbesar yang pernah terlihat (jam server dan waktu vendor saat check-in).';
comment on column public.installation.last_checkin_at is
  'Check-in terakhir yang dijawab vendor (jam server).';
comment on column public.installation.checkin_error is
  'Alasan check-in terakhir gagal; kosong setelah check-in berhasil.';
comment on column public.installation.checkin_requested_at is
  'Permintaan check-in terjadwal yang belum diambil Edge Function license-checkin.';

-- Jam server mundur lebih dari 24 jam dari waktu terbesar yang pernah terlihat. Selisih kecil
-- dibiarkan agar koreksi NTP atau beda jam antar-mesin tidak mengunci lisensi.
create function app.clock_rolled_back() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(now() < i.last_seen_at - interval '24 hours', false)
  from public.installation i
$$;
revoke execute on function app.clock_rolled_back() from public;

create or replace function app.license_active() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select not app.clock_rolled_back() and exists (
    select 1 from public.licenses l
    where l.is_current
      and l.status in ('active', 'grace')
      and (l.payload->>'validFrom')::timestamptz <= now()
      and now() < (l.payload->>'validUntil')::timestamptz
  )
$$;

create or replace function public.license_status()
returns table (state text, instance_id uuid, needs_admin boolean)
language sql stable security definer
set search_path = ''
as $$
  select
    case
      when l.id is null then 'missing'
      when l.status = 'revoked' then 'revoked'
      -- Dengan jam yang mundur masa berlaku tidak bisa dinilai; jam diperbaiki lebih dulu.
      when app.clock_rolled_back() then 'clock_behind'
      when now() < (l.payload->>'validFrom')::timestamptz then 'not_yet_valid'
      when now() >= (l.payload->>'validUntil')::timestamptz then 'expired'
      else 'active'
    end,
    i.instance_id,
    not exists (
      select 1 from public.profiles p where p.role = 'super_admin' and p.is_active
    )
  from public.installation i
  left join public.licenses l on l.is_current
$$;

-- Waktu vendor dianggap benar. Jam server yang selisihnya ≤ 24 jam ikut dipakai; jam server
-- yang jauh lebih cepat tidak dicatat. Karena itu nilai yang pernah tercatat terlalu maju (jam
-- server sempat salah) pulih pada check-in pertama setelah jam server sesuai waktu vendor.
create function app.seen_with_vendor_time(p_server_time timestamptz) returns timestamptz
language sql stable
set search_path = ''
as $$
  select case
    when now() <= p_server_time + interval '24 hours' then greatest(p_server_time, now())
    else p_server_time
  end
$$;
revoke execute on function app.seen_with_vendor_time(timestamptz) from public;

-- Dijalankan pg_cron setiap jam. Check-in jatuh tempo bila belum pernah berhasil, sudah 23 jam
-- sejak berhasil (bukan 24: jadwal per jam membuat check-in harian tidak bergeser satu jam
-- setiap hari), jam server mundur sejak check-in terakhir, atau lisensi sedang tidak berlaku
-- karena jam mundur (dicoba tiap jam agar pulih begitu jam diperbaiki). Gagal dicoba lagi
-- pada jam berikutnya.
create function app.license_tick() returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_last_checkin timestamptz;
  v_url text;
begin
  update public.installation
  set last_seen_at = greatest(last_seen_at, now())
  where id
  returning last_checkin_at into v_last_checkin;

  if not exists (select 1 from public.licenses where is_current) then
    return;
  end if;
  if v_last_checkin is not null
    and now() >= v_last_checkin
    and now() < v_last_checkin + interval '23 hours'
    and not app.clock_rolled_back()
  then
    return;
  end if;

  select value into v_url from app.server_settings where key = 'functions_url';
  -- Tanpa alamat fungsi tidak ada check-in; banner setelah 7 hari menandai salah pasang.
  if v_url is null then
    return;
  end if;
  update public.installation set checkin_requested_at = now() where id;
  -- Batas waktu melebihi batas Edge Function ke vendor (15 detik) agar hasilnya sempat dicatat.
  perform net.http_post(
    url := rtrim(v_url, '/') || '/license-checkin',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 30000
  );
end
$$;
revoke execute on function app.license_tick() from public, anon, authenticated;

select cron.schedule('license-checkin', '7 * * * *', 'select app.license_tick()');

-- Diambil Edge Function sebelum menghubungi vendor. Tanpa sesi Super Admin (diperiksa Edge
-- Function, p_manual) panggilan hanya berlaku bila database baru saja memintanya, sehingga
-- pemanggil dari luar tidak bisa membuat instalasi menghubungi vendor berulang-ulang.
create function public.license_checkin_claim(p_manual boolean)
returns table (license_id text, instance_id uuid)
language plpgsql security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not p_manual then
    update public.installation set checkin_requested_at = null
    where id and checkin_requested_at > now() - interval '10 minutes';
    if not found then
      return;
    end if;
  end if;
  return query
  select l.license_id, i.instance_id
  from public.licenses l cross join public.installation i
  where l.is_current;
end
$$;

-- Vendor menjawab lisensi masih berlaku. p_payload/p_signature: berkas terbaru yang sudah
-- diverifikasi Edge Function (tanda tangan, instance, masa berlaku), atau null. Berkas hanya
-- dipasang bila diterbitkan lebih baru dari yang berlaku: berkas lama tidak bisa diputar ulang,
-- dan lisensi yang dicabut hanya pulih dengan berkas baru dari vendor.
create function public.license_checkin_confirmed(
  p_license_id text,
  p_server_time timestamptz,
  p_payload jsonb default null,
  p_signature text default null
) returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_current public.licenses;
  v_result text := 'unchanged';
begin
  select * into v_current from public.licenses where is_current for update;
  if p_payload is not null
    and v_current.license_id = p_license_id
    and v_current.signature is distinct from p_signature
    and (p_payload->>'issuedAt')::timestamptz > (v_current.payload->>'issuedAt')::timestamptz
  then
    update public.licenses set is_current = false where id = v_current.id;
    insert into public.licenses (license_id, payload, signature, status, source)
    values (p_payload->>'licenseId', p_payload, p_signature, 'active', 'checkin');
    perform app.log_event('license_changed', 'license', null,
      jsonb_build_object('license_id', p_payload->>'licenseId', 'source', 'checkin'));
    v_result := 'renewed';
  end if;
  update public.installation
  set last_checkin_at = now(),
      checkin_error = null,
      last_seen_at = app.seen_with_vendor_time(p_server_time)
  where id;
  return v_result;
end
$$;

-- Dicabut vendor: langsung tidak berlaku, tanpa masa tenggang.
create function public.license_checkin_revoked(p_license_id text, p_server_time timestamptz)
returns text
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.licenses set status = 'revoked'
  where is_current and license_id = p_license_id and status <> 'revoked';
  if found then
    perform app.log_event('license_changed', 'license', null,
      jsonb_build_object('license_id', p_license_id, 'source', 'checkin', 'status', 'revoked'));
  end if;
  update public.installation
  set last_checkin_at = now(),
      checkin_error = null,
      last_seen_at = app.seen_with_vendor_time(p_server_time)
  where id;
  return 'revoked';
end
$$;

-- Vendor tidak terjangkau atau jawabannya tidak sah: lisensi lokal tetap dipakai.
create function public.license_checkin_failed(p_error text) returns text
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.installation
  set checkin_error = left(coalesce(nullif(btrim(p_error), ''), 'Check-in gagal.'), 300),
      last_seen_at = greatest(last_seen_at, now())
  where id;
  return 'failed';
end
$$;

revoke execute on function public.license_checkin_claim(boolean) from public, anon, authenticated;
revoke execute on function public.license_checkin_confirmed(text, timestamptz, jsonb, text)
  from public, anon, authenticated;
revoke execute on function public.license_checkin_revoked(text, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.license_checkin_failed(text) from public, anon, authenticated;
grant execute on function public.license_checkin_claim(boolean) to service_role;
grant execute on function public.license_checkin_confirmed(text, timestamptz, jsonb, text)
  to service_role;
grant execute on function public.license_checkin_revoked(text, timestamptz) to service_role;
grant execute on function public.license_checkin_failed(text) to service_role;

-- Pencabutan berlaku juga untuk aktivasi dan unggah manual: Super Admin bisa membaca isi berkas
-- dari tabel licenses, jadi berkas yang dicabut (atau yang lebih lama) tidak boleh dipasang ulang.
-- Hanya berkas yang diterbitkan vendor setelahnya yang memulihkan lisensi.
create or replace function public.license_install(
  p_license_id text,
  p_payload jsonb,
  p_signature text,
  p_source public.license_source
) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.licenses l
    where l.license_id = p_license_id
      and l.status = 'revoked'
      and (l.payload->>'issuedAt')::timestamptz >= (p_payload->>'issuedAt')::timestamptz
  ) then
    raise exception 'Lisensi ini sudah dicabut vendor. Minta berkas lisensi baru dari vendor.'
      using errcode = 'IM409';
  end if;
  update public.licenses set is_current = false where is_current;
  insert into public.licenses (license_id, payload, signature, status, source)
  values (p_license_id, p_payload, p_signature, 'active', p_source);
  perform app.log_event('license_changed', 'license', null,
    jsonb_build_object('license_id', p_license_id, 'source', p_source));
end
$$;

-- Banner Admin: tanpa check-in berhasil selama 7 hari (sejak check-in terakhir, atau sejak
-- lisensi dipasang bila belum pernah). Null bila tidak terlambat.
create function public.license_checkin_overdue_since() returns timestamptz
language sql stable security definer
set search_path = ''
as $$
  select coalesce(i.last_checkin_at, l.activated_at)
  from public.installation i
  join public.licenses l on l.is_current
  where app.can_read()
    and coalesce(i.last_checkin_at, l.activated_at) <= now() - interval '7 days'
$$;
revoke execute on function public.license_checkin_overdue_since() from public, anon;
grant execute on function public.license_checkin_overdue_since() to authenticated;
