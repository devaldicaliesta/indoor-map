alter table vendor.checkins alter column version drop not null;
create index checkins_installation_time on vendor.checkins (installation_id, created_at desc);
revoke all on vendor.checkins from public, anon, authenticated;

create table vendor.releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique
    check (version ~ '^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$'),
  released_on date not null,
  notes text not null default '',
  download_url text not null check (download_url ~ '^https://[^\s]+$'),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table vendor.releases enable row level security;
revoke all on vendor.releases from public, anon, authenticated;

alter table hosting.vendor_actions drop constraint vendor_actions_action_check;
alter table hosting.vendor_actions add constraint vendor_actions_action_check
  check (action in (
    'trial_extended', 'trial_locked', 'trial_deleted', 'blocked', 'unblocked',
    'client_created', 'installation_created', 'license_issued', 'license_revoked',
    'trial_request_approved', 'trial_request_rejected', 'release_added', 'release_removed'
  ));

create function public.vendor_checkin(
  p_license_id text, p_instance_id uuid, p_version text default null, p_ip text default null
) returns table (outcome text, file jsonb)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_license vendor.licenses;
  v_installation vendor.installations;
begin
  select * into v_license from vendor.licenses l where l.license_id = p_license_id;
  if v_license.id is null then
    return query select 'unknown'::text, null::jsonb;
    return;
  end if;
  select * into v_installation from vendor.installations i where i.id = v_license.installation_id;
  if v_installation.instance_id is distinct from p_instance_id then
    return query select 'wrong_instance'::text, null::jsonb;
    return;
  end if;
  insert into vendor.checkins (installation_id, version, ip_address)
  values (v_installation.id, app.vendor_text(p_version, 64), app.vendor_text(p_ip, 64));
  update vendor.installations set
    last_checkin_at = now(),
    last_version = coalesce(app.vendor_text(p_version, 64), last_version),
    updated_at = now()
  where id = v_installation.id;
  if v_license.status = 'revoked' or (v_license.status = 'superseded' and not exists (
    select 1 from vendor.licenses l
    where l.installation_id = v_installation.id and l.status = 'active'
  )) then
    return query select 'revoked'::text, null::jsonb;
    return;
  end if;
  return query select 'active'::text,
    v_license.payload || jsonb_build_object('signature', v_license.signature);
end
$$;

create function public.vendor_checkins(p_installation_id uuid, p_limit integer default 50)
returns table (created_at timestamptz, version text, ip_address text)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  return query
  select c.created_at, c.version, c.ip_address from vendor.checkins c
  where c.installation_id = p_installation_id
  order by c.created_at desc, c.id desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
end
$$;

create function public.vendor_releases()
returns table (
  id uuid, version text, released_on date, notes text, download_url text, sha256 text,
  created_by_email text, created_at timestamptz
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  return query
  select r.id, r.version, r.released_on, r.notes, r.download_url, r.sha256, p.email, r.created_at
  from vendor.releases r
  left join public.profiles p on p.user_id = r.created_by
  order by r.released_on desc, r.created_at desc;
end
$$;

create function public.vendor_release_add(
  p_version text, p_released_on date, p_notes text, p_download_url text, p_sha256 text
) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_version text := btrim(coalesce(p_version, ''));
  v_url text := btrim(coalesce(p_download_url, ''));
  v_sha text := lower(btrim(coalesce(p_sha256, '')));
  v_notes text := btrim(coalesce(p_notes, ''));
  v_id uuid;
begin
  perform app.require_vendor();
  if v_version !~ '^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$' then
    raise exception 'Versi hanya huruf, angka, titik, garis bawah, dan tanda hubung (maks. 64).'
      using errcode = 'IM422';
  end if;
  if p_released_on is null or p_released_on > current_date + 1 then
    raise exception 'Tanggal rilis wajib diisi dan tidak boleh di masa depan.' using errcode = 'IM422';
  end if;
  if v_url !~ '^https://[^\s]+$' or length(v_url) > 2000 then
    raise exception 'Alamat unduh harus diawali https://.' using errcode = 'IM422';
  end if;
  if v_sha !~ '^[0-9a-f]{64}$' then
    raise exception 'SHA-256 harus 64 karakter heksadesimal (isi berkas .sha256).'
      using errcode = 'IM422';
  end if;
  if length(v_notes) > 2000 then
    raise exception 'Catatan rilis maks. 2000 karakter.' using errcode = 'IM422';
  end if;
  if exists (select 1 from vendor.releases r where r.version = v_version) then
    raise exception 'Rilis versi % sudah ada.', v_version using errcode = 'IM409';
  end if;
  insert into vendor.releases (version, released_on, notes, download_url, sha256, created_by)
  values (v_version, p_released_on, v_notes, v_url, v_sha, auth.uid())
  returning id into v_id;
  perform app.log_vendor_action('release_added', v_version, jsonb_build_object('sha256', v_sha));
  return v_id;
end
$$;

create function public.vendor_release_remove(p_release_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_version text;
begin
  perform app.require_vendor();
  delete from vendor.releases r where r.id = p_release_id returning r.version into v_version;
  if v_version is null then
    raise exception 'Rilis tidak ditemukan.' using errcode = 'IM404';
  end if;
  perform app.log_vendor_action('release_removed', v_version, '{}');
end
$$;

revoke execute on function public.vendor_checkin(text, uuid, text, text)
  from public, anon, authenticated;
revoke execute on function public.vendor_checkins(uuid, integer) from public, anon;
revoke execute on function public.vendor_releases() from public, anon;
revoke execute on function public.vendor_release_add(text, date, text, text, text) from public, anon;
revoke execute on function public.vendor_release_remove(uuid) from public, anon;
grant execute on function public.vendor_checkin(text, uuid, text, text) to service_role;
grant execute on function public.vendor_checkins(uuid, integer) to authenticated;
grant execute on function public.vendor_releases() to authenticated;
grant execute on function public.vendor_release_add(text, date, text, text, text) to authenticated;
grant execute on function public.vendor_release_remove(uuid) to authenticated;
