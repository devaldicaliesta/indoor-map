create table vendor.license_keys (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references vendor.clients (id) on delete cascade,
  key_hash text not null unique,
  key_hint text not null,
  plan text not null,
  duration_days integer not null check (duration_days between 1 and 3650),
  quota jsonb not null check (jsonb_typeof(quota) = 'object'),
  features jsonb not null default '[]' check (jsonb_typeof(features) = 'array'),
  installation_id uuid references vendor.installations (id) on delete set null,
  license_id uuid references vendor.licenses (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  revoked_at timestamptz
);
create index license_keys_client on vendor.license_keys (client_id, created_at desc);
alter table vendor.license_keys enable row level security;
revoke all on vendor.license_keys from public, anon, authenticated;

alter table hosting.vendor_actions drop constraint vendor_actions_action_check;
alter table hosting.vendor_actions add constraint vendor_actions_action_check
  check (action in (
    'trial_extended', 'trial_locked', 'trial_deleted', 'blocked', 'unblocked',
    'client_created', 'installation_created', 'license_issued', 'license_revoked',
    'trial_request_approved', 'trial_request_rejected', 'release_added', 'release_removed',
    'license_key_created', 'license_key_revoked', 'license_key_activated'
  ));

create function app.license_key_hash(p_key text) returns text
language sql immutable
set search_path = ''
as $$
  select encode(extensions.digest(convert_to(p_key, 'UTF8'), 'sha256'), 'hex')
$$;
revoke execute on function app.license_key_hash(text) from public;

create function public.vendor_license_key_create(
  p_client_id uuid, p_plan text, p_duration_days integer, p_quota jsonb, p_features jsonb
) returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_plan text := app.vendor_text(p_plan, 64);
  v_bytes bytea := extensions.gen_random_bytes(25);
  v_raw text := '';
  v_key text;
begin
  perform app.require_vendor();
  if not exists (select 1 from vendor.clients where id = p_client_id) then
    raise exception 'Klien tidak ditemukan.' using errcode = 'IM404';
  end if;
  if v_plan is null or v_plan = 'trial' then
    raise exception 'Paket wajib diisi dan bukan trial.' using errcode = 'IM422';
  end if;
  if p_duration_days is null or p_duration_days not between 1 and 3650 then
    raise exception 'Masa berlaku harus 1–3650 hari.' using errcode = 'IM422';
  end if;
  if jsonb_typeof(p_quota) is distinct from 'object'
    or jsonb_typeof(p_features) is distinct from 'array'
    or exists (
      select 1 from jsonb_array_elements(p_features) f where jsonb_typeof(f) <> 'string'
    ) then
    raise exception 'Kuota atau fitur tidak valid.' using errcode = 'IM422';
  end if;
  for i in 0..24 loop
    v_raw := v_raw || substr(v_alphabet, get_byte(v_bytes, i) % 32 + 1, 1);
  end loop;
  v_key := concat_ws('-', substr(v_raw, 1, 5), substr(v_raw, 6, 5), substr(v_raw, 11, 5),
    substr(v_raw, 16, 5), substr(v_raw, 21, 5));
  insert into vendor.license_keys
    (client_id, key_hash, key_hint, plan, duration_days, quota, features, created_by)
  values
    (p_client_id, app.license_key_hash(v_key), substr(v_raw, 21, 5), v_plan, p_duration_days,
     p_quota, p_features, auth.uid());
  perform app.log_vendor_action('license_key_created', substr(v_raw, 21, 5),
    jsonb_build_object('client', p_client_id, 'plan', v_plan, 'days', p_duration_days));
  return v_key;
end
$$;

create function public.vendor_license_keys(p_client_id uuid)
returns table (
  id uuid,
  key_hint text,
  status text,
  plan text,
  duration_days integer,
  quota jsonb,
  features jsonb,
  instance_id uuid,
  installation_name text,
  license_id text,
  created_at timestamptz,
  created_by_email text,
  activated_at timestamptz,
  revoked_at timestamptz
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  return query
  select k.id, k.key_hint,
    case when k.revoked_at is not null then 'revoked'
      when k.installation_id is not null then 'activated'
      else 'available' end,
    k.plan, k.duration_days, k.quota, k.features, i.instance_id, i.name, l.license_id,
    k.created_at, p.email, k.activated_at, k.revoked_at
  from vendor.license_keys k
  left join vendor.installations i on i.id = k.installation_id
  left join vendor.licenses l on l.id = k.license_id
  left join public.profiles p on p.user_id = k.created_by
  where k.client_id = p_client_id
  order by k.created_at desc;
end
$$;

create function public.vendor_license_key_revoke(p_key_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_hint text;
begin
  perform app.require_vendor();
  update vendor.license_keys set revoked_at = now()
  where id = p_key_id and revoked_at is null and installation_id is null
  returning key_hint into v_hint;
  if v_hint is null then
    raise exception 'Hanya kunci yang belum dipakai yang bisa dicabut. Cabut lisensinya bila kunci sudah diaktifkan.'
      using errcode = 'IM409';
  end if;
  perform app.log_vendor_action('license_key_revoked', v_hint, '{}');
end
$$;

create function public.vendor_license_key_claim(p_key text, p_instance_id uuid)
returns table (
  outcome text,
  installation_id uuid,
  client text,
  plan text,
  duration_days integer,
  quota jsonb,
  features jsonb,
  file jsonb
)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_key vendor.license_keys;
  v_installation vendor.installations;
  v_client text;
  v_file jsonb;
begin
  select * into v_key from vendor.license_keys k
  where k.key_hash = app.license_key_hash(p_key)
  for update;
  if not found then
    return query select 'unknown', null::uuid, null::text, null::text, null::integer,
      null::jsonb, null::jsonb, null::jsonb;
    return;
  end if;
  if v_key.revoked_at is not null then
    return query select 'revoked', null::uuid, null::text, null::text, null::integer,
      null::jsonb, null::jsonb, null::jsonb;
    return;
  end if;
  select c.institution into v_client from vendor.clients c where c.id = v_key.client_id;

  if v_key.installation_id is not null then
    select * into v_installation from vendor.installations i where i.id = v_key.installation_id;
    if v_installation.instance_id is distinct from p_instance_id then
      return query select 'other_instance', null::uuid, null::text, null::text, null::integer,
        null::jsonb, null::jsonb, null::jsonb;
      return;
    end if;
    if v_key.license_id is not null then
      select l.payload || jsonb_build_object('signature', l.signature) into v_file
      from vendor.licenses l
      where l.installation_id = v_installation.id and l.status = 'active';
      return query select case when v_file is null then 'revoked' else 'existing' end,
        v_installation.id, v_client, null::text, null::integer, null::jsonb, null::jsonb, v_file;
      return;
    end if;
  else
    select * into v_installation from vendor.installations i
    where i.instance_id = p_instance_id
    for update;
    if found and v_installation.client_id <> v_key.client_id then
      return query select 'other_client', null::uuid, null::text, null::text, null::integer,
        null::jsonb, null::jsonb, null::jsonb;
      return;
    end if;
    if not found then
      insert into vendor.installations (client_id, instance_id, name)
      values (v_key.client_id, p_instance_id, 'Instalasi ' || left(p_instance_id::text, 8))
      returning * into v_installation;
      insert into hosting.vendor_actions (user_id, action, target, details)
      values (null, 'installation_created', p_instance_id::text,
        jsonb_build_object('client', v_key.client_id, 'via', 'license_key', 'key', v_key.key_hint));
    end if;
    update vendor.license_keys set installation_id = v_installation.id, activated_at = now()
    where id = v_key.id;
  end if;

  return query select 'claim', v_installation.id, v_client, v_key.plan, v_key.duration_days,
    v_key.quota, v_key.features, null::jsonb;
end
$$;

create function public.vendor_license_key_record(
  p_key text, p_payload jsonb, p_signature text
) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_key vendor.license_keys;
begin
  select * into v_key from vendor.license_keys k
  where k.key_hash = app.license_key_hash(p_key)
  for update;
  if not found or v_key.revoked_at is not null or v_key.installation_id is null then
    raise exception 'Kunci lisensi tidak bisa diaktifkan.' using errcode = 'IM404';
  end if;
  if v_key.license_id is not null then
    raise exception 'Kunci lisensi sudah diaktifkan.' using errcode = 'IM409';
  end if;
  if p_payload ->> 'plan' is distinct from v_key.plan then
    raise exception 'Lisensi tidak cocok dengan kunci.' using errcode = 'IM422';
  end if;
  perform public.vendor_license_record(null, v_key.installation_id, p_payload, p_signature);
  update vendor.license_keys set
    license_id = (select l.id from vendor.licenses l where l.license_id = p_payload ->> 'licenseId')
  where id = v_key.id;
  insert into hosting.vendor_actions (user_id, action, target, details)
  values (null, 'license_key_activated', v_key.key_hint, jsonb_build_object(
    'installation', v_key.installation_id,
    'license', p_payload ->> 'licenseId'
  ));
end
$$;

revoke execute on function public.vendor_license_key_create(uuid, text, integer, jsonb, jsonb)
  from public, anon;
revoke execute on function public.vendor_license_keys(uuid) from public, anon;
revoke execute on function public.vendor_license_key_revoke(uuid) from public, anon;
revoke execute on function public.vendor_license_key_claim(text, uuid)
  from public, anon, authenticated;
revoke execute on function public.vendor_license_key_record(text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.vendor_license_key_create(uuid, text, integer, jsonb, jsonb)
  to authenticated;
grant execute on function public.vendor_license_keys(uuid) to authenticated;
grant execute on function public.vendor_license_key_revoke(uuid) to authenticated;
grant execute on function public.vendor_license_key_claim(text, uuid) to service_role;
grant execute on function public.vendor_license_key_record(text, jsonb, text) to service_role;
