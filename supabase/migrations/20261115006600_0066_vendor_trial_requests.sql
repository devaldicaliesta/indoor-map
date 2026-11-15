create table vendor.trial_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  institution text not null,
  email text not null check (email = lower(email)),
  instance_id uuid not null,
  ip text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  license_id uuid references vendor.licenses (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index trial_requests_one_pending on vendor.trial_requests (instance_id)
  where status = 'pending';
alter table vendor.trial_requests enable row level security;
revoke all on vendor.trial_requests from public, anon, authenticated;

alter table hosting.vendor_actions drop constraint vendor_actions_action_check;
alter table hosting.vendor_actions add constraint vendor_actions_action_check
  check (action in (
    'trial_extended', 'trial_locked', 'trial_deleted', 'blocked', 'unblocked',
    'client_created', 'installation_created', 'license_issued', 'license_revoked',
    'trial_request_approved', 'trial_request_rejected'
  ));

create function public.vendor_trial_submit(
  p_name text, p_institution text, p_email text, p_instance_id uuid, p_ip text default null
) returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_domain text := split_part(lower(btrim(p_email)), '@', 2);
begin
  if exists (
    select 1 from hosting.blocklist b
    where (b.kind = 'email' and b.value = v_email) or (b.kind = 'domain' and b.value = v_domain)
  ) then
    return 'blocked';
  end if;
  if exists (
    select 1 from vendor.trial_requests r
    where r.instance_id = p_instance_id and r.status = 'approved'
  ) or exists (
    select 1 from vendor.licenses l
    join vendor.installations i on i.id = l.installation_id
    where i.instance_id = p_instance_id and l.payload ->> 'plan' = 'trial'
  ) then
    return 'instance_used';
  end if;
  if exists (
    select 1 from vendor.trial_requests r where r.email = v_email and r.status = 'approved'
  ) then
    return 'email_used';
  end if;
  if not hosting.public_email_domain(v_domain) and exists (
    select 1 from vendor.trial_requests r
    where split_part(r.email, '@', 2) = v_domain and r.status = 'approved'
  ) then
    return 'domain_used';
  end if;
  if exists (
    select 1 from vendor.trial_requests r
    where r.instance_id = p_instance_id and r.status = 'pending'
  ) then
    return 'already_pending';
  end if;
  insert into vendor.trial_requests (name, institution, email, instance_id, ip)
  values (btrim(p_name), btrim(p_institution), v_email, p_instance_id, p_ip);
  return 'queued';
end
$$;

create function public.vendor_trial_requests()
returns table (
  id uuid,
  name text,
  institution text,
  email text,
  instance_id uuid,
  status text,
  reject_reason text,
  created_at timestamptz,
  decided_at timestamptz,
  decided_by_email text,
  license_id text
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  return query
  select r.id, r.name, r.institution, r.email, r.instance_id, r.status, r.reject_reason,
    r.created_at, r.decided_at, p.email, l.license_id
  from vendor.trial_requests r
  left join public.profiles p on p.user_id = r.decided_by
  left join vendor.licenses l on l.id = r.license_id
  order by (r.status = 'pending') desc, r.created_at desc;
end
$$;

create function public.vendor_trial_prepare(p_request_id uuid)
returns table (installation_id uuid, instance_id uuid, client text, name text, email text)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_request vendor.trial_requests;
  v_client uuid;
  v_installation uuid;
begin
  perform app.require_vendor();
  select * into v_request from vendor.trial_requests r where r.id = p_request_id for update;
  if not found or v_request.status <> 'pending' then
    raise exception 'Permintaan trial ini sudah diputuskan atau tidak ada.' using errcode = 'IM409';
  end if;
  select i.id, i.client_id into v_installation, v_client
  from vendor.installations i where i.instance_id = v_request.instance_id;
  if v_client is null then
    select c.id into v_client from vendor.clients c
    where c.email = v_request.email order by c.created_at limit 1;
  end if;
  if v_client is null then
    insert into vendor.clients (name, institution, email)
    values (v_request.name, v_request.institution, v_request.email)
    returning id into v_client;
    perform app.log_vendor_action('client_created', v_client::text,
      jsonb_build_object('institution', v_request.institution, 'trialRequest', p_request_id));
  end if;
  if v_installation is null then
    insert into vendor.installations (client_id, instance_id, name)
    values (v_client, v_request.instance_id, 'Trial on-premise')
    returning id into v_installation;
    perform app.log_vendor_action('installation_created', v_request.instance_id::text,
      jsonb_build_object('client', v_client, 'trialRequest', p_request_id));
  end if;
  return query
  select v_installation, v_request.instance_id, c.institution, v_request.name, v_request.email
  from vendor.clients c where c.id = v_client;
end
$$;

create function public.vendor_trial_approve(
  p_actor uuid, p_request_id uuid, p_installation_id uuid, p_payload jsonb, p_signature text
) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_request vendor.trial_requests;
begin
  select * into v_request from vendor.trial_requests r where r.id = p_request_id for update;
  if not found or v_request.status <> 'pending' then
    raise exception 'Permintaan trial ini sudah diputuskan atau tidak ada.' using errcode = 'IM409';
  end if;
  if p_payload ->> 'plan' is distinct from 'trial'
    or p_payload ->> 'instanceId' is distinct from v_request.instance_id::text then
    raise exception 'Lisensi tidak cocok dengan permintaan trial.' using errcode = 'IM422';
  end if;
  perform public.vendor_license_record(p_actor, p_installation_id, p_payload, p_signature);
  update vendor.trial_requests set
    status = 'approved',
    decided_at = now(),
    decided_by = p_actor,
    license_id = (select l.id from vendor.licenses l where l.license_id = p_payload ->> 'licenseId')
  where id = p_request_id;
  insert into hosting.vendor_actions (user_id, action, target, details)
  values (p_actor, 'trial_request_approved', p_request_id::text,
    jsonb_build_object('license', p_payload ->> 'licenseId', 'email', v_request.email));
end
$$;

create function public.vendor_trial_reject(p_request_id uuid, p_reason text)
returns table (name text, institution text, email text)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_reason text := app.vendor_text(p_reason, 500);
  v_request vendor.trial_requests;
begin
  perform app.require_vendor();
  if v_reason is null then
    raise exception 'Alasan penolakan wajib diisi (maks. 500 karakter).' using errcode = 'IM422';
  end if;
  update vendor.trial_requests r set
    status = 'rejected', reject_reason = v_reason, decided_at = now(), decided_by = auth.uid()
  where r.id = p_request_id and r.status = 'pending'
  returning * into v_request;
  if v_request.id is null then
    raise exception 'Permintaan trial ini sudah diputuskan atau tidak ada.' using errcode = 'IM409';
  end if;
  perform app.log_vendor_action('trial_request_rejected', p_request_id::text,
    jsonb_build_object('email', v_request.email, 'reason', v_reason));
  return query select v_request.name, v_request.institution, v_request.email;
end
$$;

revoke execute on function public.vendor_trial_submit(text, text, text, uuid, text)
  from public, anon, authenticated;
revoke execute on function public.vendor_trial_requests() from public, anon;
revoke execute on function public.vendor_trial_prepare(uuid) from public, anon;
revoke execute on function public.vendor_trial_approve(uuid, uuid, uuid, jsonb, text)
  from public, anon, authenticated;
revoke execute on function public.vendor_trial_reject(uuid, text) from public, anon;
grant execute on function public.vendor_trial_submit(text, text, text, uuid, text) to service_role;
grant execute on function public.vendor_trial_requests() to authenticated;
grant execute on function public.vendor_trial_prepare(uuid) to authenticated;
grant execute on function public.vendor_trial_approve(uuid, uuid, uuid, jsonb, text)
  to service_role;
grant execute on function public.vendor_trial_reject(uuid, text) to authenticated;
