-- =====================================================================
-- 0032_license_grace.sql — masa tenggang, kedaluwarsa, perubahan paket (T-406)
-- Setelah tanggal berakhir: 14 hari masa tenggang (state `grace`) — penulisan sudah ditolak
-- app.license_active() (0027), Visitor tetap berjalan. Setelahnya (`expired`) atau bila dicabut,
-- layanan Visitor dihentikan: Edge Function `license-service` mengganti setiap `latest.json`
-- dengan penanda layanan tidak aktif, dan memulihkannya dari versi aktif begitu lisensi berlaku
-- lagi. Tidak ada data yang dihapus. Downgrade dengan pemakaian berlebih menolak publish.
-- =====================================================================

alter table public.installation
  add column service_suspended boolean not null default false;
comment on column public.installation.service_suspended is
  'latest.json setiap venue sedang berisi penanda layanan tidak aktif.';

create or replace function public.license_status()
returns table (state text, instance_id uuid, needs_admin boolean)
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
    )
  from public.installation i
  left join public.licenses l on l.is_current
$$;

-- Tanggal berakhir untuk banner pengingat semua role aktif (bukan rincian lisensi).
create function public.license_valid_until() returns timestamptz
language sql stable security definer
set search_path = ''
as $$
  select (l.payload->>'validUntil')::timestamptz
  from public.licenses l
  where l.is_current and app.can_read()
$$;
revoke execute on function public.license_valid_until() from public, anon;
grant execute on function public.license_valid_until() to authenticated;

-- Pemakaian melebihi kuota (setelah downgrade): publish ditolak sampai dikurangi.
create function app.quota_exceeded() returns text
language sql stable security definer
set search_path = ''
as $$
  select string_agg(k, ', ')
  from unnest(array['venues', 'buildings', 'floors', 'infoPoints']) k
  where app.quota_limit(k) is not null and app.quota_used(k) > app.quota_limit(k)
$$;
revoke execute on function app.quota_exceeded() from public;

create function app.block_publish_over_quota() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if app.quota_exceeded() is not null then
    raise exception 'Pemakaian melebihi kuota paket. Kurangi data sesuai halaman Lisensi sebelum publish.'
      using errcode = 'IM422';
  end if;
  return new;
end
$$;
revoke execute on function app.block_publish_over_quota() from public;

create trigger publications_quota before insert on public.publications
  for each row execute function app.block_publish_over_quota();

-- Layanan Visitor berjalan kecuali lisensi kedaluwarsa melewati tenggang atau dicabut.
create function app.service_active() returns boolean
language sql stable security definer
set search_path = ''
as $$ select (select state from public.license_status()) not in ('expired', 'revoked') $$;
revoke execute on function app.service_active() from public;

-- Meminta Edge Function menyamakan latest.json dengan keadaan lisensi bila berbeda. Dipanggil
-- setiap perubahan lisensi dan setiap tick (masa tenggang berakhir tanpa perubahan baris).
create function app.sync_service() returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_url text;
begin
  if app.service_active() = not (select service_suspended from public.installation) then
    return;
  end if;
  select value into v_url from app.server_settings where key = 'functions_url';
  if v_url is null then
    return;
  end if;
  perform net.http_post(
    url := rtrim(v_url, '/') || '/license-service',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 30000
  );
end
$$;
revoke execute on function app.sync_service() from public, anon, authenticated;

create function app.sync_service_trigger() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform app.sync_service();
  return null;
end
$$;
revoke execute on function app.sync_service_trigger() from public;

create trigger licenses_sync_service after insert or update on public.licenses
  for each statement execute function app.sync_service_trigger();

select cron.schedule('license-service', '17 * * * *', 'select app.sync_service()');

-- Untuk Edge Function license-service (service role): keadaan yang harus diterapkan.
create function public.license_service_state()
returns table (active boolean, venue_id uuid, version integer)
language sql stable security definer
set search_path = ''
as $$
  select app.service_active(), p.venue_id, p.version
  from public.publications p
  where p.is_active
$$;

create function public.license_service_mark(p_suspended boolean) returns void
language sql security definer
set search_path = ''
as $$ update public.installation set service_suspended = p_suspended where id $$;

revoke execute on function public.license_service_state() from public, anon, authenticated;
revoke execute on function public.license_service_mark(boolean) from public, anon, authenticated;
grant execute on function public.license_service_state() to service_role;
grant execute on function public.license_service_mark(boolean) to service_role;
