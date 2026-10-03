-- Check-in lisensi, pencabutan, proteksi jam (T-403).
begin;
create extension if not exists pgtap with schema extensions;

select plan(44);

insert into auth.users (id, email) values
  ('e4030000-0000-4000-8000-000000000001', 'ad@checkin.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e4030000-0000-4000-8000-000000000001', 'AD', 'ad@checkin.test', 'admin');

create function pg_temp.as_admin() returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', 'e4030000-0000-4000-8000-000000000001', 'role', 'authenticated')::text, true)
$$;

-- Payload lisensi uji; masa berlaku 2020–2099.
create function pg_temp.payload(p_id text, p_issued text) returns jsonb
language sql as $$
  select jsonb_build_object('licenseId', p_id, 'validFrom', '2020-01-01T00:00:00Z',
    'validUntil', '2099-01-01T00:00:00Z', 'issuedAt', p_issued)
$$;

create function pg_temp.install(p_id text, p_issued text, p_signature text)
returns void
language sql as $$
  update public.licenses set is_current = false where is_current;
  insert into public.licenses (license_id, payload, signature, status, source)
  values (p_id, pg_temp.payload(p_id, p_issued), p_signature, 'active', 'manual');
$$;

create function pg_temp.requests() returns integer
language sql as $$ select count(*)::int from net.http_request_queue $$;

create function pg_temp.current() returns public.licenses
language sql as $$ select * from public.licenses where is_current $$;

select pg_temp.install('LIC-CEK', '2026-01-01T00:00:00Z', 'tanda-tangan-1');

-- Jadwal
select is(
  (select schedule from cron.job where jobname = 'license-checkin'),
  '7 * * * *',
  'Check-in dijadwalkan pg_cron tiap jam'
);

-- Proteksi jam
update public.installation set last_seen_at = now() + interval '3 days';
select is(app.license_active(), false, 'Jam mundur lebih dari 24 jam: lisensi tidak berlaku');
select is((select state from public.license_status()), 'clock_behind', 'Status clock_behind');
set local role authenticated;
select pg_temp.as_admin();
select throws_ok(
  $$ insert into public.venues (name) values ('Venue Jam Mundur') $$,
  '42501', null, 'Admin ditolak menulis saat jam mundur'
);
reset role;
update public.installation set last_seen_at = now() + interval '12 hours';
select is(app.license_active(), true, 'Mundur kurang dari 24 jam masih ditoleransi');
select is((select state from public.license_status()), 'active', 'Status active dalam toleransi');

-- Tick: waktu terbesar yang terlihat dan permintaan check-in
update public.installation
set last_seen_at = now() - interval '1 day', last_checkin_at = null, checkin_requested_at = null;
create temp table baseline as select pg_temp.requests() as requests;
select app.license_tick();
select is((select last_seen_at from public.installation), now(), 'Tick mencatat jam server');
select is((select checkin_requested_at from public.installation), now(),
  'Belum pernah check-in: check-in diminta');
select is(pg_temp.requests(), (select requests + 1 from baseline), 'Tick memanggil Edge Function lewat pg_net');

update public.installation
set last_checkin_at = now() - interval '1 hour', checkin_requested_at = null;
select app.license_tick();
select is((select checkin_requested_at from public.installation), null,
  'Check-in berhasil sejam lalu: belum jatuh tempo');
select is(pg_temp.requests(), (select requests + 1 from baseline), 'Tanpa panggilan ke Edge Function');

update public.installation set last_checkin_at = now() - interval '23 hours';
select app.license_tick();
select is((select checkin_requested_at from public.installation), now(),
  '23 jam sejak check-in berhasil: jatuh tempo');

update public.installation
set last_checkin_at = now() - interval '1 hour', checkin_requested_at = null,
    last_seen_at = now() + interval '3 days';
select app.license_tick();
select is((select last_seen_at from public.installation), now() + interval '3 days',
  'Jam mundur tidak menurunkan waktu terbesar yang terlihat');
select is((select checkin_requested_at from public.installation), now(),
  'Lisensi tidak berlaku karena jam: check-in dicoba lagi tiap jam');

-- Klaim permintaan
update public.installation
set checkin_requested_at = null, last_seen_at = now(), last_checkin_at = null;
select is_empty('select * from public.license_checkin_claim(false)',
  'Tanpa permintaan dari database, panggilan tanpa Super Admin diabaikan');
update public.installation set checkin_requested_at = now() - interval '11 minutes';
select is_empty('select * from public.license_checkin_claim(false)',
  'Permintaan yang sudah basi diabaikan');
update public.installation set checkin_requested_at = now();
select results_eq(
  'select license_id, instance_id from public.license_checkin_claim(false)',
  $$ select 'LIC-CEK'::text, instance_id from public.installation $$,
  'Permintaan terjadwal diambil sekali: lisensi dan instance yang diperiksa'
);
select is_empty('select * from public.license_checkin_claim(false)', 'Permintaan tidak bisa diambil dua kali');
select isnt_empty('select * from public.license_checkin_claim(true)', 'Super Admin bisa memeriksa kapan saja');

