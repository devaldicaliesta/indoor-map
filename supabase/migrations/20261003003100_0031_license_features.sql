-- =====================================================================
-- 0031_license_features.sql — fitur per paket (T-405)
-- Admin membaca fitur lisensi berlaku untuk mengunci kontrol; server menolak Info Point baru
-- tanpa fitur `info_point`, dan Edge Function publish hanya membawa fitur dari lisensi.
-- =====================================================================

create function public.license_features() returns text[]
language sql stable security definer
set search_path = ''
as $$
  select coalesce(array(select jsonb_array_elements_text(l.payload->'features')), '{}')
  from public.licenses l
  where l.is_current and app.can_read()
$$;
revoke execute on function public.license_features() from public, anon;
grant execute on function public.license_features() to authenticated;

create function app.require_info_point_feature() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.licenses l
    where l.is_current and l.payload->'features' ? 'info_point'
  ) then
    raise exception 'Info Point tidak termasuk paket lisensi ini.' using errcode = 'IM422';
  end if;
  return new;
end
$$;
revoke execute on function app.require_info_point_feature() from public;

create trigger info_points_feature before insert on public.info_points
  for each row execute function app.require_info_point_feature();
