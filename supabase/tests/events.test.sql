-- Event dan promosi (T-581): fitur lisensi, validasi server, jadwal berulang, RLS anon, TC-SEC-70.
begin;
create extension if not exists pgtap with schema extensions;

select plan(20);

insert into auth.users (id, email) values
  ('e5810000-0000-4000-8000-000000000001', 'ed@event.test'),
  ('e5810000-0000-4000-8000-000000000002', 'op@event.test'),
  ('e5810000-0000-4000-8000-000000000003', 'vw@event.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e5810000-0000-4000-8000-000000000001', 'ED', 'ed@event.test', 'editor'),
  ('e5810000-0000-4000-8000-000000000002', 'OP', 'op@event.test', 'operator'),
  ('e5810000-0000-4000-8000-000000000003', 'VW', 'vw@event.test', 'viewer');

create function pg_temp.features(p_features text[]) returns void
language sql as $$
  update public.licenses set is_current = false where is_current;
  insert into public.licenses (license_id, payload, signature, status, source)
  values ('LIC-EVT-' || array_to_string(p_features, '-'), jsonb_build_object(
    'validFrom', '2020-01-01T00:00:00Z', 'validUntil', '2099-01-01T00:00:00Z',
    'features', to_jsonb(p_features)), 'x', 'active', 'manual');
$$;

create function pg_temp.as_user(p_id text) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

create temp table target as
  select v.id as venue_id, f.id as floor_id from public.venues v
  join public.floors f on f.venue_id = v.id and not f.is_outdoor limit 1;
insert into public.venues (id, name, slug) values
  ('e5810000-0000-4000-8000-0000000000a0', 'Venue Lain', 'venue-lain-event');
insert into public.location_types (id, venue_id, name) values
  ('e5810000-0000-4000-8000-0000000000b0', (select venue_id from target), 'Ruang'),
  ('e5810000-0000-4000-8000-0000000000b1', 'e5810000-0000-4000-8000-0000000000a0', 'Ruang');
insert into public.locations (id, venue_id, location_type_id, name) values
  ('e5810000-0000-4000-8000-0000000000c0', (select venue_id from target),
   'e5810000-0000-4000-8000-0000000000b0', 'Aula'),
  ('e5810000-0000-4000-8000-0000000000c1', 'e5810000-0000-4000-8000-0000000000a0',
   'e5810000-0000-4000-8000-0000000000b1', 'Aula Lain');
grant select on target to authenticated;

select pg_temp.features(array['3d']);
set local role authenticated;
select pg_temp.as_user('e5810000-0000-4000-8000-000000000001');
select throws_ok(
  $$ insert into public.events (venue_id, title_id, starts_at, ends_at)
     select venue_id, 'Seminar', now(), now() + interval '1 hour' from target $$,
  'IM422', 'Event & Promo tidak termasuk paket lisensi ini.',
  'Tanpa fitur events, server menolak event baru'
);
reset role;

