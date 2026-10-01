-- =====================================================================
-- 0012_connectors.sql — konektor antar-lantai (T-207)
-- * save_connector: konektor dan pemberhentiannya dalam satu transaksi. Lantai yang baru
--   dilayani mendapat node konektor di posisi yang sama; lantai yang dilepas kehilangan node
--   pemberhentiannya (edge jalur ke node itu ikut terhapus).
-- * delete_connector: konektor beserta semua node pemberhentiannya.
-- * Aturan (pesan Bahasa Indonesia, SQLSTATE IM422): minimal dua lantai venue itu; eskalator
--   tepat dua lantai dengan arah; pintu gedung menghubungkan satu lantai gedung dengan Area
--   Luar; lift, eskalator, dan tangga hanya di lantai satu gedung. Constraint
--   connectors_direction_only_escalator (0001) tetap penjaga terakhir arah eskalator.
-- =====================================================================

create or replace function public.save_connector(
  p_id uuid,
  p_venue_id uuid,
  p_kind public.connector_kind,
  p_name text,
  p_is_accessible boolean,
  p_floor_ids uuid[],
  p_lng double precision,
  p_lat double precision,
  p_direction public.escalator_direction default null
) returns table (floor_id uuid, node_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_name text := nullif(trim(p_name), '');
  v_floors uuid[] := array(select distinct f from unnest(coalesce(p_floor_ids, '{}')) as f);
  v_count int;
  v_outdoor int;
  v_buildings int;
  v_venue uuid;
begin
  -- RLS sudah menolak penulisan, tetapi hapus yang ditolak RLS hanya mengenai nol baris tanpa
  -- galat; izin dicek di depan agar pemanggil tanpa hak selalu mendapat galat.
  if not app.can_edit() then
    raise exception 'Anda tidak memiliki izin untuk mengubah konektor.' using errcode = '42501';
  end if;
  if p_id is null then
    raise exception 'Id konektor wajib diisi.' using errcode = 'IM422';
  end if;
  if v_name is null then
    raise exception 'Nama konektor wajib diisi.' using errcode = 'IM422';
  end if;
  select c.venue_id into v_venue from public.connectors c where c.id = p_id;
  if v_venue is not null and v_venue <> p_venue_id then
    raise exception 'Konektor ini milik venue lain.' using errcode = 'IM422';
  end if;

  select count(*), count(*) filter (where f.is_outdoor), count(distinct f.building_id)
    into v_count, v_outdoor, v_buildings
  from public.floors f
  where f.id = any(v_floors) and f.venue_id = p_venue_id;
  if v_count <> cardinality(v_floors) then
    raise exception 'Lantai konektor harus milik venue ini.' using errcode = 'IM422';
  end if;
  if v_count < 2 then
    raise exception 'Konektor menghubungkan minimal dua lantai.' using errcode = 'IM422';
  end if;
  if p_kind = 'building_door' then
    if v_count <> 2 or v_outdoor <> 1 then
      raise exception 'Pintu gedung menghubungkan satu lantai gedung dengan Area Luar.'
        using errcode = 'IM422';
    end if;
  elsif v_outdoor > 0 or v_buildings <> 1 then
    raise exception 'Lift, eskalator, dan tangga hanya menghubungkan lantai di satu gedung.'
      using errcode = 'IM422';
  end if;
  if p_kind = 'escalator' and v_count <> 2 then
    raise exception 'Eskalator menghubungkan tepat dua lantai.' using errcode = 'IM422';
  end if;
  if p_kind = 'escalator' and p_direction is null then
    raise exception 'Arah eskalator wajib dipilih.' using errcode = 'IM422';
  end if;

  insert into public.connectors (id, venue_id, kind, name, direction, is_accessible)
  values (
    p_id, p_venue_id, p_kind, v_name,
    case when p_kind = 'escalator' then p_direction end,
    coalesce(p_is_accessible, false)
  )
  on conflict (id) do update
    set kind = excluded.kind,
        name = excluded.name,
        direction = excluded.direction,
        is_accessible = excluded.is_accessible;

  -- Lantai yang dilepas: node pemberhentiannya dihapus; pemberhentian dan edge ikut (cascade).
  delete from public.nav_nodes n
  using public.connector_stops s
  where s.connector_id = p_id and s.node_id = n.id and s.floor_id <> all(v_floors);

  -- Lantai baru: node konektor di posisi yang sama dengan pemberhentian lain.
  with added as (
    insert into public.nav_nodes (venue_id, floor_id, geom, role)
    select p_venue_id, f, extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326),
      'connector'
    from unnest(v_floors) as f
    where not exists (
      select 1 from public.connector_stops s where s.connector_id = p_id and s.floor_id = f
    )
    returning id, nav_nodes.floor_id
  )
  insert into public.connector_stops (connector_id, floor_id, node_id)
  select p_id, a.floor_id, a.id from added a;

  return query
    select s.floor_id, s.node_id from public.connector_stops s where s.connector_id = p_id;
end
$$;

create or replace function public.delete_connector(p_id uuid) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not app.can_edit() then
    raise exception 'Anda tidak memiliki izin untuk mengubah konektor.' using errcode = '42501';
  end if;
  delete from public.nav_nodes n
  using public.connector_stops s
  where s.connector_id = p_id and s.node_id = n.id;
  delete from public.connectors where id = p_id;
end
$$;

revoke execute on function public.save_connector(
  uuid, uuid, public.connector_kind, text, boolean, uuid[], double precision, double precision,
  public.escalator_direction
) from public, anon;
grant execute on function public.save_connector(
  uuid, uuid, public.connector_kind, text, boolean, uuid[], double precision, double precision,
  public.escalator_direction
) to authenticated;
revoke execute on function public.delete_connector(uuid) from public, anon;
grant execute on function public.delete_connector(uuid) to authenticated;
