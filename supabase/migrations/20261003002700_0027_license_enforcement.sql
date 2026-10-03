-- =====================================================================
-- 0027_license_enforcement.sql — lisensi ditegakkan di server (T-402)
-- Baris `licenses` hanya ditulis Edge Function `license-activate` (service role) setelah
-- tanda tangan, instance, dan masa berlakunya diverifikasi; SQL mempercayai baris itu.
-- Tanpa lisensi berlaku, semua fungsi izin tulis bernilai false sehingga API menolak
-- perubahan apa pun. Baca tetap boleh agar Admin bisa menampilkan halaman aktivasi.
-- Masa tenggang dan kedaluwarsa bertahap menyusul di T-406.
-- =====================================================================

create or replace function app.license_active() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.licenses l
    where l.is_current
      and l.status in ('active', 'grace')
      and (l.payload->>'validFrom')::timestamptz <= now()
      and now() < (l.payload->>'validUntil')::timestamptz
  )
$$;

create or replace function app.can_edit() returns boolean
language sql stable
as $$ select app.has_role(array['super_admin', 'admin', 'editor']::public.app_role[]) and app.license_active() $$;

create or replace function app.can_manage() returns boolean
language sql stable
as $$ select app.has_role(array['super_admin', 'admin']::public.app_role[]) and app.license_active() $$;

create or replace function app.can_manage_closures() returns boolean
language sql stable
as $$ select app.has_role(array['super_admin', 'admin', 'operator']::public.app_role[]) and app.license_active() $$;

-- Status untuk halaman aktivasi, juga sebelum login (instalasi baru belum punya pengguna).
-- Hanya keadaan, instance_id, dan apakah Super Admin pertama masih perlu dibuat; rincian
-- lisensi tetap hanya untuk Super Admin lewat tabel `licenses`.
create or replace function public.license_status()
returns table (state text, instance_id uuid, needs_admin boolean)
language sql stable security definer
set search_path = ''
as $$
  select
    case
      when l.id is null then 'missing'
      when l.status = 'revoked' then 'revoked'
      when now() < (l.payload->>'validFrom')::timestamptz then 'not_yet_valid'
      when now() >= (l.payload->>'validUntil')::timestamptz then 'expired'
      else 'active'
    end,
    i.instance_id,
    not exists (
      select 1 from public.profiles p where p.role = 'super_admin' and p.is_active
    )
  from public.installation i
  left join public.licenses l on l.is_current
$$;

revoke execute on function public.license_status() from public;
grant execute on function public.license_status() to anon, authenticated;
revoke execute on function app.license_active() from public;
grant execute on function app.license_active() to anon, authenticated, service_role;

-- Dipanggil Edge Function `license-activate` setelah verifikasi: lisensi lama dilepas dan
-- yang baru dipasang dalam satu transaksi, sehingga instalasi tidak pernah tanpa lisensi
-- karena penyimpanan yang gagal di tengah jalan.
create or replace function public.license_install(
  p_license_id text,
  p_payload jsonb,
  p_signature text,
  p_source public.license_source
) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.licenses set is_current = false where is_current;
  insert into public.licenses (license_id, payload, signature, status, source)
  values (p_license_id, p_payload, p_signature, 'active', p_source);
  perform app.log_event('license_changed', 'license', null,
    jsonb_build_object('license_id', p_license_id, 'source', p_source));
end
$$;

revoke execute on function public.license_install(text, jsonb, text, public.license_source)
  from public, anon, authenticated;
grant execute on function public.license_install(text, jsonb, text, public.license_source)
  to service_role;
