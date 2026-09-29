-- =====================================================================
-- 0006_outdoor_layer_guard.sql — Area Luar selalu ada (T-102, FR-VEN-04)
-- Lapisan Area Luar hanya boleh terhapus bersama venue-nya (cascade).
-- =====================================================================

create or replace function app.guard_outdoor_layer() returns trigger
language plpgsql
as $$
begin
  if old.is_outdoor and exists (select 1 from public.venues where id = old.venue_id) then
    raise exception 'Lapisan Area Luar tidak bisa dihapus; lapisan ini selalu ada di setiap venue.'
      using errcode = 'IM409';
  end if;
  return old;
end
$$;

create trigger floors_guard_outdoor_layer
  before delete on public.floors
  for each row execute function app.guard_outdoor_layer();
