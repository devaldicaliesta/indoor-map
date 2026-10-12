-- T-614a: permintaan trial ter-hosting — token sekali pakai, blokir, duplikat, kapasitas.
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

create function pg_temp.request(p_email text, p_token text) returns uuid
language sql as $$
  select public.hosting_request_create(
    jsonb_build_object(
      'name', 'Pemohon', 'institution', 'Instansi', 'title', 'Manajer', 'email', p_email,
      'phone', '+62 812 0000 0000', 'buildingType', 'mall', 'buildingSize', 'lt5k',
      'language', 'id'),
    '203.0.113.7', p_token)
$$;

create function pg_temp.outcome(p_token text) returns text
language sql as $$ select outcome from public.hosting_request_verify(p_token) $$;

-- ---- Token ----
select pg_temp.request('Rina@MalContoh.co.id', 'hash-rina');
select is(
  (select email from hosting.trial_requests where token_hash = 'hash-rina'),
  'rina@malcontoh.co.id', 'Email disimpan huruf kecil');
select is(pg_temp.outcome('hash-tidak-ada'), 'invalid', 'Token tidak dikenal ditolak');
select is(pg_temp.outcome('hash-rina'), 'provision', 'Token sah: ruang kerja dibuat');
select is(
  (select status from hosting.trial_requests where email = 'rina@malcontoh.co.id'),
  'active', 'Slot dipesan saat verifikasi (status aktif)');
select is(pg_temp.outcome('hash-rina'), 'invalid', 'Token sekali pakai');

select pg_temp.request('lama@contoh.id', 'hash-lama');
update hosting.trial_requests set token_expires_at = now() - interval '1 minute'
where token_hash = 'hash-lama';
select is(pg_temp.outcome('hash-lama'), 'expired', 'Token lewat 24 jam kedaluwarsa');

-- ---- Duplikat ----
select pg_temp.request('budi@malcontoh.co.id', 'hash-budi');
select is(pg_temp.outcome('hash-budi'), 'rejected',
  'Domain kantor yang sama sudah pernah trial: ditolak');
select is(
  (select reject_reason from hosting.trial_requests where email = 'budi@malcontoh.co.id'),
  'duplicate', 'Alasan penolakan dicatat');

select pg_temp.request('a.satu@gmail.com', 'hash-g1');
select pg_temp.request('b.dua@gmail.com', 'hash-g2');
select is(pg_temp.outcome('hash-g1'), 'provision', 'Alamat gmail pertama boleh');
select is(pg_temp.outcome('hash-g2'), 'provision',
  'Domain umum dihitung per alamat: alamat gmail lain tetap boleh');
select pg_temp.request('a.satu@gmail.com', 'hash-g1-lagi');
select is(pg_temp.outcome('hash-g1-lagi'), 'rejected', 'Alamat yang sama tidak bisa trial lagi');

-- ---- Blokir ----
insert into hosting.blocklist (value, kind) values ('spam.example', 'domain'),
  ('nakal@contoh.org', 'email');
select pg_temp.request('siapa@spam.example', 'hash-spam');
select pg_temp.request('nakal@contoh.org', 'hash-nakal');
select is(pg_temp.outcome('hash-spam'), 'rejected', 'Domain diblokir');
select is(pg_temp.outcome('hash-nakal'), 'rejected', 'Email diblokir');

-- ---- Kapasitas ----
insert into app.server_settings (key, value) values ('trial_capacity', '3');
select pg_temp.request('penuh@instansi-baru.id', 'hash-penuh');
select is(pg_temp.outcome('hash-penuh'), 'queued',
  'Tiga slot terisi (rina, a.satu, b.dua): permintaan berikutnya antre');

-- Ruang kerja gagal dibuat: slot dilepas ke antrean.
select public.hosting_request_requeue(
  (select id from hosting.trial_requests where email = 'b.dua@gmail.com'));
select is(
  (select status from hosting.trial_requests where email = 'b.dua@gmail.com'),
  'queued', 'Gagal provisioning: kembali ke antrean');

-- ---- Hanya service role ----
set local role authenticated;
select throws_ok($$ select public.hosting_request_verify('x') $$, '42501', null,
  'Pengguna login tidak bisa memanggil keputusan verifikasi');
reset role;

select * from finish();
rollback;
