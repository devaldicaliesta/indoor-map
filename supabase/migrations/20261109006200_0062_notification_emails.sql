-- =====================================================================
-- 0062_notification_emails.sql — notifikasi email operasional (T-598)
-- Jenis: pengingat lisensi H-30/H-7/H-1 (Super Admin), publish/rollback (Super Admin, Admin,
-- Editor venue itu), penutupan baru (Super Admin, Admin, Operator venue itu). Pelaku tidak
-- dikirimi email tentang tindakannya sendiri. Ringkasan mingguan menyusul analitik (T-591).
-- 1. Preferensi per pengguna per jenis; tanpa baris = aktif.
-- 2. Setiap email membawa tautan berhenti berlangganan ke halaman Admin publik
--    `/berhenti-langganan?t=<token>`; token acak per (pengguna, jenis), tidak kedaluwarsa,
--    hanya bisa mematikan jenis itu untuk pengguna itu.
-- 3. Pengiriman lewat antrean `account_notices` + Edge Function `account-notice` (0021, 0061).
-- =====================================================================

alter table public.account_notices drop constraint account_notices_kind_check;
alter table public.account_notices add constraint account_notices_kind_check
  check (kind in ('account_locked', 'backup_failed', 'disk_high', 'cert_expiring',
                  'license_reminder', 'publish', 'closure_created'));

