-- API integrasi dan webhook (T-593): kunci API per sistem dengan scope, upsert massal per kode,
-- penutupan lewat API, outbox webhook, dan jadwal coba ulang. TC-OPS-09, TC-OPS-11, TC-SEC-71.
begin;
create extension if not exists pgtap with schema extensions;

select plan(40);

insert into auth.users (id, email) values
  ('e5930000-0000-4000-8000-000000000001', 'sa@api.test'),
  ('e5930000-0000-4000-8000-000000000002', 'ad@api.test'),
  ('e5930000-0000-4000-8000-000000000003', 'ed@api.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e5930000-0000-4000-8000-000000000001', 'SA', 'sa@api.test', 'super_admin'),
  ('e5930000-0000-4000-8000-000000000002', 'AD', 'ad@api.test', 'admin'),
  ('e5930000-0000-4000-8000-000000000003', 'ED', 'ed@api.test', 'editor');

create function pg_temp.as_user(p_id text) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

insert into public.venues (id, name) values
  ('a5930000-0000-4000-8000-00000000000a', 'Venue API'),
  ('a5930000-0000-4000-8000-00000000000b', 'Venue API Lain');
insert into public.buildings (id, venue_id, name, code) values
  ('b5931000-0000-4000-8000-000000000001', 'a5930000-0000-4000-8000-00000000000a', 'Gedung', 'G');
insert into public.floors (id, venue_id, building_id, name, level) values
  ('c5930000-0000-4000-8000-000000000001', 'a5930000-0000-4000-8000-00000000000a',
   'b5931000-0000-4000-8000-000000000001', 'L1', 1);
insert into public.location_types (id, venue_id, name) values
  ('b5930000-0000-4000-8000-000000000001', 'a5930000-0000-4000-8000-00000000000a', 'Poli');
insert into public.categories (location_type_id, name) values
  ('b5930000-0000-4000-8000-000000000001', 'Umum');
insert into public.features (id, venue_id, floor_id, kind, geom, unit_code, unit_status) values
  ('e5931000-0000-4000-8000-000000000001', 'a5930000-0000-4000-8000-00000000000a',
   'c5930000-0000-4000-8000-000000000001', 'unit',
   'SRID=4326;POLYGON((106.8 -6.1, 106.8001 -6.1, 106.8001 -6.1001, 106.8 -6.1))', 'R-01', 'occupied');
insert into public.locations (id, venue_id, location_type_id, name, code) values
  ('f5930000-0000-4000-8000-000000000001', 'a5930000-0000-4000-8000-00000000000a',
   'b5930000-0000-4000-8000-000000000001', 'Radiologi', 'RAD-01');
insert into public.location_units (location_id, feature_id, is_primary) values
  ('f5930000-0000-4000-8000-000000000001', 'e5931000-0000-4000-8000-000000000001', true);

-- ---------------------------------------------------------------------------------------------
-- TC-SEC-71: kunci API hanya dikelola Super Admin (level D: database)
-- ---------------------------------------------------------------------------------------------
set local role authenticated;
select pg_temp.as_user('e5930000-0000-4000-8000-000000000002');
select throws_ok($$ select public.create_api_key('SIMRS', array['locations:read'], null) $$,
  '42501', null, 'TC-SEC-71: Admin tidak bisa membuat kunci API');
select pg_temp.as_user('e5930000-0000-4000-8000-000000000003');
select throws_ok($$ select public.create_webhook('Hook', 'https://x.test/h', array['publish'], null) $$,
  '42501', null, 'TC-SEC-71: Editor tidak bisa membuat webhook');

select pg_temp.as_user('e5930000-0000-4000-8000-000000000001');
create temp table k on commit drop as
select public.create_api_key('SIMRS baca', array['locations:read'], null) as ro,
  public.create_api_key('SIMRS tulis', array['locations:read', 'locations:write', 'closures:write'],
    array['a5930000-0000-4000-8000-00000000000a']::uuid[]) as rw;
grant select on k to service_role;
select ok((select ro ->> 'key' ~ '^pa_[0-9a-f]{48}$' from k), 'kunci API berformat pa_ + 48 hex');
select is((select count(*) from public.api_keys)::int, 2, 'Super Admin melihat kunci API');
select throws_ok($$ select key_hash from public.api_keys $$, '42501', null,
  'hash kunci tidak bisa dibaca klien');
select throws_ok($$ select public.create_api_key('X', array['venues:delete'], null) $$,
  'IM422', null, 'scope yang tidak dikenal ditolak');
select is((select count(*) from public.audit_events where action = 'api_key_created')::int, 2,
  'pembuatan kunci tercatat di audit');

select pg_temp.as_user('e5930000-0000-4000-8000-000000000002');
select is((select count(*) from public.api_keys)::int, 0, 'TC-SEC-71: Admin tidak melihat kunci API');
select throws_ok($$ select public.revoke_api_key((select id from public.api_keys limit 1)) $$,
  '42501', null, 'TC-SEC-71: Admin tidak bisa mencabut kunci');
