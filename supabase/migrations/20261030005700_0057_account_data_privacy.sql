-- =====================================================================
-- 0057_account_data_privacy.sql — hak subjek data akun dan retensi log audit (T-601a, UU PDP)
-- 1. `user_data_export`: Super Admin mengekspor seluruh data pribadi satu akun Admin (JSON).
-- 2. `user_data_delete`: Super Admin menghapus akun beserta data pribadinya dalam satu transaksi.
--    Akun Auth dihapus langsung di SQL (seperti `hosting_lifecycle_purge`, 0050) agar catatan
--    audit dan penghapusannya tidak bisa berselisih. Jejak kepengarangan konten (`created_by`,
--    `published_by`, …) menjadi NULL lewat FK yang sudah ada; konten venue tetap utuh.
-- 3. `audit_retention_days` di Pengaturan Sistem + job harian `audit-retention` yang menghapus
--    log audit lebih tua dari masa simpan. Pembersihan itu sendiri dicatat (`audit_purged`).
-- Peristiwa audit lama milik akun yang dihapus tetap ada sampai masa simpannya habis: isinya
-- hanya UUID tanpa nama atau email (dasar: kewajiban keamanan, `docs/legal/inventaris-data.md`).
-- =====================================================================

alter table public.system_settings
  add column audit_retention_days integer not null default 365
    check (audit_retention_days between 30 and 3650);
comment on column public.system_settings.audit_retention_days is
  'Masa simpan log audit dalam hari (30–3650). Peristiwa lebih tua dihapus job audit-retention.';

-- ---------------------------------------------------------------------
-- Export
-- ---------------------------------------------------------------------
create function public.user_data_export(p_user_id uuid) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not app.is_super_admin() then
    raise exception 'Hanya Super Admin yang bisa mengekspor data pengguna.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = p_user_id) then
    raise exception 'Pengguna tidak ditemukan atau sudah dihapus.' using errcode = 'IM404';
  end if;

  select jsonb_build_object(
    'format', 'panduarah.user-data/1',
    'exported_at', now(),
    'account', (
      select jsonb_build_object(
        'user_id', p.user_id,
        'full_name', p.full_name,
        'email', p.email,
        'role', p.role,
        'is_active', p.is_active,
        'all_venues', p.all_venues,
        'failed_login_count', p.failed_login_count,
        'locked_until', p.locked_until,
        'created_at', p.created_at,
        'updated_at', p.updated_at
      )
      from public.profiles p where p.user_id = p_user_id
    ),
    'sign_in', (
      select jsonb_build_object(
        'created_at', u.created_at,
        'email_confirmed_at', u.email_confirmed_at,
        'last_sign_in_at', u.last_sign_in_at
      )
      from auth.users u where u.id = p_user_id
    ),
    'mfa_factors', coalesce((
      select jsonb_agg(jsonb_build_object(
        'factor_type', f.factor_type,
        'friendly_name', f.friendly_name,
        'status', f.status,
        'created_at', f.created_at
      ) order by f.created_at)
      from auth.mfa_factors f where f.user_id = p_user_id
    ), '[]'),
    'venues', coalesce((
      select jsonb_agg(jsonb_build_object('venue_id', v.id, 'name', v.name) order by v.name)
      from public.venue_members m join public.venues v on v.id = m.venue_id
      where m.user_id = p_user_id
    ), '[]'),
    'tour_progress', coalesce((
      select jsonb_agg(jsonb_build_object('tour_key', t.tour_key, 'seen_at', t.seen_at)
                       order by t.seen_at)
      from public.tour_progress t where t.user_id = p_user_id
    ), '[]'),
    'account_notices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'kind', n.kind, 'created_at', n.created_at, 'sent_at', n.sent_at
      ) order by n.created_at)
      from public.account_notices n where n.user_id = p_user_id
    ), '[]'),
    'audit_events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'occurred_at', e.occurred_at,
        'action', e.action,
        'as_actor', e.user_id is not distinct from p_user_id,
        'entity', e.entity,
        'entity_id', e.entity_id,
        'details', e.details
      ) order by e.occurred_at, e.id)
      from public.audit_events e
      where e.user_id = p_user_id or (e.entity = 'user' and e.entity_id = p_user_id)
    ), '[]'),
    -- Konten venue bukan data pribadi; cukup jumlah yang tercatat atas nama akun ini.
    'authored_counts', jsonb_build_object(
      'features_created', (select count(*) from public.features f where f.created_by = p_user_id),
      'features_updated', (select count(*) from public.features f where f.updated_by = p_user_id),
      'closures_created', (select count(*) from public.closures c where c.created_by = p_user_id),
      'floor_plans_uploaded',
        (select count(*) from public.floor_plans fp where fp.uploaded_by = p_user_id),
      'publications', (select count(*) from public.publications pb where pb.published_by = p_user_id)
    )
  ) into v_result;

  perform app.log_event('user_data_exported', 'user', p_user_id, '{}');
  return v_result;
end
$$;

-- ---------------------------------------------------------------------
-- Hapus
-- ---------------------------------------------------------------------
create function public.user_data_delete(p_user_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  if not app.is_super_admin() then
    raise exception 'Hanya Super Admin yang bisa menghapus akun pengguna.' using errcode = '42501';
  end if;
  if p_user_id = app.current_user_id() then
    raise exception 'Akun Anda sendiri tidak bisa dihapus dari sini. Minta Super Admin lain menghapusnya.'
      using errcode = 'IM409';
  end if;
  select p.role into v_role from public.profiles p where p.user_id = p_user_id for update;
  if v_role is null then
    raise exception 'Pengguna tidak ditemukan atau sudah dihapus.' using errcode = 'IM404';
  end if;

  -- Dicatat lebih dulu: bila penghapusan gagal (mis. Super Admin aktif terakhir, 0003),
  -- transaksi dibatalkan bersama catatannya. Rincian tanpa nama dan email.
  perform app.log_event('user_data_deleted', 'user', p_user_id, jsonb_build_object('role', v_role));
  -- Cascade: profil, keanggotaan venue, tur, pemberitahuan akun, sesi, faktor MFA.
  delete from auth.users u where u.id = p_user_id;
end
$$;

revoke execute on function public.user_data_export(uuid) from public, anon;
revoke execute on function public.user_data_delete(uuid) from public, anon;
grant execute on function public.user_data_export(uuid) to authenticated;
grant execute on function public.user_data_delete(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Retensi log audit
-- ---------------------------------------------------------------------
-- `p_now` agar test bisa menjalankan job pada waktu tertentu.
create function app.purge_audit_events(p_now timestamptz default now()) returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_days integer;
  v_deleted integer;
begin
  select s.audit_retention_days into v_days from public.system_settings s where s.id;
  delete from public.audit_events e where e.occurred_at < p_now - make_interval(days => v_days);
  get diagnostics v_deleted = row_count;
  if v_deleted > 0 then
    insert into public.audit_events (user_id, action, entity, details)
    values (null, 'audit_purged', 'audit_events',
            jsonb_build_object('deleted', v_deleted, 'retention_days', v_days));
  end if;
  return v_deleted;
end
$$;

revoke execute on function app.purge_audit_events(timestamptz) from public, anon, authenticated;

select cron.schedule('audit-retention', '43 2 * * *', 'select app.purge_audit_events()');
