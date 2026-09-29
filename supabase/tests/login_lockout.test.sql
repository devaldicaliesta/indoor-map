-- Penguncian login lewat Auth Hook (T-008, NFR-SEC-02).
begin;
create extension if not exists pgtap with schema extensions;

select plan(13);

insert into auth.users (id, email) values
  ('d0000000-0000-4000-8000-000000000001', 'kunci@login.test'),
  ('d0000000-0000-4000-8000-000000000002', 'nonaktif@login.test');
insert into public.profiles (user_id, full_name, email, role, is_active) values
  ('d0000000-0000-4000-8000-000000000001', 'Uji Kunci', 'kunci@login.test', 'editor', true),
  ('d0000000-0000-4000-8000-000000000002', 'Uji Nonaktif', 'nonaktif@login.test', 'viewer', false);

create function pg_temp.attempt(p_user uuid, p_valid boolean) returns jsonb
language sql as $$
  select app.hook_password_verification_attempt(
    jsonb_build_object('user_id', p_user, 'valid', p_valid)
  )
$$;

-- Hanya GoTrue (supabase_auth_admin) yang boleh memanggil hook.
set local role authenticated;
select throws_ok(
  $$ select app.hook_password_verification_attempt('{"user_id": "d0000000-0000-4000-8000-000000000001", "valid": false}') $$,
  '42501',
  null,
  'Pengguna login tidak bisa memanggil hook (penghitung tidak bisa diubah klien)'
);
reset role;
set local role anon;
select throws_ok(
  $$ select app.hook_password_verification_attempt('{"user_id": "d0000000-0000-4000-8000-000000000001", "valid": false}') $$,
  '42501',
  null,
  'anon tidak bisa memanggil hook'
);
reset role;

select ok(
  has_function_privilege('supabase_auth_admin', 'app.hook_password_verification_attempt(jsonb)', 'execute'),
  'GoTrue (supabase_auth_admin) boleh memanggil hook'
);

-- Perilaku hook diuji sebagai pemilik fungsi (postgres tidak bisa berganti ke supabase_auth_admin).
select is(
  pg_temp.attempt('d0000000-0000-4000-8000-000000000001', false) ->> 'decision',
  'continue',
  'Password salah: GoTrue tetap yang menolak dengan pesan umum'
);
select pg_temp.attempt('d0000000-0000-4000-8000-000000000001', false) from generate_series(2, 4);
select is(
  (select locked_until from public.profiles where email = 'kunci@login.test'),
  null,
  '4 kali gagal belum mengunci'
);

select pg_temp.attempt('d0000000-0000-4000-8000-000000000001', false);
select ok(
  (select locked_until between now() + interval '14 minutes' and now() + interval '16 minutes'
   from public.profiles where email = 'kunci@login.test'),
  'Gagal ke-5 mengunci akun 15 menit'
);

select is(
  pg_temp.attempt('d0000000-0000-4000-8000-000000000001', true) ->> 'decision',
  'reject',
  'Percobaan ke-6 dengan password benar tetap ditolak selama terkunci'
);
select is(
  pg_temp.attempt('d0000000-0000-4000-8000-000000000001', true) ->> 'message',
  'Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.',
  'Pesan akun terkunci'
);

-- Kunci kedaluwarsa: login benar diterima dan penghitung kembali 0.
update public.profiles set locked_until = now() - interval '1 second' where email = 'kunci@login.test';
select is(
  pg_temp.attempt('d0000000-0000-4000-8000-000000000001', true) ->> 'decision',
  'continue',
  'Setelah 15 menit login benar diterima'
);
select results_eq(
  $$ select failed_login_count, locked_until from public.profiles where email = 'kunci@login.test' $$,
  $$ values (0, null::timestamptz) $$,
  'Login berhasil mengosongkan penghitung dan kunci'
);

select is(
  pg_temp.attempt('d0000000-0000-4000-8000-000000000002', true) ->> 'message',
  'Akun Anda dinonaktifkan. Hubungi Super Admin.',
  'Pengguna nonaktif ditolak dengan pesan jelas'
);

select is(
  (select count(*)::int from public.audit_events
   where user_id = 'd0000000-0000-4000-8000-000000000001' and action = 'login_failed'),
  7,
  'Setiap gagal login dicatat (5 password salah + 2 saat terkunci)'
);
select is(
  (select count(*)::int from public.audit_events
   where user_id = 'd0000000-0000-4000-8000-000000000001' and action = 'login'),
  1,
  'Login berhasil dicatat'
);

select * from finish();
rollback;