select throws_ok($$ select public.api_authenticate('pa_x') $$, '42501', null,
  'fungsi API hanya untuk Edge Function (service role)');
select throws_ok($$ select public.webhook_claim(10) $$, '42501', null,
  'pengirim webhook hanya untuk service role');

-- ---------------------------------------------------------------------------------------------
-- TC-OPS-09: scope dan venue kunci ditegakkan server
-- ---------------------------------------------------------------------------------------------
reset role;
set local role service_role;
select is((select public.api_authenticate(ro ->> 'key') ->> 'name' from k), 'SIMRS baca',
  'kunci yang sah dikenali');
select is(public.api_authenticate('pa_salah'), null, 'kunci yang salah tidak dikenali');
select throws_ok(format($$ select public.api_upsert_locations(%L, 'a5930000-0000-4000-8000-00000000000a',
  '[{"code":"RAD-01","status":"inactive_temporary"}]') $$, (select (ro ->> 'id') from k)),
  '42501', null, 'TC-OPS-09: kunci baca-saja yang menulis ditolak');
select is((select status::text from public.locations where code = 'RAD-01'), 'active',
  'lokasi tidak berubah setelah penolakan');
select throws_ok(format($$ select public.api_locations(%L, 'a5930000-0000-4000-8000-00000000000b') $$,
  (select (rw ->> 'id') from k)), 'IM404', null, 'venue di luar jangkauan kunci dianggap tidak ada');
select is(jsonb_array_length(public.api_venues((select (rw ->> 'id')::uuid from k))), 1,
  'kunci terbatas hanya melihat venue-nya');

-- ---------------------------------------------------------------------------------------------
-- Upsert massal per kode
-- ---------------------------------------------------------------------------------------------
create temp table r on commit drop as
select public.api_upsert_locations((select (rw ->> 'id')::uuid from k),
  'a5930000-0000-4000-8000-00000000000a', '[
    {"code":"RAD-01","weekly_hours":[
      {"weekday":1,"special_date":null,"opens_at":"08:00","closes_at":"12:00","is_closed":false},
      {"weekday":1,"special_date":null,"opens_at":"13:00","closes_at":"16:00","is_closed":false}],
     "special_hours":[{"weekday":null,"special_date":"2026-12-25","opens_at":null,"closes_at":null,"is_closed":true}]},
    {"code":"POLI-02","name":"Poli Gigi","type":"poli","categories":["umum"]}
  ]'::jsonb) as result;
select is((select jsonb_path_query_array(result, '$.locations[*].action') from r),
  '["updated", "created"]'::jsonb, 'baris lama diubah, kode baru dibuat');
select is((select count(*) from public.opening_hours
  where location_id = 'f5930000-0000-4000-8000-000000000001')::int, 3, 'jam mingguan dan tanggal khusus tersimpan');
select is((select public.api_locations((select (rw ->> 'id')::uuid from k),
  'a5930000-0000-4000-8000-00000000000a', 'rad-01') -> 0 -> 'hours' -> 'weekly' -> 'mon'),
  '["08:00-12:00", "13:00-16:00"]'::jsonb, 'jam terbaca kembali dalam format API');
select is((select public.api_locations((select (rw ->> 'id')::uuid from k),
  'a5930000-0000-4000-8000-00000000000a', 'POLI-02') -> 0 -> 'categories'), '["Umum"]'::jsonb,
  'tipe dan kategori dicocokkan dengan nama tanpa membedakan huruf besar');
select is((select public.api_upsert_locations((select (rw ->> 'id')::uuid from k),
  'a5930000-0000-4000-8000-00000000000a', '[{"code":"POLI-02","name":"Poli Gigi"}]')
  -> 'locations' -> 0 ->> 'action'), 'unchanged', 'kiriman yang sama dilaporkan unchanged');
select throws_ok(format($$ select public.api_upsert_locations(%L, 'a5930000-0000-4000-8000-00000000000a',
  '[{"code":"RAD-01","status":"inactive_temporary"},{"code":"BARU","name":"X","type":"Tidak Ada"}]') $$,
  (select (rw ->> 'id') from k)), 'IM422', null, 'satu baris salah membatalkan semua');
select is((select status::text from public.locations where code = 'RAD-01'), 'active',
  'tidak ada perubahan sebagian');
select is((select count(*) from public.audit_events where action = 'api_locations_upserted')::int, 2,
  'upsert lewat API tercatat di audit dengan nama kunci');

-- Penutupan lewat API: kode lokasi menutup semua unitnya.
create temp table c on commit drop as
select public.api_create_closures((select (rw ->> 'id')::uuid from k),
  'a5930000-0000-4000-8000-00000000000a',
  '{"location_code":"rad-01","unit_code":null,"reason":"Perawatan alat","starts_at":null,"ends_at":null}') as created;
select is((select created -> 0 -> 'locationCodes' from c), '["RAD-01"]'::jsonb,
  'penutupan dibuat untuk unit lokasi');
