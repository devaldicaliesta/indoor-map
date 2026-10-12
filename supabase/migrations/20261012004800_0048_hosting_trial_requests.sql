-- T-614a: permintaan trial ter-hosting dan keputusan verifikasinya (arch §3.3, §3.5, §3.7;
-- FR-HT-01..03).
--
-- Alur: form landing → `trial-request` menyimpan permintaan + hash token, mengirim email
-- verifikasi → pemohon mengklik tautan → `trial-verify` (T-614b) memanggil
-- `hosting_request_verify`, yang memutuskan: token tidak sah/kedaluwarsa, ditolak (blokir atau
-- duplikat), antre (kapasitas penuh), atau dibuatkan ruang kerja.
--
-- Semua aturan keputusan ada di SQL agar bisa diuji pgTAP dan tidak tersebar di Edge Function.
-- Skema `hosting` tidak diekspos PostgREST; Edge Function (service role) memakai pembungkus
-- `public.hosting_*` yang hanya bisa dipanggil service role.
--
-- Leads = `trial_requests`; tetap ada setelah venue trial dihapus.

-- ---------------------------------------------------------------------
-- 1. Tabel
-- ---------------------------------------------------------------------
create table hosting.trial_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  institution text not null,
  title text not null,
  email text not null check (email = lower(email)),
  phone text not null,
  building_type text not null,
  building_size text not null,
  language text not null check (language in ('id', 'en')),
  ip text,
  -- SHA-256 heksadesimal token verifikasi; dikosongkan saat dipakai (sekali pakai, §3.7).
  token_hash text unique,
  token_expires_at timestamptz not null default now() + interval '24 hours',
  status text not null default 'unverified'
    check (status in ('unverified', 'queued', 'active', 'locked', 'deleted', 'rejected')),
  reject_reason text check (reject_reason in ('blocked', 'duplicate')),
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  queued_at timestamptz
);
create index trial_requests_email_idx on hosting.trial_requests (email);
create index trial_requests_domain_idx on hosting.trial_requests (split_part(email, '@', 2));
create index trial_requests_status_idx on hosting.trial_requests (status);
alter table hosting.trial_requests enable row level security;
revoke all on hosting.trial_requests from public, anon, authenticated;
grant select, insert, update, delete on hosting.trial_requests to service_role;

-- Email atau domain yang ditolak (spam, pesaing, permintaan berulang).
create table hosting.blocklist (
  value text primary key check (value = lower(value)),
  kind text not null check (kind in ('email', 'domain')),
  note text,
  created_at timestamptz not null default now()
);
alter table hosting.blocklist enable row level security;
revoke all on hosting.blocklist from public, anon, authenticated;
grant select, insert, update, delete on hosting.blocklist to service_role;