-- Vendor menjawab: perpanjangan
select is(
  public.license_checkin_confirmed('LIC-CEK', now(),
    pg_temp.payload('LIC-CEK', '2026-06-01T00:00:00Z'), 'tanda-tangan-2'),
  'renewed',
  'Berkas yang lebih baru dipasang'
);
select results_eq(
  $$ select signature, status::text, source::text from public.licenses where is_current $$,
  $$ values ('tanda-tangan-2', 'active', 'checkin') $$,
  'Lisensi baru berlaku dengan sumber check-in'
);
select is(
  (select count(*)::int from public.audit_events
   where action = 'license_changed' and details->>'license_id' = 'LIC-CEK'),
  1,
  'Perpanjangan tercatat di catatan peristiwa'
);
select is((select last_checkin_at from public.installation), now(), 'Waktu check-in berhasil dicatat');
select is(
  public.license_checkin_confirmed('LIC-CEK', now(),
    pg_temp.payload('LIC-CEK', '2026-06-01T00:00:00Z'), 'tanda-tangan-2'),
  'unchanged',
  'Berkas yang sama tidak dipasang ulang'
);
select is(
  public.license_checkin_confirmed('LIC-CEK', now(),
    pg_temp.payload('LIC-CEK', '2026-01-01T00:00:00Z'), 'tanda-tangan-1'),
  'unchanged',
  'Berkas lama tidak bisa diputar ulang'
);
select is(
  public.license_checkin_confirmed('LIC-LAIN', now(),
    pg_temp.payload('LIC-LAIN', '2026-09-01T00:00:00Z'), 'tanda-tangan-3'),
  'unchanged',
  'Jawaban untuk lisensi yang tidak lagi berlaku diabaikan'
);
select is((pg_temp.current()).signature, 'tanda-tangan-2', 'Lisensi berlaku tetap yang terbaru');

-- Waktu vendor
select public.license_checkin_confirmed('LIC-CEK', now() + interval '3 days');
select is((select last_seen_at from public.installation), now() + interval '3 days',
  'Waktu vendor lebih maju dari jam server dicatat');
select is((select state from public.license_status()), 'clock_behind',
  'Jam server tertinggal dari vendor: lisensi tidak berlaku');
select public.license_checkin_confirmed('LIC-CEK', now());
select is((select state from public.license_status()), 'active',
  'Jam server sesuai waktu vendor lagi: lisensi pulih');
select public.license_checkin_confirmed('LIC-CEK', now() - interval '3 days');
select is((select last_seen_at from public.installation), now() - interval '3 days',
  'Jam server yang jauh lebih cepat dari vendor tidak dicatat');

-- Gagal
update public.installation set last_checkin_at = now() - interval '2 days';
select is(public.license_checkin_failed('Server vendor tidak bisa dihubungi.'), 'failed', 'Gagal dicatat');
select results_eq(
  'select checkin_error, last_checkin_at from public.installation',
  $$ values ('Server vendor tidak bisa dihubungi.', now() - interval '2 days') $$,
  'Alasan disimpan; check-in berhasil terakhir tidak berubah'
);
select is(app.license_active(), true, 'Check-in gagal tidak mematikan sistem');

-- Pencabutan
select is(public.license_checkin_revoked('LIC-CEK', now()), 'revoked', 'Pencabutan dicatat');
select is((select state from public.license_status()), 'revoked', 'Dicabut: langsung tidak berlaku');
select is(app.license_active(), false, 'Dicabut: tulis ditolak tanpa masa tenggang');
select is((select checkin_error from public.installation), null, 'Vendor terjangkau: alasan gagal dihapus');
select public.license_checkin_confirmed('LIC-CEK', now(),
  pg_temp.payload('LIC-CEK', '2026-06-01T00:00:00Z'), 'tanda-tangan-2');
select is((pg_temp.current()).status::text, 'revoked', 'Berkas yang sama tidak memulihkan pencabutan');
select public.license_checkin_confirmed('LIC-CEK', now(),
  pg_temp.payload('LIC-CEK', '2026-09-01T00:00:00Z'), 'tanda-tangan-3');
select is((select state from public.license_status()), 'active', 'Berkas baru dari vendor memulihkan lisensi');

-- Banner 7 hari
update public.installation set last_checkin_at = now() - interval '8 days';
set local role authenticated;
select pg_temp.as_admin();
select is(public.license_checkin_overdue_since(), now() - interval '8 days',
  'Tanpa check-in berhasil 8 hari: banner');
reset role;
update public.installation set last_checkin_at = now() - interval '6 days';
set local role authenticated;
select pg_temp.as_admin();
select is(public.license_checkin_overdue_since(), null, '6 hari: belum ada banner');
reset role;
update public.installation set last_checkin_at = null;
update public.licenses set activated_at = now() - interval '8 days' where is_current;
set local role authenticated;
select pg_temp.as_admin();
select is(public.license_checkin_overdue_since(), now() - interval '8 days',
  'Belum pernah check-in sejak lisensi dipasang 8 hari lalu: banner');
reset role;

-- Hak eksekusi
select ok(
  not has_function_privilege('anon', 'public.license_checkin_overdue_since()', 'execute')
  and not has_function_privilege('authenticated', 'public.license_checkin_claim(boolean)', 'execute')
  and not has_function_privilege('authenticated',
    'public.license_checkin_confirmed(text, timestamptz, jsonb, text)', 'execute')
  and not has_function_privilege('authenticated', 'public.license_checkin_revoked(text, timestamptz)', 'execute')
  and not has_function_privilege('authenticated', 'public.license_checkin_failed(text)', 'execute')
  and not has_function_privilege('authenticated', 'app.license_tick()', 'execute')
  and not has_function_privilege('anon', 'app.license_tick()', 'execute'),
  'Pencatatan check-in hanya untuk service role dan jadwal database'
);

select * from finish();
rollback;
