-- T-595a: Vendor Portal - Data klien dan instalasi
-- Skema untuk menyimpan data klien, instalasi, dan lisensi di sisi vendor.

create schema if not exists vendor;

-- Klien yang membeli atau mencoba PanduArah
create table vendor.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  institution text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Instalasi milik klien (satu klien bisa punya beberapa instalasi)
create table vendor.installations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references vendor.clients(id) on delete cascade,
  instance_id uuid not null unique,
  name text not null,
  plan text not null,
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  last_version text,
  last_checkin_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Riwayat lisensi yang diterbitkan untuk instalasi
create table vendor.licenses (
  id uuid primary key default gen_random_uuid(),
  installation_id uuid not null references vendor.installations(id) on delete cascade,
  license_id text not null unique,
  payload jsonb not null,
  signature text not null,
  status text not null check (status in ('active', 'revoked', 'expired')),
  issued_at timestamptz not null default now()
);

-- Riwayat check-in dari instalasi
create table vendor.checkins (
  id bigint generated always as identity primary key,
  installation_id uuid not null references vendor.installations(id) on delete cascade,
  version text not null,
  ip_address text,
  created_at timestamptz not null default now()
);

-- RLS
alter table vendor.clients enable row level security;
alter table vendor.installations enable row level security;
alter table vendor.licenses enable row level security;
alter table vendor.checkins enable row level security;

-- Hanya staf vendor yang bisa mengakses
create policy "Vendor staff can manage clients" on vendor.clients
  for all using (app.vendor_session());

create policy "Vendor staff can manage installations" on vendor.installations
  for all using (app.vendor_session());

create policy "Vendor staff can manage licenses" on vendor.licenses
  for all using (app.vendor_session());

create policy "Vendor staff can read checkins" on vendor.checkins
  for select using (app.vendor_session());

-- Fungsi untuk membaca data klien
create function public.vendor_clients()
returns table (
  id uuid,
  name text,
  institution text,
  email text,
  phone text,
  created_at timestamptz,
  installations_count integer
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  return query
  select c.id, c.name, c.institution, c.email, c.phone, c.created_at,
    (select count(*)::integer from vendor.installations i where i.client_id = c.id)
  from vendor.clients c
  order by c.created_at desc;
end
$$;

-- Fungsi untuk membaca data instalasi
create function public.vendor_installations()
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
  select i.id, i.client_id, c.name, i.instance_id, i.name, i.plan,
    i.valid_from, i.valid_until, i.last_version, i.last_checkin_at, i.created_at
  from vendor.installations i
  join vendor.clients c on c.id = i.client_id
  order by i.created_at desc;
end
$$;

grant execute on function public.vendor_clients() to authenticated;
grant execute on function public.vendor_installations() to authenticated;
