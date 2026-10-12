-- T-612b: venue trial yang terkunci menolak tulis (arch §3.5, FR-HT-09).
--
-- Hari ke-17 `hosting.trials.locked_at` diisi (T-615). Sejak itu pengguna trial tidak boleh
-- mengubah apa pun di venue itu, termasuk menerbitkan ulang — publish membuat `latest.json` baru,
-- yang justru dihapus saat mengunci agar Visitor trial berhenti. Membaca tetap boleh, sesuai
-- §3.5 ("RLS menolak semua tulis"): layar "Trial berakhir" dan dukungan vendor masih bisa memakai
-- data venue sampai dihapus hari ke-24.
--
-- Bentuk:
--   • `app.writable_venue_ids()` = venue keanggotaan dikurangi venue trial terkunci. Kebijakan
--     TULIS memakainya; kebijakan BACA tetap `app.accessible_venue_ids()`.
--   • Kebijakan tulis diturunkan dari `pg_policies` yang berlaku (bukan daftar golongan tulisan
--     tangan): pelajaran 0043 — pengecualian peran bisa datang dari migrasi mana pun, jadi hanya
--     predikat venue yang ditukar dan cek peran yang sedang berlaku dibiarkan apa adanya.
--   • Fungsi `security definer` melewati RLS. Satu-satunya yang menulis atas nama pengguna trial
--     adalah publish (baris `publications`) dan kunci edit (`edit_locks`), jadi keduanya dijaga
--     trigger. Trigger juga berlaku bagi service role: vendor membuka kunci dengan mengosongkan
--     `locked_at`, bukan dengan menerbitkan diam-diam.
--
-- On-premise tidak berubah: pengguna akses-semua tetap short-circuit `true` (0041), dan tanpa
-- `hosting_mode` tidak ada venue yang terkunci.

-- ---------------------------------------------------------------------
-- 1. Venue terkunci dan himpunan venue yang boleh ditulis
-- ---------------------------------------------------------------------
create function app.venue_locked(p_venue_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select p_venue_id is not null
    and app.hosting_mode()
    and exists (
      select 1 from hosting.trials t
      where t.venue_id = p_venue_id and t.locked_at is not null and t.deleted_at is null
    )
$$;
revoke execute on function app.venue_locked(uuid) from public;

create function app.writable_venue_ids() returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select m.venue_id from public.venue_members m
  where m.user_id = app.current_user_id() and not app.venue_locked(m.venue_id)
$$;

create function app.writable_venue_keys() returns setof text
language sql stable security definer
set search_path = ''
as $$ select v::text from app.writable_venue_ids() v $$;

-- Penyelesai parent untuk tulis, pasangan `app.can_access_floor/location/location_type` (0039).
-- Hanya dicapai cabang `else` (pengguna trial), dan tulis menyentuh sedikit baris.
create function app.can_write_floor(p_floor_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.floors f
    where f.id = p_floor_id and f.venue_id in (select app.writable_venue_ids())
  )
$$;

create function app.can_write_location(p_location_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.locations l
    where l.id = p_location_id and l.venue_id in (select app.writable_venue_ids())
  )
$$;

create function app.can_write_location_type(p_type_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.location_types t
    where t.id = p_type_id and t.venue_id in (select app.writable_venue_ids())
  )
$$;

-- ---------------------------------------------------------------------
-- 2. Kebijakan tulis: tukar predikat baca dengan predikat tulis
-- ---------------------------------------------------------------------
-- Ekspresi diambil dari `pg_policies` (hasil deparse, nama fungsi selalu berskema `app.`), lalu
-- hanya pemanggilan predikat venue yang diganti. `app.can_access_location(` tidak cocok dengan
-- `app.can_access_location_type(` karena kurung langsung setelah nama.
create function pg_temp.to_writable(p_expr text) returns text
language sql immutable
as $$
  select replace(replace(replace(replace(replace(p_expr,
    'app.accessible_venue_ids()', 'app.writable_venue_ids()'),
    'app.accessible_venue_keys()', 'app.writable_venue_keys()'),
    'app.can_access_floor(', 'app.can_write_floor('),
    'app.can_access_location(', 'app.can_write_location('),
    'app.can_access_location_type(', 'app.can_write_location_type(')
$$;

do $$
declare
  r record;
begin
  for r in
    select p.schemaname, p.tablename, p.policyname, p.cmd, p.qual, p.with_check
    from pg_policies p
    where p.schemaname in ('public', 'storage')
      and p.cmd in ('INSERT', 'UPDATE', 'DELETE')
      and coalesce(p.qual, '') || coalesce(p.with_check, '')
        ~ 'accessible_venue_(ids|keys)\(\)|can_access_(floor|location|location_type)\('
  loop
    if r.cmd = 'INSERT' then
      execute format('alter policy %I on %I.%I with check (%s)',
        r.policyname, r.schemaname, r.tablename, pg_temp.to_writable(r.with_check));
    elsif r.cmd = 'DELETE' then
      execute format('alter policy %I on %I.%I using (%s)',
        r.policyname, r.schemaname, r.tablename, pg_temp.to_writable(r.qual));
    elsif r.with_check is null then
      execute format('alter policy %I on %I.%I using (%s)',
        r.policyname, r.schemaname, r.tablename, pg_temp.to_writable(r.qual));
    else
      execute format('alter policy %I on %I.%I using (%s) with check (%s)',
        r.policyname, r.schemaname, r.tablename,
        pg_temp.to_writable(r.qual), pg_temp.to_writable(r.with_check));
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3. Jalur security definer: publish dan kunci edit
-- ---------------------------------------------------------------------
create function app.reject_locked_venue() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_venue uuid;
begin
  if tg_table_name = 'edit_locks' then
    select f.venue_id into v_venue from public.floors f where f.id = new.floor_id;
  else
    v_venue := new.venue_id;
  end if;
  if app.venue_locked(v_venue) then
    raise exception 'Masa trial venue ini sudah berakhir. Hubungi kami untuk melanjutkan.'
      using errcode = '42501';
  end if;
  return new;
end
$$;
revoke execute on function app.reject_locked_venue() from public;

create trigger publications_trial_lock before insert on public.publications
  for each row execute function app.reject_locked_venue();
create trigger edit_locks_trial_lock before insert on public.edit_locks
  for each row execute function app.reject_locked_venue();

-- ---------------------------------------------------------------------
-- 4. Status trial pemanggil: banner "sisa N hari" dan layar "Trial berakhir" (T-615)
-- ---------------------------------------------------------------------
-- Security definer agar tetap terbaca setelah venue terkunci. Kosong untuk pengguna yang bukan
-- anggota venue trial, dan selalu kosong di on-premise.
create function public.trial_status()
returns table (venue_id uuid, ends_at timestamptz, locked boolean)
language sql stable security definer
set search_path = ''
as $$
  select t.venue_id, t.ends_at, t.locked_at is not null
  from hosting.trials t
  where app.hosting_mode()
    and t.deleted_at is null
    and t.venue_id in (
      select m.venue_id from public.venue_members m where m.user_id = app.current_user_id()
    )
$$;
revoke execute on function public.trial_status() from public, anon;
grant execute on function public.trial_status() to authenticated;
