-- Analitik penggunaan (T-591): tanpa data pribadi (TC-OPS-02), akses (TC-SEC-72), agregasi
-- harian, dan retensi data mentah 90 hari.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email) values
  ('e5910000-0000-4000-8000-000000000001', 'ed@analytics.test'),
  ('e5910000-0000-4000-8000-000000000002', 'op@analytics.test'),
  ('e5910000-0000-4000-8000-000000000003', 'vw@analytics.test'),
  ('e5910000-0000-4000-8000-000000000004', 'ad@analytics.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e5910000-0000-4000-8000-000000000001', 'ED', 'ed@analytics.test', 'editor'),
  ('e5910000-0000-4000-8000-000000000002', 'OP', 'op@analytics.test', 'operator'),
  ('e5910000-0000-4000-8000-000000000003', 'VW', 'vw@analytics.test', 'viewer'),
  ('e5910000-0000-4000-8000-000000000004', 'AD', 'ad@analytics.test', 'admin');

create function pg_temp.as_user(p_id text) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

insert into public.venues (id, name, slug, timezone) values
  ('e5910000-0000-4000-8000-0000000000a0', 'Venue Analitik', 'venue-analitik', 'Asia/Jakarta');

select is(
  (select count(*)::int from information_schema.columns
   where table_schema = 'public' and table_name = 'analytics_events'
     and column_name ~* '(ip|addr|agent|session|user|email|phone|name|device_id|fingerprint|cookie)'),
  0,
  'TC-OPS-02: tabel analitik tidak punya kolom IP, identitas, sesi, atau perangkat'
);

update public.system_settings set analytics_enabled = false;
select is(
  public.analytics_ingest('e5910000-0000-4000-8000-0000000000a0',
    '[{"kind":"visit","source":"direct","language":"id","device":"mobile"}]'),
  0,
  'Analitik dimatikan di Pengaturan: kiriman tidak disimpan (TC-OPS-03)'
);

update public.system_settings set analytics_enabled = true;
select is(
  public.analytics_ingest('e5910000-0000-4000-8000-0000000000a0', $$[
    {"kind":"visit","source":"origin_qr","sourceRef":"abc123def456","language":"id","device":"mobile"},
    {"kind":"search","source":"direct","language":"en","device":"desktop","query":"  Toilet  Lantai ","resultCount":0},
    {"kind":"location","source":"info_point","sourceRef":"IP-LOBI","language":"id","device":"kiosk",
     "targetKind":"location","targetId":"e5910000-0000-4000-8000-0000000000c0"},
    {"kind":"route","source":"info_point","sourceRef":"IP-LOBI","language":"id","device":"kiosk",
     "targetKind":"location","targetId":"e5910000-0000-4000-8000-0000000000c0",
     "originKind":"info_point","originRef":"IP-LOBI"}
  ]$$),
  4,
  'Empat event uji disimpan'
);
select is(
  (select query from public.analytics_events where kind = 'search'),
  'toilet lantai',
  'Kata kunci dinormalkan: huruf kecil, spasi dirapikan'
);
select throws_ok(
  $$ select public.analytics_ingest('e5910000-0000-4000-8000-0000000000a0',
       (select jsonb_agg('{"kind":"visit","source":"direct","language":"id","device":"mobile"}'::jsonb)
        from generate_series(1, 51))) $$,
  'IM422', 'Kiriman analitik tidak valid.',
  'Lebih dari 50 event dalam satu kiriman ditolak'
);
select throws_ok(
  $$ select public.analytics_ingest('e5910000-0000-4000-8000-0000000000ff',
       '[{"kind":"visit","source":"direct","language":"id","device":"mobile"}]') $$,
  'IM404', 'Venue tidak dikenal.',
  'Venue yang tidak ada ditolak'
);

set local role anon;
select throws_ok(
  $$ select public.analytics_ingest('e5910000-0000-4000-8000-0000000000a0', '[]') $$,
  '42501', null,
  'TC-SEC-72: anon tidak bisa memanggil RPC simpan langsung (hanya lewat endpoint berbatas laju)'
);
select throws_ok(
  $$ select count(*) from public.analytics_events $$,
  '42501', null,
  'TC-SEC-72: anon tidak bisa membaca data analitik'
);
reset role;