-- Akun vendor untuk dasbor (T-617, wajib 2FA T-592).
create table hosting.vendor_staff (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table hosting.vendor_staff enable row level security;
revoke all on hosting.vendor_staff from public, anon, authenticated;
grant select, insert, update, delete on hosting.vendor_staff to service_role;

alter table hosting.trials
  add column request_id uuid references hosting.trial_requests (id) on delete set null;

-- ---------------------------------------------------------------------
-- 2. Aturan
-- ---------------------------------------------------------------------
-- Domain email umum: satu trial per ALAMAT. Domain lain dianggap domain kantor: satu trial per
-- DOMAIN (FR-HT-03), agar satu instansi tidak mengulang trial dengan alamat berbeda.
create function hosting.public_email_domain(p_domain text) returns boolean
language sql immutable
set search_path = ''
as $$
  select lower(p_domain) = any (array[
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.id', 'ymail.com', 'rocketmail.com',
    'outlook.com', 'outlook.co.id', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com',
    'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'mail.com', 'gmx.com', 'zoho.com',
    'yandex.com'
  ])
$$;

-- Kapasitas trial aktif bersamaan (§1: 15 di Supabase Free). Bisa dinaikkan vendor tanpa migrasi
-- lewat baris `trial_capacity` di `app.server_settings` (naik kelas ke Supabase Pro).
create function hosting.capacity() returns integer
language sql stable
set search_path = ''
as $$
  select coalesce(
    (select s.value::integer from app.server_settings s where s.key = 'trial_capacity'),
    15
  )
$$;

-- ---------------------------------------------------------------------
-- 3. Pembungkus untuk Edge Function (service role saja)
-- ---------------------------------------------------------------------
-- Isian sudah diperiksa `checkHostedTrialRequest` di Edge Function; constraint di atas tetap
-- menjaga bentuk email dan bahasa.
create function public.hosting_request_create(
  p_request jsonb,
  p_ip text,
  p_token_hash text
) returns uuid
language sql security definer
set search_path = ''
as $$
  insert into hosting.trial_requests
    (name, institution, title, email, phone, building_type, building_size, language, ip,
     token_hash)
  values (
    p_request->>'name', p_request->>'institution', p_request->>'title',
    lower(p_request->>'email'), p_request->>'phone', p_request->>'buildingType',
    p_request->>'buildingSize', coalesce(p_request->>'language', 'id'), p_ip, p_token_hash)
  returning id
$$;

-- Keputusan atas satu token. `outcome`:
--   invalid   token tidak dikenal atau sudah dipakai
--   expired   lewat 24 jam (permintaan tetap `unverified`; pemohon mengisi form lagi)
--   rejected  email/domain diblokir, atau sudah pernah trial (alamat; domain kantor)
--   queued    kapasitas penuh; diproses siklus hidup saat ada slot (T-615)
--   provision slot dipesan: status langsung `active` agar dua verifikasi bersamaan tidak
--             melewati kapasitas; Edge Function lalu membuat ruang kerjanya (T-614b) dan
--             mengembalikan ke antrean lewat `hosting_request_requeue` bila gagal.
create function public.hosting_request_verify(p_token_hash text)
returns table (request_id uuid, outcome text)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_request hosting.trial_requests;
  v_domain text;
begin
  -- Satu verifikasi pada satu waktu: pemeriksaan kapasitas dan pemesanan slot tidak boleh
  -- disela verifikasi lain.
  perform pg_advisory_xact_lock(hashtext('hosting:verify'));

  select * into v_request from hosting.trial_requests r
  where r.token_hash = p_token_hash and r.status = 'unverified'
  for update;
  if not found then
    return query select null::uuid, 'invalid'::text;
    return;
  end if;
  if v_request.token_expires_at < now() then
    return query select v_request.id, 'expired'::text;
    return;
  end if;

  update hosting.trial_requests r set token_hash = null, verified_at = now()
  where r.id = v_request.id;
  v_domain := split_part(v_request.email, '@', 2);

  if exists (
    select 1 from hosting.blocklist b
    where (b.kind = 'email' and b.value = v_request.email)
       or (b.kind = 'domain' and b.value = v_domain)
  ) then
    update hosting.trial_requests r set status = 'rejected', reject_reason = 'blocked'
    where r.id = v_request.id;
    return query select v_request.id, 'rejected'::text;
    return;
  end if;

  -- Pernah trial = permintaan lain yang sudah lolos verifikasi (antre, aktif, terkunci, dihapus).
  if exists (
    select 1 from hosting.trial_requests r
    where r.id <> v_request.id
      and r.status in ('queued', 'active', 'locked', 'deleted')
      and (r.email = v_request.email
           or (not hosting.public_email_domain(v_domain)
               and split_part(r.email, '@', 2) = v_domain))
  ) then
    update hosting.trial_requests r set status = 'rejected', reject_reason = 'duplicate'
    where r.id = v_request.id;
    return query select v_request.id, 'rejected'::text;
    return;
  end if;

  if (select count(*) from hosting.trial_requests r where r.status = 'active')
     >= hosting.capacity() then
    update hosting.trial_requests r set status = 'queued', queued_at = now()
    where r.id = v_request.id;
    return query select v_request.id, 'queued'::text;
    return;
  end if;

  update hosting.trial_requests r set status = 'active' where r.id = v_request.id;
  return query select v_request.id, 'provision'::text;
end
$$;

-- Ruang kerja gagal dibuat: slot dilepas dan permintaan menunggu giliran berikutnya.
create function public.hosting_request_requeue(p_request_id uuid) returns void
language sql security definer
set search_path = ''
as $$
  update hosting.trial_requests r set status = 'queued', queued_at = now()
  where r.id = p_request_id and r.status = 'active'
    and not exists (select 1 from hosting.trials t where t.request_id = p_request_id)
$$;

-- Isian permintaan untuk email dan provisioning (Edge Function).
create function public.hosting_request_get(p_request_id uuid)
returns table (
  id uuid, name text, institution text, title text, email text, phone text,
  building_type text, building_size text, language text, status text
)
language sql stable security definer
set search_path = ''
as $$
  select r.id, r.name, r.institution, r.title, r.email, r.phone, r.building_type,
    r.building_size, r.language, r.status
  from hosting.trial_requests r where r.id = p_request_id
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.hosting_request_create(jsonb, text, text)',
    'public.hosting_request_verify(text)',
    'public.hosting_request_requeue(uuid)',
    'public.hosting_request_get(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
