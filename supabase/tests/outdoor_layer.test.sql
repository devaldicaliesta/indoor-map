-- Area Luar selalu ada; hanya terhapus bersama venue (T-102, migrasi 0006).
begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

insert into public.venues (id, name) values ('e5000000-0000-4000-8000-000000000001', 'Venue Uji Area Luar');

select throws_ok(
  $$ delete from public.floors where venue_id = 'e5000000-0000-4000-8000-000000000001' and is_outdoor $$,
  'IM409', null, 'Area Luar tidak bisa dihapus selama venue ada'
);
select lives_ok(
  $$ delete from public.venues where id = 'e5000000-0000-4000-8000-000000000001' $$,
  'Hapus venue tetap bisa (Area Luar ikut terhapus)'
);
select is(
  (select count(*)::int from public.floors where venue_id = 'e5000000-0000-4000-8000-000000000001'),
  0, 'Tidak ada lantai tersisa setelah venue dihapus'
);

select * from finish();
rollback;
