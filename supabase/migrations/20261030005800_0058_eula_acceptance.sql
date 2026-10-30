-- =====================================================================
-- 0058_eula_acceptance.sql — persetujuan EULA saat aktivasi (T-602)
-- Aktivasi wajib menyetujui EULA versi berlaku (`EULA_VERSION`, packages/domain/src/eula.ts)
-- bila versi itu belum pernah disetujui instalasi ini. Edge Function `license-activate`
-- menegakkannya dan meneruskan versi yang disetujui ke `license_install`, yang mencatatnya
-- dalam transaksi yang sama dengan pemasangan lisensi.
-- Persetujuan disimpan di tabel sendiri, bukan hanya di log audit, karena log audit punya masa
-- simpan (0057) sedangkan bukti persetujuan perjanjian harus bertahan selama lisensi dipakai.
-- =====================================================================

create table public.eula_acceptances (
  id bigint generated always as identity primary key,
  version text not null check (version ~ '^\d{4}-\d{2}-\d{2}$'),
  accepted_at timestamptz not null default now(),
  -- Kosong pada aktivasi pertama (Super Admin belum ada) atau setelah akunnya dihapus.
  accepted_by uuid references public.profiles (user_id) on delete set null,
  license_id text not null,
  -- Pemegang lisensi (`client` di berkas lisensi) yang terikat perjanjian.
  licensee text not null,
  instance_id uuid not null
);
create index eula_acceptances_version_idx on public.eula_acceptances (version, accepted_at desc);

alter table public.eula_acceptances enable row level security;
revoke all on public.eula_acceptances from anon, authenticated;
grant select on public.eula_acceptances to authenticated;
create policy eula_acceptances_read on public.eula_acceptances
  for select to authenticated using ((select app.is_super_admin()));

-- Versi terakhir yang disetujui; dibaca halaman aktivasi sebelum login.
create function public.eula_status() returns text
language sql stable security definer
set search_path = ''
as $$
  select e.version from public.eula_acceptances e order by e.accepted_at desc, e.id desc limit 1
$$;
revoke execute on function public.eula_status() from public;
grant execute on function public.eula_status() to anon, authenticated, service_role;

drop function public.license_install(text, jsonb, text, public.license_source, uuid);

create function public.license_install(
  p_license_id text,
  p_payload jsonb,
  p_signature text,
  p_source public.license_source,
  p_actor_id uuid default null,
  p_eula_version text default null
) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  -- Pelaku hanya dipercaya bila memang Super Admin aktif: log audit tidak boleh menyebut orang lain.
  if p_actor_id is not null and not exists (
    select 1 from public.profiles p
    where p.user_id = p_actor_id and p.role = 'super_admin' and p.is_active
  ) then
    raise exception 'Pelaku aktivasi bukan Super Admin aktif.' using errcode = 'IM403';
  end if;
  if exists (
    select 1 from public.licenses l
    where l.license_id = p_license_id
      and l.status = 'revoked'
      and (l.payload->>'issuedAt')::timestamptz >= (p_payload->>'issuedAt')::timestamptz
  ) then
    raise exception 'Lisensi ini sudah dicabut vendor. Minta berkas lisensi baru dari vendor.'
      using errcode = 'IM409';
  end if;
  update public.licenses set is_current = false where is_current;
  insert into public.licenses (license_id, payload, signature, status, source)
  values (p_license_id, p_payload, p_signature, 'active', p_source);
  insert into public.audit_events (user_id, action, entity, entity_id, details)
  values (
    coalesce(p_actor_id, app.current_user_id()),
    'license_changed',
    'license',
    null,
    jsonb_build_object('license_id', p_license_id, 'source', p_source)
  );

  if p_eula_version is not null then
    insert into public.eula_acceptances (version, accepted_by, license_id, licensee, instance_id)
    select p_eula_version, p_actor_id, p_license_id, coalesce(p_payload->>'client', ''), i.instance_id
    from public.installation i where i.id;
    insert into public.audit_events (user_id, action, entity, entity_id, details)
    values (
      coalesce(p_actor_id, app.current_user_id()),
      'eula_accepted',
      'license',
      null,
      jsonb_build_object(
        'version', p_eula_version,
        'license_id', p_license_id,
        'licensee', coalesce(p_payload->>'client', '')
      )
    );
  end if;
end
$$;

revoke execute on function public.license_install(text, jsonb, text, public.license_source, uuid, text)
  from public, anon, authenticated;
grant execute on function public.license_install(text, jsonb, text, public.license_source, uuid, text)
  to service_role;
