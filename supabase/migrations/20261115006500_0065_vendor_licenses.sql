alter table vendor.installations
  alter column plan drop not null,
  alter column valid_from drop not null,
  alter column valid_until drop not null;

alter table vendor.licenses drop constraint licenses_status_check;
update vendor.licenses set status = 'superseded' where status = 'expired';
alter table vendor.licenses add constraint licenses_status_check
  check (status in ('active', 'superseded', 'revoked'));
alter table vendor.licenses
  add column issued_by uuid references auth.users (id) on delete set null,
  add column revoked_at timestamptz;
create unique index licenses_one_active on vendor.licenses (installation_id)
  where status = 'active';

alter table hosting.vendor_actions drop constraint vendor_actions_action_check;
alter table hosting.vendor_actions add constraint vendor_actions_action_check
  check (action in (
    'trial_extended', 'trial_locked', 'trial_deleted', 'blocked', 'unblocked',
    'client_created', 'installation_created', 'license_issued', 'license_revoked'
  ));

create function app.vendor_text(p_value text, p_max integer) returns text
language sql immutable
set search_path = ''
as $$
  select case when length(btrim(coalesce(p_value, ''))) between 1 and p_max
    then btrim(p_value) end
$$;
revoke execute on function app.vendor_text(text, integer) from public;

create function public.vendor_client_create(
  p_name text, p_institution text, p_email text, p_phone text default null
) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name text := app.vendor_text(p_name, 200);
  v_institution text := app.vendor_text(p_institution, 200);
  v_email text := lower(app.vendor_text(p_email, 254));
  v_phone text := app.vendor_text(p_phone, 40);
  v_id uuid;
begin
  perform app.require_vendor();
  if v_name is null or v_institution is null or v_email is null
    or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Nama, instansi, dan email yang sah wajib diisi.' using errcode = 'IM422';
  end if;
  insert into vendor.clients (name, institution, email, phone)
  values (v_name, v_institution, v_email, v_phone)
  returning id into v_id;
  perform app.log_vendor_action('client_created', v_id::text,
    jsonb_build_object('institution', v_institution));
  return v_id;
end
$$;

create function public.vendor_installation_create(
  p_client_id uuid, p_instance_id uuid, p_name text
) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name text := app.vendor_text(p_name, 200);
  v_id uuid;
begin
  perform app.require_vendor();
  if v_name is null or p_instance_id is null then
    raise exception 'Nama dan ID instalasi wajib diisi.' using errcode = 'IM422';
  end if;
  if not exists (select 1 from vendor.clients where id = p_client_id) then
    raise exception 'Klien tidak ditemukan.' using errcode = 'IM404';
  end if;
  if exists (select 1 from vendor.installations where instance_id = p_instance_id) then
    raise exception 'ID instalasi ini sudah terdaftar.' using errcode = 'IM409';
  end if;
  insert into vendor.installations (client_id, instance_id, name)
  values (p_client_id, p_instance_id, v_name)
  returning id into v_id;
  perform app.log_vendor_action('installation_created', p_instance_id::text,
    jsonb_build_object('client', p_client_id, 'name', v_name));
  return v_id;
end
$$;

create function public.vendor_license_target(p_installation_id uuid)
returns table (instance_id uuid, client text)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  return query
  select i.instance_id, c.institution
  from vendor.installations i
  join vendor.clients c on c.id = i.client_id
  where i.id = p_installation_id;
  if not found then
    raise exception 'Instalasi tidak ditemukan.' using errcode = 'IM404';
  end if;
end
$$;

create function public.vendor_license_record(
  p_actor uuid, p_installation_id uuid, p_payload jsonb, p_signature text
) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_instance uuid;
  v_client text;
