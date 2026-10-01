-- Konektor antar-lantai: save_connector dan delete_connector (T-207).
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

insert into auth.users (id, email) values
  ('e7000000-0000-4000-8000-000000000001', 'ed@connector.test'),
  ('e7000000-0000-4000-8000-000000000002', 'op@connector.test'),
  ('e7000000-0000-4000-8000-000000000003', 'vw@connector.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e7000000-0000-4000-8000-000000000001', 'ED', 'ed@connector.test', 'editor'),
  ('e7000000-0000-4000-8000-000000000002', 'OP', 'op@connector.test', 'operator'),
  ('e7000000-0000-4000-8000-000000000003', 'VW', 'vw@connector.test', 'viewer');

-- Venue A: gedung G (GF, L1, L2), gedung H (GF), Area Luar (dibuat trigger). Venue B: Area Luar.
insert into public.venues (id, name) values
  ('a7000000-0000-4000-8000-00000000000a', 'Venue Uji Konektor A'),
  ('a7000000-0000-4000-8000-00000000000b', 'Venue Uji Konektor B');
insert into public.buildings (id, venue_id, name, code) values
  ('b7000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-00000000000a', 'Gedung G', 'G'),
  ('b7000000-0000-4000-8000-000000000002', 'a7000000-0000-4000-8000-00000000000a', 'Gedung H', 'H');
insert into public.floors (id, venue_id, building_id, name, level) values
  ('c7000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-00000000000a',
   'b7000000-0000-4000-8000-000000000001', 'GF', 0),
  ('c7000000-0000-4000-8000-000000000002', 'a7000000-0000-4000-8000-00000000000a',
   'b7000000-0000-4000-8000-000000000001', 'L1', 1),
  ('c7000000-0000-4000-8000-000000000003', 'a7000000-0000-4000-8000-00000000000a',
   'b7000000-0000-4000-8000-000000000001', 'L2', 2),
  ('c7000000-0000-4000-8000-000000000004', 'a7000000-0000-4000-8000-00000000000a',
   'b7000000-0000-4000-8000-000000000002', 'GF', 0);

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

create function pg_temp.save(
  p_id text, p_kind text, p_floors text[], p_direction text default null, p_venue text default 'a7000000-0000-4000-8000-00000000000a'
) returns setof record
language sql as $$
  select * from public.save_connector(
    p_id => p_id::uuid,
    p_venue_id => p_venue::uuid,
    p_kind => p_kind::public.connector_kind,
    p_name => 'Konektor uji',
    p_is_accessible => true,
    p_floor_ids => p_floors::uuid[],
    p_lng => 106.8,
    p_lat => -6.17,
    p_direction => p_direction::public.escalator_direction
  )
$$;

create function pg_temp.outdoor() returns text
language sql as $$
  select id::text from public.floors
  where venue_id = 'a7000000-0000-4000-8000-00000000000a' and is_outdoor
$$;

set local role authenticated;
select pg_temp.as_user('e7000000-0000-4000-8000-000000000001');

-- Lift tiga lantai: satu pemberhentian dan satu node konektor per lantai, di posisi yang sama.
select lives_ok(
  $$ select pg_temp.save('17000000-0000-4000-8000-000000000001', 'elevator',
       '{c7000000-0000-4000-8000-000000000001,c7000000-0000-4000-8000-000000000002,c7000000-0000-4000-8000-000000000003}') $$,
  'Editor: lift tiga lantai tersimpan'
);
select is(
  (select count(*)::int from public.connector_stops where connector_id = '17000000-0000-4000-8000-000000000001'),
  3,
  'Lift punya tiga pemberhentian'
);
select is(
  (select count(*)::int from public.nav_nodes n
   join public.connector_stops s on s.node_id = n.id
   where s.connector_id = '17000000-0000-4000-8000-000000000001'
     and n.role = 'connector' and n.floor_id = s.floor_id
     and extensions.st_equals(n.geom, extensions.st_setsrid(extensions.st_makepoint(106.8, -6.17), 4326))),
  3,
  'Setiap pemberhentian punya node konektor di lantainya pada posisi yang sama'
);

-- Lantai yang dilepas: node dan edge-nya ikut terhapus; lantai lain tetap.
insert into public.nav_nodes (id, venue_id, floor_id, geom)
values ('97000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-00000000000a',
        'c7000000-0000-4000-8000-000000000003', 'SRID=4326;POINT(106.80001 -6.17)');
insert into public.nav_edges (id, venue_id, floor_id, from_node_id, to_node_id, length_m)
select '98000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-00000000000a',
  'c7000000-0000-4000-8000-000000000003', '97000000-0000-4000-8000-000000000001', node_id, 1.1
from public.connector_stops
where connector_id = '17000000-0000-4000-8000-000000000001'
  and floor_id = 'c7000000-0000-4000-8000-000000000003';
select lives_ok(
  $$ select pg_temp.save('17000000-0000-4000-8000-000000000001', 'elevator',
       '{c7000000-0000-4000-8000-000000000001,c7000000-0000-4000-8000-000000000002}') $$,
  'Lift tidak lagi melayani L2'
);
select is(
  (select array_agg(floor_id order by floor_id)::text from public.connector_stops
   where connector_id = '17000000-0000-4000-8000-000000000001'),
  '{c7000000-0000-4000-8000-000000000001,c7000000-0000-4000-8000-000000000002}',
  'Pemberhentian L2 dilepas, GF dan L1 tetap'
);
select is(
  (select count(*)::int from public.nav_edges where id = '98000000-0000-4000-8000-000000000001'),
  0,
  'Edge jalur ke node pemberhentian yang dilepas ikut terhapus'
);