set local role authenticated;
select pg_temp.as_user('e5910000-0000-4000-8000-000000000001');
select is((select count(*)::int from public.analytics_events), 0, 'TC-SEC-72: Editor tidak membaca');
select is(
  (select count(*)::int from public.analytics_facts('e5910000-0000-4000-8000-0000000000a0',
     current_date - 1, current_date + 1)),
  0, 'TC-SEC-72: dasbor kosong untuk Editor'
);
select pg_temp.as_user('e5910000-0000-4000-8000-000000000002');
select is((select count(*)::int from public.analytics_events), 0, 'TC-SEC-72: Operator tidak membaca');
select pg_temp.as_user('e5910000-0000-4000-8000-000000000003');
select is((select count(*)::int from public.analytics_events), 4, 'TC-SEC-72: Viewer membaca');
select pg_temp.as_user('e5910000-0000-4000-8000-000000000004');
select results_eq(
  $$ select metric, key, count::int from public.analytics_facts(
       'e5910000-0000-4000-8000-0000000000a0', current_date - 1, current_date + 1)
     where metric in ('kind', 'search_empty', 'info_point', 'origin_qr', 'route_from')
     order by metric, key $$,
  $$ values ('info_point', 'IP-LOBI', 2), ('kind', 'location', 1), ('kind', 'route', 1),
            ('kind', 'search', 1), ('kind', 'visit', 1), ('origin_qr', 'abc123def456', 1),
            ('route_from', 'info_point:IP-LOBI', 1), ('search_empty', 'toilet lantai', 1) $$,
  'TC-OPS-01: angka dasbor Admin cocok dengan event uji'
);
reset role;

delete from public.analytics_events where venue_id = 'e5910000-0000-4000-8000-0000000000a0';
insert into public.analytics_events (venue_id, occurred_at, kind, source, language, device) values
  ('e5910000-0000-4000-8000-0000000000a0', '2026-11-10 16:59+00', 'visit', 'direct', 'id', 'mobile'),
  ('e5910000-0000-4000-8000-0000000000a0', '2026-11-10 17:01+00', 'visit', 'direct', 'id', 'mobile'),
  ('e5910000-0000-4000-8000-0000000000a0', '2026-11-11 05:00+00', 'visit', 'link', 'en', 'tablet'),
  ('e5910000-0000-4000-8000-0000000000a0', '2026-08-01 05:00+00', 'visit', 'direct', 'id', 'mobile');

select ok(
  app.analytics_rollup('2026-11-12 03:00+00') >= 1,
  'Agregasi harian berjalan untuk hari kemarin di zona venue'
);
select results_eq(
  $$ select day::text, metric, key, count from public.analytics_daily
     where venue_id = 'e5910000-0000-4000-8000-0000000000a0' and metric in ('kind', 'source')
     order by day, metric, key $$,
  $$ values ('2026-11-11', 'kind', 'visit', 2), ('2026-11-11', 'source', 'direct', 1),
            ('2026-11-11', 'source', 'link', 1) $$,
  'Hari dihitung di zona venue (17:01 UTC = 00:01 WIB masuk 11 November)'
);
select is(
  (select count(*)::int from public.analytics_events
   where venue_id = 'e5910000-0000-4000-8000-0000000000a0' and occurred_at < '2026-09-01'),
  0,
  'Data mentah lebih dari 90 hari dihapus'
);
select results_eq(
  $$ select day::text, key, count::int from public.analytics_facts(
       'e5910000-0000-4000-8000-0000000000a0', '2026-11-10', '2026-11-11')
     where metric = 'kind' order by day $$,
  $$ values ('2026-11-10', 'visit', 1), ('2026-11-11', 'visit', 2) $$,
  'Dasbor menggabungkan ringkasan harian dan data mentah hari yang belum diringkas tanpa dobel'
);

select * from finish();
rollback;
