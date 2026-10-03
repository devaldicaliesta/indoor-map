-- Catatan rilis dan rollback (T-310).
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email) values
  ('e3100000-0000-4000-8000-000000000001', 'ad@history.test'),
  ('e3100000-0000-4000-8000-000000000002', 'ed@history.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e3100000-0000-4000-8000-000000000001', 'AD', 'ad@history.test', 'admin'),
  ('e3100000-0000-4000-8000-000000000002', 'ED', 'ed@history.test', 'editor');
insert into public.venues (id, name) values
  ('a3100000-0000-4000-8000-00000000000a', 'Venue Uji Riwayat');

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

create function pg_temp.publish(p_notes text default null, p_source integer default null)
returns integer
language plpgsql as $$
declare
  v_row record;
begin
  select * into v_row
  from public.publish_begin('a3100000-0000-4000-8000-00000000000a', p_notes, p_source);
  perform public.publish_commit(v_row.publication_id);
  return v_row.version;
end
$$;

set local role authenticated;
select pg_temp.as_user('e3100000-0000-4000-8000-000000000001');

select is(pg_temp.publish('  Rilis awal  '), 1, 'Versi 1 terbit');
select is(pg_temp.publish(''), 2, 'Versi 2 terbit tanpa catatan');
select results_eq(
  $$ select version, notes, origin::text, source_version from public.publications
     where venue_id = 'a3100000-0000-4000-8000-00000000000a' order by version $$,
  $$ values (1, 'Rilis awal', 'publish', null::int), (2, null, 'publish', null) $$,
  'Catatan dirapikan; catatan kosong disimpan null'
);

select throws_ok(
  $$ select * from public.publish_begin('a3100000-0000-4000-8000-00000000000a', repeat('x', 501)) $$,
  '22023', 'Catatan rilis paling banyak 500 karakter.', 'Catatan terlalu panjang ditolak'
);
select throws_ok(
  $$ select * from public.publish_begin('a3100000-0000-4000-8000-00000000000a', null, 2) $$,
  'P0002', 'Versi 2 tidak bisa diaktifkan kembali.', 'Versi yang sedang aktif tidak bisa di-rollback'
);
select throws_ok(
  $$ select * from public.publish_begin('a3100000-0000-4000-8000-00000000000a', null, 7) $$,
  'P0002', null, 'Versi yang tidak ada tidak bisa di-rollback'
);

-- Editor tidak bisa rollback
select pg_temp.as_user('e3100000-0000-4000-8000-000000000002');
select throws_ok(
  $$ select * from public.publish_begin('a3100000-0000-4000-8000-00000000000a', null, 1) $$,
  '42501', null, 'Editor ditolak saat rollback'
);

select pg_temp.as_user('e3100000-0000-4000-8000-000000000001');
select is(pg_temp.publish('Kembali ke v1', 1), 3, 'Rollback ke v1 membuat versi 3');
select results_eq(
  $$ select version, is_active, origin::text, source_version, notes from public.publications
     where venue_id = 'a3100000-0000-4000-8000-00000000000a' order by version $$,
  $$ values (1, false, 'publish', null::int, 'Rilis awal'),
            (2, false, 'publish', null, null),
            (3, true, 'rollback', 1, 'Kembali ke v1') $$,
  'Versi rollback aktif dan mencatat versi sumbernya'
);

reset role;
select results_eq(
  $$ select action, details->>'version', details->>'source_version' from public.audit_events
     where entity_id = 'a3100000-0000-4000-8000-00000000000a' order by (details->>'version')::int $$,
  $$ values ('publish', '1', null::text), ('publish', '2', null), ('rollback', '3', '1') $$,
  'Publish dan rollback tercatat di catatan peristiwa'
);
set local role authenticated;
select pg_temp.as_user('e3100000-0000-4000-8000-000000000001');

select is(pg_temp.publish(null, 2), 4, 'Rollback ke versi lain yang lebih lama juga bisa');
select is(
  (select count(*)::int from public.publications
   where venue_id = 'a3100000-0000-4000-8000-00000000000a' and is_active),
  1,
  'Selalu tepat satu versi aktif'
);

select * from finish();
rollback;
