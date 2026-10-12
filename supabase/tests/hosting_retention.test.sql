-- T-616: isian form trial tidak disimpan lebih dari 12 bulan (kebijakan privasi landing).
begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

insert into hosting.trial_requests
  (email, status, created_at, name, institution, title, phone, building_type, building_size,
   language)
select v.email, v.status, v.created_at, 'N', 'I', 'J', '+62 812 0000 0000', 'office', 'lt5k', 'id'
from (values
  ('lama-dihapus@simpan.id', 'deleted', now() - interval '13 months'),
  ('lama-ditolak@simpan.id', 'rejected', now() - interval '13 months'),
  ('lama-belum@simpan.id', 'unverified', now() - interval '13 months'),
  ('lama-aktif@simpan.id', 'active', now() - interval '13 months'),
  ('baru-dihapus@simpan.id', 'deleted', now() - interval '11 months')
) as v(email, status, created_at);

select is(public.hosting_lifecycle_forget(), 3,
  'Permintaan selesai yang lebih dari 12 bulan dilupakan');
select is(
  (select count(*)::int from hosting.trial_requests where email like 'lama-%@simpan.id'), 1,
  'Permintaan yang masih punya ruang kerja tidak disentuh');
select is(
  (select count(*)::int from hosting.trial_requests where email = 'baru-dihapus@simpan.id'), 1,
  'Permintaan di bawah 12 bulan tetap disimpan');

set local role authenticated;
select throws_ok($$ select public.hosting_lifecycle_forget() $$, '42501', null,
  'Hanya service role');
reset role;

select * from finish();
rollback;
