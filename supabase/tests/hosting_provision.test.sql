-- T-614b: provisioning ruang kerja trial — satu transaksi, slug unik, batas trial berlaku.
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into app.server_settings (key, value) values ('hosting_mode', 'true');
insert into auth.users (id, email) values
  ('b1000000-0000-4000-8000-000000000001', 'rina@rsuji.co.id'),
  ('b1000000-0000-4000-8000-000000000002', 'budi@rsuji2.co.id'),
  ('b1000000-0000-4000-8000-000000000003', 'sari@rsuji3.co.id');

create function pg_temp.request(p_email text, p_status text default 'active') returns uuid
language sql as $$
  insert into hosting.trial_requests
    (name, institution, title, email, phone, building_type, building_size, language, status)
  values ('Pemohon', 'RS Uji', 'Manajer', p_email, '+62 812 0000 0000', 'hospital', 'lt5k', 'id',
    p_status)
  returning id
$$;

-- Data contoh kecil: `p_buildings` gedung + satu penanda di Area Luar venue demo (id penanda).
create function pg_temp.rows(p_venue uuid, p_buildings integer) returns jsonb
language sql as $$
  select jsonb_build_object(
    'tables', jsonb_build_object(
      'buildings', (select jsonb_agg(jsonb_build_object(
          'id', gen_random_uuid(), 'venue_id', p_venue, 'name', 'Gedung ' || n, 'code', 'G' || n,
          'footprint', null, 'sort_order', n))
        from generate_series(1, p_buildings) n),
      'features', jsonb_build_array(jsonb_build_object(
          'id', gen_random_uuid(), 'venue_id', p_venue,
          'floor_id', '0e000000-0000-4000-8000-0000000000ff', 'kind', 'landmark',
          'geom', jsonb_build_object('type', 'Point', 'coordinates', jsonb_build_array(106.8, -6.2)),
          'name', 'Gerbang', 'unit_code', null, 'unit_status', null, 'height_m', null,
          'color', null, 'facility_type_id', null, 'props', '{}'::jsonb))),
    'buildingDefaults', '[]'::jsonb,
    'defaultBuildingId', null,
    'display', null)
$$;

create function pg_temp.provision(p_request uuid, p_user uuid, p_venue uuid, p_rows jsonb)
returns text
language sql as $$
  select slug from public.hosting_provision_trial(
    p_request, p_user,
    jsonb_build_object('id', p_venue, 'name', 'RS Uji', 'slug', 'rs-uji', 'venueType', 'hospital',
      'timezone', 'Asia/Jakarta',
      'center', jsonb_build_object('type', 'Point', 'coordinates', jsonb_build_array(106.8, -6.2))),
    p_rows, '0e000000-0000-4000-8000-0000000000ff')
$$;

-- ---- Penjaga ----
delete from app.server_settings where key = 'hosting_mode';
select throws_ok(
  $$ select pg_temp.provision(pg_temp.request('a@luar.id'), 'b1000000-0000-4000-8000-000000000001',
       'c1000000-0000-4000-8000-0000000000aa',
       pg_temp.rows('c1000000-0000-4000-8000-0000000000aa', 1)) $$,
  '42501', null, 'Tanpa hosting_mode (on-premise) provisioning ditolak');
insert into app.server_settings (key, value) values ('hosting_mode', 'true');

select throws_ok(
  $$ select pg_temp.provision(pg_temp.request('b@luar.id', 'unverified'),
       'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-0000000000aa',
       pg_temp.rows('c1000000-0000-4000-8000-0000000000aa', 1)) $$,
  '22023', null, 'Permintaan yang belum lolos verifikasi ditolak');

-- ---- Berhasil ----
select is(
  pg_temp.provision(pg_temp.request('rina@rsuji.co.id'), 'b1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-0000000000aa',
    pg_temp.rows('c1000000-0000-4000-8000-0000000000aa', 1)),
  'rs-uji', 'Ruang kerja dibuat dengan slug dari nama instansi');
select is(
  (select venue_type::text from public.venues where id = 'c1000000-0000-4000-8000-0000000000aa'),
  'hospital', 'Venue bertipe sesuai jenis gedung');
select is(
  (select role::text || '/' || all_venues::text from public.profiles
   where user_id = 'b1000000-0000-4000-8000-000000000001'),
  'admin/false', 'Akun pemohon: Admin yang hanya menjangkau venue-nya');
select ok(
  exists (select 1 from public.venue_members
          where venue_id = 'c1000000-0000-4000-8000-0000000000aa'
            and user_id = 'b1000000-0000-4000-8000-000000000001'),
  'Pemohon menjadi anggota venue');
select ok(
  (select t.ends_at between now() + interval '17 days' - interval '1 minute'
                        and now() + interval '17 days' + interval '1 minute'
   from hosting.trials t where t.venue_id = 'c1000000-0000-4000-8000-0000000000aa'),
  'Trial berakhir 17 hari lagi');
select is(
  (select f.is_outdoor from public.features x join public.floors f on f.id = x.floor_id
   where x.venue_id = 'c1000000-0000-4000-8000-0000000000aa' and x.name = 'Gerbang'),
  true, 'Rujukan Area Luar venue demo diganti Area Luar venue baru');
select is(
  (select count(*)::int from public.buildings
   where venue_id = 'c1000000-0000-4000-8000-0000000000aa'),
  1, 'Data contoh tersalin');

-- ---- Sekali per permintaan; slug unik ----
select throws_ok(
  $$ select pg_temp.provision(
       (select id from hosting.trial_requests where email = 'rina@rsuji.co.id'),
       'b1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-0000000000bb',
       pg_temp.rows('c1000000-0000-4000-8000-0000000000bb', 1)) $$,
  '22023', null, 'Permintaan yang sudah punya ruang kerja tidak dibuatkan lagi');
select is(
  pg_temp.provision(pg_temp.request('budi@rsuji2.co.id'), 'b1000000-0000-4000-8000-000000000002',
    'c1000000-0000-4000-8000-0000000000bb',
    pg_temp.rows('c1000000-0000-4000-8000-0000000000bb', 1)),
  'rs-uji-2', 'Nama instansi yang sama mendapat slug berakhiran -2');

-- ---- Batas trial berlaku saat menyalin: semuanya batal ----
select throws_ok(
  $$ select pg_temp.provision(pg_temp.request('sari@rsuji3.co.id'),
       'b1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-0000000000cc',
       pg_temp.rows('c1000000-0000-4000-8000-0000000000cc', 2)) $$,
  'IM422', null, 'Data contoh melebihi batas trial (2 gedung) ditolak');
select is(
  (select count(*)::int from public.venues where id = 'c1000000-0000-4000-8000-0000000000cc'),
  0, 'Satu transaksi: tidak ada venue setengah jadi');

-- ---- Hanya service role ----
set local role authenticated;
select throws_ok(
  $$ select public.hosting_provision_trial(gen_random_uuid(), gen_random_uuid(), '{}'::jsonb,
       '{}'::jsonb, gen_random_uuid()) $$,
  '42501', null, 'Pengguna login tidak bisa membuat ruang kerja');
reset role;

select * from finish();
rollback;
