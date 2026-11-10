-- =====================================================================
-- 0061_system_health.sql — Kesehatan sistem (T-597)
-- 1. Agen di server (`deploy/health-report.sh`, cron) melaporkan layanan, versi, disk, dan
--    sertifikat HTTPS; `backup.sh` mencatat hasil setiap backup. Keduanya memanggil fungsi `app.*`
--    lewat psql di kontainer db, jadi tidak ada kunci API untuk agen.
-- 2. Peringatan diputuskan di sini (satu tempat untuk halaman dan email): backup gagal 2 kali
--    berturut-turut, disk > 85%, sertifikat berakhir < 14 hari. Ambang sama dengan
--    `HEALTH_THRESHOLDS` di packages/domain.
-- 3. Peringatan baru dikirim sekali per kejadian ke setiap Super Admin aktif lewat antrean
--    `account_notices` + Edge Function `account-notice` (0021); kejadian yang pulih dihapus,
--    sehingga kejadian berikutnya memicu email lagi.
-- 4. `public.system_health()` untuk halaman Kesehatan sistem, hanya Super Admin.
-- =====================================================================

create table app.server_health (
  id boolean primary key default true check (id),
  reported_at timestamptz not null,
  app_version text,
  -- [{name, state, health}] dari `docker compose ps`.
  services jsonb not null default '[]',
  -- [{path, total_bytes, used_bytes}]: data Docker dan folder instalasi (backup).
  disks jsonb not null default '[]',
  cert_domain text,
  cert_expires_at timestamptz
);

create table app.backup_runs (
  id bigint generated always as identity primary key,
  finished_at timestamptz not null default now(),
  ok boolean not null,
  message text check (length(message) <= 500)
);
create index backup_runs_finished_idx on app.backup_runs (finished_at desc);

-- Kejadian yang sedang berlangsung dan sudah diberitahukan.
create table app.health_alerts (
  kind text primary key check (kind in ('backup_failed', 'disk_high', 'cert_expiring')),
  since timestamptz not null default now(),
  details jsonb not null default '{}'
);

revoke all on app.server_health, app.backup_runs, app.health_alerts
  from public, anon, authenticated;

alter table public.account_notices add column details jsonb not null default '{}';
alter table public.account_notices drop constraint account_notices_kind_check;
alter table public.account_notices add constraint account_notices_kind_check
  check (kind in ('account_locked', 'backup_failed', 'disk_high', 'cert_expiring'));

-- ---------------------------------------------------------------------
-- Keputusan peringatan
-- ---------------------------------------------------------------------
create function app.health_conditions() returns table (kind text, details jsonb)
language sql stable security definer
set search_path = ''
as $$
  with recent as (
    select b.ok, b.message from app.backup_runs b order by b.finished_at desc, b.id desc limit 2
  ),
  fullest as (
    select d ->> 'path' as path,
           (d ->> 'used_bytes')::numeric / nullif((d ->> 'total_bytes')::numeric, 0) as ratio
    from app.server_health h, jsonb_array_elements(h.disks) d
    order by 2 desc nulls last
    limit 1
  )
  select 'backup_failed', jsonb_build_object(
      'message', (select r.message from recent r limit 1),
      'last_success_at', (select max(b.finished_at) from app.backup_runs b where b.ok))
  where (select count(*) from recent r where not r.ok) = 2
  union all
  select 'disk_high', jsonb_build_object('path', f.path, 'percent', floor(f.ratio * 100))
  from fullest f where f.ratio > 0.85
  union all
  select 'cert_expiring', jsonb_build_object(
      'domain', h.cert_domain,
      'expires_at', h.cert_expires_at,
      'days_left', floor(extract(epoch from h.cert_expires_at - now()) / 86400))
  from app.server_health h
  where h.cert_expires_at < now() + interval '14 days'
$$;

