-- T-617: dasbor vendor (FR-HT-14, arch §3.7) — ringkasan kapasitas, daftar trial dan leads,
-- perpanjang, kunci, hapus, ekspor leads, blokir email/domain.
--
-- Pintu masuk tunggal: `app.vendor_session()` — project ter-hosting, akun terdaftar di
-- `hosting.vendor_staff` dengan profil aktif, DAN sesi berverifikasi dua langkah (klaim JWT
-- `aal = aal2`, TOTP Supabase Auth). Password saja tidak cukup untuk membaca leads.
--
-- Kunci dan hapus tidak mengerjakan sendiri bagian di luar database (email, penanda Visitor,
-- berkas Storage): keduanya hanya memajukan tanggal sehingga langkah siklus hidup yang sama
-- (0050, Edge Function `trial-lifecycle`) yang mengerjakannya. Dasbor memanggil fungsi itu
-- seketika; bila gagal, jadwal pg_cron berikutnya (≤ 1 jam) menyelesaikannya.

-- ---------------------------------------------------------------------
-- 1. Data
-- ---------------------------------------------------------------------
-- Perpanjangan dari vendor, total paling lama 17 hari per trial (FR-HT-14).
alter table hosting.trials
  add column extended_days integer not null default 0
    check (extended_days between 0 and 17);

-- Jejak tindakan staf vendor. Tidak memakai `audit_events`: catatan itu milik instalasi klien
-- dan daftar peristiwanya tetap (Admin menolak aksi yang tidak dikenal).
create table hosting.vendor_actions (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  user_id uuid,
  action text not null
    check (action in ('trial_extended', 'trial_locked', 'trial_deleted', 'blocked', 'unblocked')),
  target text not null,
  details jsonb not null default '{}'
);
alter table hosting.vendor_actions enable row level security;
revoke all on hosting.vendor_actions from public, anon, authenticated;
grant select, insert on hosting.vendor_actions to service_role;

-- ---------------------------------------------------------------------
-- 2. Akses
-- ---------------------------------------------------------------------
create function app.vendor_staff() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select app.hosting_mode()
    and exists (
      select 1 from hosting.vendor_staff s
      join public.profiles p on p.user_id = s.user_id
      where s.user_id = auth.uid() and p.is_active
    )
$$;
revoke execute on function app.vendor_staff() from public;

create function app.vendor_session() returns boolean
language sql stable security definer
set search_path = ''
as $$ select app.vendor_staff() and coalesce(auth.jwt() ->> 'aal', '') = 'aal2' $$;
revoke execute on function app.vendor_session() from public;

create function app.require_vendor() returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not app.vendor_session() then
    raise exception 'Hanya staf vendor dengan verifikasi dua langkah yang bisa membuka dasbor.'
      using errcode = '42501';
  end if;
end
$$;
revoke execute on function app.require_vendor() from public;

create function app.log_vendor_action(p_action text, p_target text, p_details jsonb default '{}')
returns void
language sql security definer
set search_path = ''
as $$
  insert into hosting.vendor_actions (user_id, action, target, details)
  values (auth.uid(), p_action, p_target, coalesce(p_details, '{}'))
$$;
revoke execute on function app.log_vendor_action(text, text, jsonb) from public;

-- Langkah layar masuk dasbor, hanya tentang pemanggil sendiri:
--   denied  bukan staf vendor (atau bukan project ter-hosting)
--   mfa     staf vendor, sesi belum berverifikasi dua langkah
--   ok      dasbor boleh dibuka
create function public.vendor_access() returns text
language sql stable security definer
set search_path = ''
as $$
  select case
    when not app.vendor_staff() then 'denied'
    when not app.vendor_session() then 'mfa'
    else 'ok'
  end
$$;

-- ---------------------------------------------------------------------
-- 3. Baca
-- ---------------------------------------------------------------------
create function public.vendor_capacity() returns integer
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  return hosting.capacity();
end
$$;