begin
  select i.instance_id, c.institution into v_instance, v_client
  from vendor.installations i
  join vendor.clients c on c.id = i.client_id
  where i.id = p_installation_id
  for update of i;
  if not found then
    raise exception 'Instalasi tidak ditemukan.' using errcode = 'IM404';
  end if;
  if p_payload ->> 'instanceId' is distinct from v_instance::text
    or p_payload ->> 'client' is distinct from v_client
    or coalesce(p_payload ->> 'licenseId', '') = ''
    or coalesce(p_signature, '') = '' then
    raise exception 'Isi lisensi tidak cocok dengan instalasi.' using errcode = 'IM422';
  end if;
  update vendor.licenses set status = 'superseded'
  where installation_id = p_installation_id and status = 'active';
  insert into vendor.licenses
    (installation_id, license_id, payload, signature, status, issued_by)
  values
    (p_installation_id, p_payload ->> 'licenseId', p_payload, p_signature, 'active', p_actor);
  update vendor.installations set
    plan = p_payload ->> 'plan',
    valid_from = (p_payload ->> 'validFrom')::timestamptz,
    valid_until = (p_payload ->> 'validUntil')::timestamptz,
    updated_at = now()
  where id = p_installation_id;
  insert into hosting.vendor_actions (user_id, action, target, details)
  values (p_actor, 'license_issued', p_payload ->> 'licenseId', jsonb_build_object(
    'installation', p_installation_id,
    'plan', p_payload ->> 'plan',
    'validUntil', p_payload ->> 'validUntil'
  ));
end
$$;

create function public.vendor_license_revoke(p_license_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_license text;
begin
  perform app.require_vendor();
  update vendor.licenses set status = 'revoked', revoked_at = now()
  where id = p_license_id and status = 'active'
  returning license_id into v_license;
  if v_license is null then
    raise exception 'Hanya lisensi yang sedang berlaku yang bisa dicabut.' using errcode = 'IM404';
  end if;
  perform app.log_vendor_action('license_revoked', v_license, '{}');
end
$$;

create function public.vendor_licenses(p_installation_id uuid)
returns table (
  id uuid,
  license_id text,
  status text,
  plan text,
  valid_from timestamptz,
  valid_until timestamptz,
  issued_at timestamptz,
  issued_by_email text,
  revoked_at timestamptz,
  file jsonb
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  return query
  select l.id, l.license_id, l.status, l.payload ->> 'plan',
    (l.payload ->> 'validFrom')::timestamptz, (l.payload ->> 'validUntil')::timestamptz,
    l.issued_at, p.email, l.revoked_at,
    l.payload || jsonb_build_object('signature', l.signature)
  from vendor.licenses l
  left join public.profiles p on p.user_id = l.issued_by
  where l.installation_id = p_installation_id
  order by l.issued_at desc, (l.status = 'active') desc, l.license_id desc;
end
$$;

revoke execute on function public.vendor_client_create(text, text, text, text) from public, anon;
revoke execute on function public.vendor_installation_create(uuid, uuid, text) from public, anon;
revoke execute on function public.vendor_license_target(uuid) from public, anon;
revoke execute on function public.vendor_license_record(uuid, uuid, jsonb, text)
  from public, anon, authenticated;
revoke execute on function public.vendor_license_revoke(uuid) from public, anon;
revoke execute on function public.vendor_licenses(uuid) from public, anon;
grant execute on function public.vendor_client_create(text, text, text, text) to authenticated;
grant execute on function public.vendor_installation_create(uuid, uuid, text) to authenticated;
grant execute on function public.vendor_license_target(uuid) to authenticated;
grant execute on function public.vendor_license_record(uuid, uuid, jsonb, text) to service_role;
grant execute on function public.vendor_license_revoke(uuid) to authenticated;
grant execute on function public.vendor_licenses(uuid) to authenticated;

create or replace function public.vendor_installations()
returns table (
  id uuid,
  client_id uuid,
  client_name text,
  instance_id uuid,
  name text,
  plan text,
  valid_from timestamptz,
  valid_until timestamptz,
  last_version text,
  last_checkin_at timestamptz,
  created_at timestamptz
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  return query
  select i.id, i.client_id, c.institution, i.instance_id, i.name, i.plan,
    i.valid_from, i.valid_until, i.last_version, i.last_checkin_at, i.created_at
  from vendor.installations i
  join vendor.clients c on c.id = i.client_id
  order by c.institution, i.created_at;
end
$$;