create function app.notify_super_admins(p_kind text, p_details jsonb) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_url text;
begin
  select value into v_url from app.server_settings where key = 'functions_url';
  for v_id in
    insert into public.account_notices (user_id, kind, details)
    select p.user_id, p_kind, p_details from public.profiles p
    where p.role = 'super_admin' and p.is_active
    returning id
  loop
    -- Tanpa alamat fungsi pemberitahuan tetap tercatat (sent_at kosong) untuk dikirim ulang.
    continue when v_url is null;
    perform net.http_post(
      url := rtrim(v_url, '/') || '/account-notice',
      body := jsonb_build_object('id', v_id),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  end loop;
end
$$;

create function app.health_evaluate() returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  c record;
begin
  delete from app.health_alerts a
  where not exists (select 1 from app.health_conditions() h where h.kind = a.kind);
  for c in select * from app.health_conditions() loop
    if exists (select 1 from app.health_alerts a where a.kind = c.kind) then
      update app.health_alerts a set details = c.details where a.kind = c.kind;
    else
      insert into app.health_alerts (kind, details) values (c.kind, c.details);
      perform app.notify_super_admins(c.kind, c.details);
    end if;
  end loop;
end
$$;

-- ---------------------------------------------------------------------
-- Masukan dari agen dan backup (hanya superuser di kontainer db)
-- ---------------------------------------------------------------------
create function app.health_report(p_report jsonb) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if jsonb_typeof(p_report) is distinct from 'object'
     or jsonb_typeof(coalesce(p_report -> 'services', '[]')) <> 'array'
     or jsonb_typeof(coalesce(p_report -> 'disks', '[]')) <> 'array' then
    raise exception 'Laporan kesehatan tidak sah.' using errcode = '22023';
  end if;
  insert into app.server_health as h
    (id, reported_at, app_version, services, disks, cert_domain, cert_expires_at)
  values (
    true,
    now(),
    left(nullif(p_report ->> 'version', ''), 50),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', left(s ->> 'name', 50),
        'state', left(s ->> 'state', 30),
        'health', left(coalesce(s ->> 'health', ''), 30)) order by s ->> 'name')
      from jsonb_array_elements(p_report -> 'services') s), '[]'),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'path', left(d ->> 'path', 200),
        'total_bytes', (d ->> 'total')::bigint,
        'used_bytes', (d ->> 'used')::bigint))
      from jsonb_array_elements(p_report -> 'disks') d
      where (d ->> 'total')::bigint > 0), '[]'),
    left(nullif(p_report #>> '{cert,domain}', ''), 253),
    nullif(p_report #>> '{cert,expires_at}', '')::timestamptz)
  on conflict (id) do update set
    reported_at = excluded.reported_at,
    app_version = excluded.app_version,
    services = excluded.services,
    disks = excluded.disks,
    cert_domain = excluded.cert_domain,
    cert_expires_at = excluded.cert_expires_at;
  perform app.health_evaluate();
end
$$;

create function app.health_backup_result(p_ok boolean, p_message text) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into app.backup_runs (ok, message) values (p_ok, left(nullif(trim(p_message), ''), 500));
  -- Riwayat secukupnya untuk halaman; backup berjalan harian.
  delete from app.backup_runs b
  where b.id not in (select r.id from app.backup_runs r order by r.finished_at desc, r.id desc limit 60);
  perform app.health_evaluate();
end
$$;

revoke execute on function app.health_conditions(), app.notify_super_admins(text, jsonb),
  app.health_evaluate(), app.health_report(jsonb), app.health_backup_result(boolean, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Halaman Kesehatan sistem
-- ---------------------------------------------------------------------
create function public.system_health() returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not app.is_super_admin() then
    raise exception 'Hanya Super Admin yang bisa melihat kesehatan sistem.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'checked_at', now(),
    'report', (select to_jsonb(h) - 'id' from app.server_health h),
    'backups', coalesce((
      select jsonb_agg(to_jsonb(b) - 'id' order by b.finished_at desc, b.id desc)
      from (select * from app.backup_runs r order by r.finished_at desc, r.id desc limit 10) b),
      '[]'),
    'last_backup_ok_at', (select max(b.finished_at) from app.backup_runs b where b.ok),
    'license_checkin_at', (select i.last_checkin_at from public.installation i),
    'alerts', coalesce((
      select jsonb_agg(jsonb_build_object('kind', c.kind, 'details', c.details) order by c.kind)
      from app.health_conditions() c), '[]'));
end
$$;
revoke execute on function public.system_health() from public, anon;
grant execute on function public.system_health() to authenticated;