-- Eskalator: arah wajib, tepat dua lantai.
select throws_ok(
  $$ select pg_temp.save('17000000-0000-4000-8000-000000000002', 'escalator',
       '{c7000000-0000-4000-8000-000000000001,c7000000-0000-4000-8000-000000000002}') $$,
  'IM422',
  'Arah eskalator wajib dipilih.',
  'Eskalator tanpa arah tidak bisa disimpan'
);
select is(
  (select count(*)::int from public.connectors where id = '17000000-0000-4000-8000-000000000002'),
  0,
  'Eskalator yang ditolak tidak tersimpan'
);
select throws_ok(
  $$ select pg_temp.save('17000000-0000-4000-8000-000000000002', 'escalator',
       '{c7000000-0000-4000-8000-000000000001,c7000000-0000-4000-8000-000000000002,c7000000-0000-4000-8000-000000000003}', 'up') $$,
  'IM422',
  'Eskalator menghubungkan tepat dua lantai.',
  'Eskalator tiga lantai ditolak'
);
select lives_ok(
  $$ select pg_temp.save('17000000-0000-4000-8000-000000000002', 'escalator',
       '{c7000000-0000-4000-8000-000000000001,c7000000-0000-4000-8000-000000000002}', 'up') $$,
  'Eskalator naik GF → L1 tersimpan'
);
select is(
  (select direction::text from public.connectors where id = '17000000-0000-4000-8000-000000000002'),
  'up',
  'Arah eskalator tersimpan'
);
select throws_ok(
  $$ insert into public.connectors (venue_id, kind, name, is_accessible)
     values ('a7000000-0000-4000-8000-00000000000a', 'escalator', 'Tanpa arah', false) $$,
  '23514',
  NULL,
  'Constraint tetap menolak eskalator tanpa arah yang ditulis langsung'
);

-- Tangga dan pintu gedung.
select lives_ok(
  $$ select pg_temp.save('17000000-0000-4000-8000-000000000003', 'stairs',
       '{c7000000-0000-4000-8000-000000000001,c7000000-0000-4000-8000-000000000002,c7000000-0000-4000-8000-000000000003}') $$,
  'Tangga tiga lantai tersimpan'
);
select throws_ok(
  $$ select pg_temp.save('17000000-0000-4000-8000-000000000004', 'stairs',
       '{c7000000-0000-4000-8000-000000000001,c7000000-0000-4000-8000-000000000004}') $$,
  'IM422',
  'Lift, eskalator, dan tangga hanya menghubungkan lantai di satu gedung.',
  'Tangga antar-gedung ditolak'
);
select lives_ok(
  format($$ select pg_temp.save('17000000-0000-4000-8000-000000000005', 'building_door',
       '{c7000000-0000-4000-8000-000000000004,%s}') $$, pg_temp.outdoor()),
  'Pintu gedung H ↔ Area Luar tersimpan'
);
select throws_ok(
  $$ select pg_temp.save('17000000-0000-4000-8000-000000000006', 'building_door',
       '{c7000000-0000-4000-8000-000000000001,c7000000-0000-4000-8000-000000000002}') $$,
  'IM422',
  'Pintu gedung menghubungkan satu lantai gedung dengan Area Luar.',
  'Pintu gedung tanpa Area Luar ditolak'
);
select throws_ok(
  $$ select pg_temp.save('17000000-0000-4000-8000-000000000006', 'elevator',
       '{c7000000-0000-4000-8000-000000000001}') $$,
  'IM422',
  'Konektor menghubungkan minimal dua lantai.',
  'Konektor satu lantai ditolak'
);
select throws_ok(
  $$ select pg_temp.save('17000000-0000-4000-8000-000000000006', 'elevator',
       '{c7000000-0000-4000-8000-000000000001,c7000000-0000-4000-8000-000000000002}',
       null, 'a7000000-0000-4000-8000-00000000000b') $$,
  'IM422',
  'Lantai konektor harus milik venue ini.',
  'Lantai venue lain ditolak'
);

-- Hapus konektor: node pemberhentian ikut terhapus.
select lives_ok(
  $$ select public.delete_connector('17000000-0000-4000-8000-000000000003') $$,
  'Editor menghapus tangga'
);
select is(
  (select count(*)::int from public.nav_nodes n
   where n.role = 'connector' and not exists (select 1 from public.connector_stops s where s.node_id = n.id)),
  0,
  'Tidak ada node konektor yang tertinggal tanpa pemberhentian'
);

-- Operator dan Viewer tidak boleh mengubah konektor.
select pg_temp.as_user('e7000000-0000-4000-8000-000000000002');
select throws_ok(
  $$ select public.delete_connector('17000000-0000-4000-8000-000000000001') $$,
  '42501',
  'Anda tidak memiliki izin untuk mengubah konektor.',
  'Operator ditolak menghapus konektor'
);
select pg_temp.as_user('e7000000-0000-4000-8000-000000000003');
select throws_ok(
  $$ select pg_temp.save('17000000-0000-4000-8000-000000000001', 'elevator',
       '{c7000000-0000-4000-8000-000000000001,c7000000-0000-4000-8000-000000000003}') $$,
  '42501',
  'Anda tidak memiliki izin untuk mengubah konektor.',
  'Viewer ditolak mengubah konektor'
);

select * from finish();
rollback;