create table public.notification_preferences (
  -- Diisi server dari sesi, tidak pernah dari klien.
  user_id uuid not null default auth.uid() references public.profiles (user_id) on delete cascade,
  kind text not null check (kind in ('license_reminder', 'publish', 'closure_created')),
  enabled boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon;

-- Pengguna Admin aktif (dan lolos 2FA bila wajib) hanya membaca dan mengubah miliknya sendiri.
create policy notification_preferences_own on public.notification_preferences
  for all to authenticated
  using (user_id = (select app.current_user_id()) and (select app.user_role()) is not null)
  with check (user_id = (select app.current_user_id()) and (select app.user_role()) is not null);
grant select, insert, update, delete on public.notification_preferences to authenticated;

create table app.notification_tokens (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  kind text not null,
  -- Disimpan apa adanya agar tautan di email lama tetap sama; dampak bocor terbatas pada
  -- mematikan satu jenis email untuk satu pengguna.
  token text not null unique,
  primary key (user_id, kind)
);
revoke all on app.notification_tokens from public, anon, authenticated;

-- Pengingat yang sudah dikirim per lisensi; lisensi baru (perpanjangan) mulai dari awal.
create table app.license_reminders_sent (
  license_id text not null,
  stage integer not null check (stage in (30, 7, 1)),
  sent_at timestamptz not null default now(),
  primary key (license_id, stage)
);
revoke all on app.license_reminders_sent from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Antrean
-- ---------------------------------------------------------------------
create function app.wants_notification(p_user_id uuid, p_kind text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((
    select n.enabled from public.notification_preferences n
    where n.user_id = p_user_id and n.kind = p_kind), true)
$$;

create function app.unsubscribe_url(p_user_id uuid, p_kind text) returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_token text;
  v_admin text;
begin
  select value into v_admin from app.server_settings where key = 'admin_url';
  if v_admin is null then
    return null;
  end if;
  insert into app.notification_tokens (user_id, kind, token)
  values (p_user_id, p_kind, encode(extensions.gen_random_bytes(24), 'hex'))
  on conflict (user_id, kind) do nothing;
  select t.token into v_token from app.notification_tokens t
  where t.user_id = p_user_id and t.kind = p_kind;
  return rtrim(v_admin, '/') || '/berhenti-langganan?t=' || v_token;
end
$$;

-- Satu email per penerima yang masih menginginkan jenis ini.
create function app.send_notification(p_user_ids uuid[], p_kind text, p_details jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_id uuid;
  v_url text;
begin
  select value into v_url from app.server_settings where key = 'functions_url';
  foreach v_user in array coalesce(p_user_ids, '{}') loop
    continue when not app.wants_notification(v_user, p_kind);
    insert into public.account_notices (user_id, kind, details)
    values (v_user, p_kind,
            p_details || jsonb_strip_nulls(jsonb_build_object(
              'unsubscribe_url', app.unsubscribe_url(v_user, p_kind))))
    returning id into v_id;
    continue when v_url is null;
    perform net.http_post(
      url := rtrim(v_url, '/') || '/account-notice',
      body := jsonb_build_object('id', v_id),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  end loop;
end
$$;

-- Pengguna aktif dengan role tertentu yang bisa membuka venue itu, selain pelaku.
create function app.venue_recipients(p_venue_id uuid, p_roles public.app_role[], p_actor uuid)
returns uuid[]
language sql stable security definer
set search_path = ''
as $$
  select coalesce(array_agg(p.user_id order by p.user_id), '{}')
  from public.profiles p
  where p.is_active and p.role = any (p_roles)
    and p.user_id is distinct from p_actor
    and (p.all_venues or exists (
      select 1 from public.venue_members m
      where m.venue_id = p_venue_id and m.user_id = p.user_id))
$$;

-- ---------------------------------------------------------------------
-- Publish dan rollback: dari catatan audit yang ditulis publish_commit
-- ---------------------------------------------------------------------
create function app.notify_publish() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform app.send_notification(
    app.venue_recipients(new.entity_id, '{super_admin,admin,editor}', new.user_id),
    'publish',
    jsonb_strip_nulls(jsonb_build_object(
      'origin', new.action,
      'venue', new.details ->> 'venue',
      'version', new.details -> 'version',
      'source_version', new.details -> 'source_version',
      'actor', (select p.full_name from public.profiles p where p.user_id = new.user_id),
      'at', new.occurred_at,
      'timezone', (select v.timezone from public.venues v where v.id = new.entity_id))));
  return null;
end
$$;

create trigger audit_events_notify_publish
  after insert on public.audit_events
  for each row
  when (new.action in ('publish', 'rollback') and new.entity = 'venue' and new.entity_id is not null)
  execute function app.notify_publish();

-- ---------------------------------------------------------------------
-- Penutupan baru
-- ---------------------------------------------------------------------
create function app.notify_closure() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform app.send_notification(
    app.venue_recipients(new.venue_id, '{super_admin,admin,operator}', new.created_by),
    'closure_created',
    jsonb_strip_nulls(jsonb_build_object(
      'venue', (select v.name from public.venues v where v.id = new.venue_id),
      'timezone', (select v.timezone from public.venues v where v.id = new.venue_id),
      'reason', new.reason,
      'starts_at', new.starts_at,
      'ends_at', new.ends_at,
      'actor', (select p.full_name from public.profiles p where p.user_id = new.created_by))));
  return null;
end
$$;

create trigger closures_notify_created
  after insert on public.closures
  for each row execute function app.notify_closure();

-- ---------------------------------------------------------------------
-- Pengingat lisensi (pg_cron harian; `p_now` agar test bisa memakai jam palsu)
-- ---------------------------------------------------------------------
create function app.license_reminders(p_now timestamptz default now()) returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_license public.licenses;
  v_until timestamptz;
  v_stage integer;
begin
  select * into v_license from public.licenses l where l.is_current and l.status <> 'revoked';
  if not found then
    return null;
  end if;
  v_until := (v_license.payload ->> 'validUntil')::timestamptz;
  if v_until is null or v_until <= p_now then
    return null;
  end if;
  -- Tahap terdekat yang sudah tiba; tahap lebih awal yang terlewat (lisensi dipasang mepet)
  -- ditandai terkirim agar tidak menyusul sebagai email kedua.
  select min(s) into v_stage from unnest(array[30, 7, 1]) s
  where v_until - p_now <= make_interval(days => s);
  if v_stage is null or exists (
    select 1 from app.license_reminders_sent r
    where r.license_id = v_license.license_id and r.stage <= v_stage
  ) then
    return null;
  end if;
  insert into app.license_reminders_sent (license_id, stage)
  select v_license.license_id, s from unnest(array[30, 7, 1]) s where s >= v_stage
  on conflict do nothing;

  perform app.send_notification(
    (select coalesce(array_agg(p.user_id order by p.user_id), '{}') from public.profiles p
     where p.role = 'super_admin' and p.is_active),
    'license_reminder',
    jsonb_strip_nulls(jsonb_build_object(
      'stage', v_stage,
      'days_left', ceil(extract(epoch from v_until - p_now) / 86400),
      'valid_until', v_until,
      'licensee', v_license.payload ->> 'licensee',
      'license_id', v_license.license_id)));
  return v_stage;
end
$$;

select cron.schedule('license-reminders', '13 1 * * *', 'select app.license_reminders()');

-- ---------------------------------------------------------------------
-- Berhenti berlangganan (tanpa login, dari tautan email)
-- ---------------------------------------------------------------------
-- `p_apply = false` hanya menanyakan jenisnya, agar pemindai tautan di server email tidak
-- mematikan langganan tanpa klik pengguna. Token tidak dikenal → NULL.
create function public.notification_unsubscribe(p_token text, p_apply boolean)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_token app.notification_tokens;
begin
  select * into v_token from app.notification_tokens t where t.token = p_token;
  if not found then
    return null;
  end if;
  if p_apply then
    insert into public.notification_preferences (user_id, kind, enabled)
    values (v_token.user_id, v_token.kind, false)
    on conflict (user_id, kind) do update set enabled = false, updated_at = now();
  end if;
  return v_token.kind;
end
$$;
revoke execute on function public.notification_unsubscribe(text, boolean) from public;
grant execute on function public.notification_unsubscribe(text, boolean) to anon, authenticated;

revoke execute on function app.wants_notification(uuid, text), app.unsubscribe_url(uuid, text),
  app.send_notification(uuid[], text, jsonb), app.venue_recipients(uuid, public.app_role[], uuid),
  app.license_reminders(timestamptz)
  from public, anon, authenticated;