select throws_ok(format($$ select public.api_create_closures(%L, 'a5930000-0000-4000-8000-00000000000a',
  '{"location_code":"POLI-02","reason":"x"}') $$, (select (rw ->> 'id') from k)), 'IM422', null,
  'lokasi tanpa unit tidak bisa ditutup');
select throws_ok(format($$ select public.api_closures(%L, 'a5930000-0000-4000-8000-00000000000a') $$,
  (select (rw ->> 'id') from k)), '42501', null, 'tanpa closures:read daftar penutupan ditolak');
select is((select public.api_end_closure((select (rw ->> 'id')::uuid from k),
  'a5930000-0000-4000-8000-00000000000a', (select (created -> 0 ->> 'id')::uuid from c)) ->> 'ended'),
  'true', 'penutupan yang berjalan diakhiri');

-- Kunci dicabut: langsung tidak berlaku.
reset role;
set local role authenticated;
select pg_temp.as_user('e5930000-0000-4000-8000-000000000001');
select lives_ok(format($$ select public.revoke_api_key(%L) $$, (select (rw ->> 'id') from k)),
  'Super Admin mencabut kunci');
reset role;
set local role service_role;
select is((select public.api_authenticate(rw ->> 'key') from k), null,
  'TC-OPS-09: kunci yang dicabut tidak dikenali');
select throws_ok(format($$ select public.api_locations(%L, 'a5930000-0000-4000-8000-00000000000a') $$,
  (select (rw ->> 'id') from k)), '28000', null, 'kunci dicabut ditolak juga di fungsi API');

-- ---------------------------------------------------------------------------------------------
-- Webhook: outbox per transaksi menjadi pengiriman saat commit
-- ---------------------------------------------------------------------------------------------
reset role;
set local role authenticated;
select pg_temp.as_user('e5930000-0000-4000-8000-000000000001');
create temp table h on commit drop as
select public.create_webhook('SIMRS', 'https://simrs.test/hook', array['location', 'closure', 'publish'],
  array['a5930000-0000-4000-8000-00000000000a']::uuid[]) as hook;
select ok((select hook ->> 'secret' like 'whsec_%' from h), 'rahasia webhook dikembalikan sekali');
select throws_ok($$ select secret from public.webhooks $$, '42501', null,
  'rahasia webhook tidak bisa dibaca klien');
reset role;

set constraints all immediate;
set constraints all deferred;
delete from public.webhook_deliveries;
update public.locations set name = name || ' Baru' where venue_id = 'a5930000-0000-4000-8000-00000000000a';
insert into public.opening_hours (location_id, weekday, opens_at, closes_at)
values ('f5930000-0000-4000-8000-000000000001', 2, '08:00', '16:00');
insert into public.closures (venue_id, feature_id, reason)
values ('a5930000-0000-4000-8000-00000000000a', 'e5931000-0000-4000-8000-000000000001', 'Banjir');
insert into public.publications (venue_id, version, snapshot_path)
values ('a5930000-0000-4000-8000-00000000000a', 1, 'x/1.json');
update public.locations set name = 'Lain' where venue_id = 'a5930000-0000-4000-8000-00000000000b';
set constraints all immediate;
select is((select array_agg(event order by event) from public.webhook_deliveries),
  array['closure.created', 'location.changed', 'publish.completed'],
  'TC-OPS-11: publish, penutupan, dan lokasi menjadi satu pengiriman masing-masing');
select is((select (payload -> 'data' ->> 'count')::int from public.webhook_deliveries
  where event = 'location.changed'), 2, 'perubahan lokasi satu transaksi digabung per lokasi');
select is((select payload -> 'data' -> 'closure' -> 'locationCodes' from public.webhook_deliveries
  where event = 'closure.created'), '["RAD-01"]'::jsonb, 'isi penutupan membawa kode lokasi');

-- Jadwal coba ulang: 500 → retrying +1 menit, ..., percobaan ke-6 gagal → failed.
update public.webhook_deliveries set status = 'sending', attempts = 1 where event = 'publish.completed';
set local role service_role;
select public.webhook_record((select id from public.webhook_deliveries where event = 'publish.completed'),
  500, 'Penerima membalas 500', 12);
reset role;
select ok((select status = 'retrying' and next_attempt_at between now() + interval '59 seconds'
  and now() + interval '61 seconds' and response_status = 500
  from public.webhook_deliveries where event = 'publish.completed'),
  'TC-OPS-11: balasan 500 dicoba ulang 1 menit kemudian');
update public.webhook_deliveries set status = 'sending', attempts = 6 where event = 'publish.completed';
set local role service_role;
select public.webhook_record((select id from public.webhook_deliveries where event = 'publish.completed'),
  503, null, 5);
select public.webhook_record((select id from public.webhook_deliveries where event = 'closure.created'),
  200, null, 5);
reset role;
select is((select status from public.webhook_deliveries where event = 'publish.completed'), 'failed',
  'setelah 6 percobaan pengiriman ditandai gagal');
select is((select status from public.webhook_deliveries where event = 'closure.created'), 'pending',
  'hasil hanya dicatat untuk pengiriman yang sedang dikirim');

select * from finish();
rollback;
