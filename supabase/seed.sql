-- =====================================================================
-- seed.sql — data lokal untuk pengembangan dan pengujian
-- Jalankan lewat `pnpm db:reset` agar SEED_ADMIN_PASSWORD dari .env.local
-- diteruskan sebagai setting `seed.admin_password`. Tanpa password,
-- Super Admin tidak dibuat, tetapi venue contoh tetap dibuat.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Super Admin lokal: admin@local.test
-- ---------------------------------------------------------------------
do $$
declare
  v_password text := nullif(current_setting('seed.admin_password', true), '');
  v_user_id constant uuid := '00000000-0000-4000-8000-000000000001';
  v_email constant text := 'admin@local.test';
begin
  if v_password is null then
    raise warning 'seed.admin_password kosong: Super Admin lokal tidak dibuat. Jalankan `pnpm db:reset`.';
    return;
  end if;

  -- Kolom token diisi '' karena GoTrue gagal membaca NULL saat login.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    v_email, extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{"full_name": "Super Admin Lokal"}',
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id, v_user_id::text, 'email',
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    now(), now(), now()
  );

  insert into public.profiles (user_id, full_name, email, role)
  values (v_user_id, 'Super Admin Lokal', v_email, 'super_admin');
end
$$;

-- ---------------------------------------------------------------------
-- Venue Contoh: satu gedung, dua lantai.
-- Trigger venues_on_created menambah Area Luar, display_settings,
-- tipe lokasi "Lokasi", dan 15 template instruksi.
-- ---------------------------------------------------------------------
insert into public.venues (id, name, address, center, timezone, venue_type)
values (
  '10000000-0000-4000-8000-000000000001', 'Venue Contoh', 'Jl. Contoh No. 1, Jakarta',
  'SRID=4326;POINT(106.8272 -6.1754)'::geometry, 'Asia/Jakarta', 'custom'
);

insert into public.buildings (id, venue_id, name, code, footprint)
values (
  '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
  'Gedung Utama', 'GU',
  'SRID=4326;POLYGON((106.8268 -6.1751, 106.8276 -6.1751, 106.8276 -6.1757, 106.8268 -6.1757, 106.8268 -6.1751))'::geometry
);

insert into public.floors (id, venue_id, building_id, name, level, height_m, sort_order) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001', 'GF', 0, 4.5, 0),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001', 'L1', 1, 4, 1);

update public.buildings
set default_floor_id = '30000000-0000-4000-8000-000000000001'
where id = '20000000-0000-4000-8000-000000000001';

update public.venues
set default_building_id = '20000000-0000-4000-8000-000000000001'
where id = '10000000-0000-4000-8000-000000000001';