-- Semua permintaan trial (leads) beserta ruang kerjanya, terbaru lebih dulu. IP tidak ikut:
-- dipakai hanya untuk anti-penyalahgunaan (kebijakan privasi landing).
-- `published_versions` > 1 berarti pemohon sudah publish sendiri (versi 1 dibuat provisioning).
create function public.vendor_requests()
returns table (
  id uuid,
  created_at timestamptz,
  name text,
  institution text,
  title text,
  email text,
  phone text,
  building_type text,
  building_size text,
  language text,
  status text,
  reject_reason text,
  verified_at timestamptz,
  queued_at timestamptz,
  venue_id uuid,
  slug text,
  started_at timestamptz,
  ends_at timestamptz,
  locked_at timestamptz,
  extended_days integer,
  published_versions integer,
  last_published_at timestamptz
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  return query
  select r.id, r.created_at, r.name, r.institution, r.title, r.email, r.phone,
    r.building_type, r.building_size, r.language, r.status, r.reject_reason,
    r.verified_at, r.queued_at,
    t.venue_id, v.slug, t.started_at, t.ends_at, t.locked_at, t.extended_days,
    (select count(*)::integer from public.publications p where p.venue_id = t.venue_id),
    (select max(p.published_at) from public.publications p where p.venue_id = t.venue_id)
  from hosting.trial_requests r
  left join hosting.trials t on t.request_id = r.id and t.deleted_at is null
  left join public.venues v on v.id = t.venue_id
  order by r.created_at desc;
end
$$;

create function public.vendor_blocklist()
returns table (value text, kind text, note text, created_at timestamptz)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  return query
  select b.value, b.kind, b.note, b.created_at from hosting.blocklist b
  order by b.created_at desc;
end
$$;

-- ---------------------------------------------------------------------
-- 4. Tindakan
-- ---------------------------------------------------------------------
-- Trial yang belum dihapus, dikunci barisnya untuk diubah.
create function app.vendor_trial(p_venue_id uuid) returns hosting.trials
language plpgsql security definer
set search_path = ''
as $$
declare
  v_trial hosting.trials;
begin
  select * into v_trial from hosting.trials t
  where t.venue_id = p_venue_id and t.deleted_at is null
  for update;
  if not found then
    raise exception 'Trial tidak ditemukan atau sudah dihapus.' using errcode = 'IM404';
  end if;
  return v_trial;
end
$$;
revoke execute on function app.vendor_trial(uuid) from public;

-- Menambah masa trial yang belum terkunci. Pengingat dikirim lagi bila masa barunya masih lebih
-- dari 3 hari. Trial terkunci tidak dibuka lagi: penanda "Trial berakhir" sudah menggantikan
-- peta publiknya.
create function public.vendor_trial_extend(p_venue_id uuid, p_days integer)
returns timestamptz
language plpgsql security definer
set search_path = ''
as $$
declare
  v_trial hosting.trials;
  v_ends timestamptz;
begin
  perform app.require_vendor();
  v_trial := app.vendor_trial(p_venue_id);
  if v_trial.locked_at is not null then
    raise exception 'Trial yang sudah terkunci tidak bisa diperpanjang.' using errcode = 'IM409';
  end if;
  if p_days is null or p_days < 1 or v_trial.extended_days + p_days > 17 then
    raise exception 'Perpanjangan total paling lama 17 hari; sisa % hari.',
      17 - v_trial.extended_days using errcode = 'IM422';
  end if;
  v_ends := v_trial.ends_at + make_interval(days => p_days);
  update hosting.trials t set
    ends_at = v_ends,
    extended_days = t.extended_days + p_days,
    reminded_at = case when v_ends - interval '3 days' > now() then null else t.reminded_at end
  where t.venue_id = p_venue_id;
  perform app.log_vendor_action('trial_extended', p_venue_id::text,
    jsonb_build_object('days', p_days, 'endsAt', v_ends));
  return v_ends;
end
$$;

-- Berakhir sekarang; `hosting_lifecycle_lock` lalu menguncinya seperti hari ke-17 (email pemohon
-- dan vendor, penanda Visitor, slot dilepas ke antrean).
create function public.vendor_trial_lock(p_venue_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_trial hosting.trials;
begin
  perform app.require_vendor();
  v_trial := app.vendor_trial(p_venue_id);
  if v_trial.locked_at is not null then
    raise exception 'Trial ini sudah terkunci.' using errcode = 'IM409';
  end if;
  update hosting.trials t set ends_at = least(t.ends_at, now()) where t.venue_id = p_venue_id;
  perform app.log_vendor_action('trial_locked', p_venue_id::text);
end
$$;

-- Jatuh tempo dihapus sekarang; `hosting_lifecycle_expired` + purge menghapus berkas, venue, dan
-- akun pemohon. Tanpa email ke pemohon (mis. penyalahgunaan atau atas permintaannya). Slot
-- langsung dilepas.
create function public.vendor_trial_delete(p_venue_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  perform app.vendor_trial(p_venue_id);
  update hosting.trials t set
    ends_at = least(t.ends_at, now()),
    locked_at = least(coalesce(t.locked_at, now()), now()) - interval '7 days'
  where t.venue_id = p_venue_id;
  update hosting.trial_requests r set status = 'locked'
  from hosting.trials t
  where t.venue_id = p_venue_id and r.id = t.request_id and r.status = 'active';
  perform app.log_vendor_action('trial_deleted', p_venue_id::text);
end
$$;

-- Satu aturan dengan `parseBlockValue` (packages/domain): alamat email, atau domain yang bukan
-- domain email umum — memblokir gmail.com akan menolak hampir semua pemohon.
create function public.vendor_block(p_value text, p_note text default null) returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_value text := lower(trim(coalesce(p_value, '')));
  v_kind text;
begin
  perform app.require_vendor();
  if v_value ~ '^[^@\s]+@([a-z0-9-]+\.)+[a-z]{2,}$' then
    v_kind := 'email';
  elsif v_value ~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$' then
    if hosting.public_email_domain(v_value) then
      raise exception 'Domain email umum tidak bisa diblokir; blokir alamat emailnya.'
        using errcode = 'IM422';
    end if;
    v_kind := 'domain';
  else
    raise exception 'Isi alamat email atau domain, mis. nama@contoh.co.id atau contoh.co.id.'
      using errcode = 'IM422';
  end if;
  insert into hosting.blocklist (value, kind, note)
  values (v_value, v_kind, nullif(left(trim(coalesce(p_note, '')), 200), ''))
  on conflict (value) do update set note = excluded.note;
  perform app.log_vendor_action('blocked', v_value);
  return v_kind;
end
$$;

create function public.vendor_unblock(p_value text) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform app.require_vendor();
  delete from hosting.blocklist b where b.value = lower(trim(p_value));
  if found then
    perform app.log_vendor_action('unblocked', lower(trim(p_value)));
  end if;
end
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.vendor_access()',
    'public.vendor_capacity()',
    'public.vendor_requests()',
    'public.vendor_blocklist()',
    'public.vendor_trial_extend(uuid, integer)',
    'public.vendor_trial_lock(uuid)',
    'public.vendor_trial_delete(uuid)',
    'public.vendor_block(text, text)',
    'public.vendor_unblock(text)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