select pg_temp.features(array['events']);
set local role authenticated;
select pg_temp.as_user('e5810000-0000-4000-8000-000000000001');
select lives_ok(
  $$ insert into public.events (id, venue_id, title_id, status, starts_at, ends_at, floor_id, geom)
     select 'e5810000-0000-4000-8000-0000000000e1', venue_id, '  Seminar Kesehatan  ', 'active',
       now() - interval '1 hour', now() + interval '1 hour', floor_id,
       'SRID=4326;POINT(106.8 -6.2)' from target $$,
  'Editor membuat event aktif dengan titik peta'
);
select is(
  (select title_id from public.events where id = 'e5810000-0000-4000-8000-0000000000e1'),
  'Seminar Kesehatan', 'Judul dirapikan'
);
select throws_ok(
  $$ insert into public.events (venue_id, title_id, starts_at, ends_at)
     select venue_id, 'Mundur', now(), now() - interval '1 minute' from target $$,
  'IM422', 'Waktu selesai harus setelah waktu mulai.', 'Selesai sebelum mulai ditolak'
);
select throws_ok(
  $$ insert into public.events (venue_id, title_id, starts_at, ends_at)
     select venue_id, 'Panjang', now(), now() + interval '1 year 1 day' from target $$,
  'IM422', 'Durasi event paling lama 1 tahun.', 'Durasi lebih dari 1 tahun ditolak'
);
select throws_ok(
  $$ insert into public.events (venue_id, title_id, starts_at, ends_at)
     select venue_id, '   ', now(), now() + interval '1 hour' from target $$,
  '23514', null, 'Judul ID kosong ditolak'
);
select throws_ok(
  $$ insert into public.events (venue_id, title_id, starts_at, ends_at, repeat, repeat_until)
     select venue_id, 'Harian', now(), now() + interval '25 hours', 'daily',
       (now() + interval '10 days')::date from target $$,
  'IM422', 'Durasi satu kemunculan lebih panjang dari jarak pengulangannya.',
  'Kemunculan harian lebih dari sehari ditolak'
);
select lives_ok(
  $$ insert into public.events (id, venue_id, title_id, status, starts_at, ends_at, repeat, repeat_until)
     select 'e5810000-0000-4000-8000-0000000000e2', venue_id, 'Senam Pagi', 'active',
       '2026-11-02 06:00+07', '2026-11-02 07:00+07', 'weekly', '2026-11-29' from target $$,
  'Event mingguan disimpan'
);
select is(
  (select last_ends_at from public.events where id = 'e5810000-0000-4000-8000-0000000000e2'),
  '2026-11-23 07:00+07'::timestamptz,
  'Kemunculan terakhir mingguan dihitung menurut jam dinding venue (Senin terakhir sebelum 29 Nov)'
);
select lives_ok(
  $$ insert into public.event_locations (event_id, location_id)
     values ('e5810000-0000-4000-8000-0000000000e1', 'e5810000-0000-4000-8000-0000000000c0') $$,
  'Lokasi venue yang sama ditautkan'
);
select throws_ok(
  $$ insert into public.event_locations (event_id, location_id)
     values ('e5810000-0000-4000-8000-0000000000e1', 'e5810000-0000-4000-8000-0000000000c1') $$,
  'IM422', 'Lokasi bukan milik venue event ini.', 'Lokasi venue lain ditolak'
);
insert into public.events (id, venue_id, title_id, status, starts_at, ends_at) values
  ('e5810000-0000-4000-8000-0000000000e3', (select venue_id from target), 'Draf', 'draft',
   now() - interval '1 hour', now() + interval '1 hour'),
  ('e5810000-0000-4000-8000-0000000000e4', (select venue_id from target), 'Lewat', 'active',
   now() - interval '3 hours', now() - interval '2 hours'),
  ('e5810000-0000-4000-8000-0000000000e5', (select venue_id from target), 'Diakhiri', 'ended',
   now() - interval '1 hour', now() + interval '1 hour'),
  ('e5810000-0000-4000-8000-0000000000e6', (select venue_id from target), 'Segera', 'active',
   now() + interval '1 day', now() + interval '1 day 2 hours');

select pg_temp.as_user('e5810000-0000-4000-8000-000000000002');
select throws_ok(
  $$ insert into public.events (venue_id, title_id, starts_at, ends_at)
     select venue_id, 'Operator', now(), now() + interval '1 hour' from target $$,
  '42501', null, 'TC-SEC-70: Operator tidak bisa membuat event'
);
select pg_temp.as_user('e5810000-0000-4000-8000-000000000003');
select is_empty(
  $$ update public.events set title_id = 'Diubah viewer'
     where id = 'e5810000-0000-4000-8000-0000000000e1' returning id $$,
  'TC-SEC-70: Viewer tidak bisa mengubah event'
);
select is(
  (select count(*)::int from public.events), 6, 'Viewer membaca semua event venue'
);
reset role;

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select set_eq(
  $$ select title_id from public.events $$,
  array['Seminar Kesehatan', 'Senam Pagi', 'Segera'],
  'TC-EVT-04: anon hanya membaca event aktif yang belum selesai'
);
select is(
  (select count(*)::int from public.event_locations), 1, 'anon membaca lokasi event yang tampil'
);
select is_empty(
  $$ select id from public.events where venue_id = 'e5810000-0000-4000-8000-0000000000a0' $$,
  'TC-EVT-04: venue lain tidak membawa event'
);
select throws_ok(
  $$ insert into public.events (venue_id, title_id, starts_at, ends_at)
     select (select id from public.venues limit 1), 'Anon', now(), now() + interval '1 hour' $$,
  '42501', null, 'TC-SEC-70: anon tidak bisa menulis'
);
reset role;

select pg_temp.features(array['3d']);
set local role anon;
select is_empty($$ select id from public.events $$, 'Tanpa fitur events, Visitor tidak membaca event');
reset role;
set local role authenticated;
select pg_temp.as_user('e5810000-0000-4000-8000-000000000001');
select throws_ok(
  $$ update public.events set title_id = 'Diubah' where id = 'e5810000-0000-4000-8000-0000000000e1' $$,
  'IM422', 'Event & Promo tidak termasuk paket lisensi ini.',
  'Tanpa fitur events, perubahan ditolak'
);
reset role;

select * from finish();
rollback;
