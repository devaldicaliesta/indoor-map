-- =====================================================================
-- 0070_events.sql — event dan promosi (T-581, F2 §2.10)
-- Visitor membaca langsung tanpa publish, seperti penutupan (T-216): anon hanya melihat
-- event berstatus `active` yang kemunculan terakhirnya belum selesai, dan hanya bila lisensi
-- berlaku membawa fitur `events`. Editor ke atas menulis; server menolak tanpa fitur itu.
-- Jadwal berulang: kemunculan pertama [starts_at, ends_at), diulang harian/mingguan pada jam
-- dinding zona waktu venue sampai tanggal `repeat_until` (inklusif). `last_ends_at` dihitung
-- trigger agar RLS dan indeks cukup membandingkan satu kolom dengan now().
-- =====================================================================

create type public.event_kind as enum ('event', 'promotion');
create type public.event_status as enum ('draft', 'active', 'ended');
create type public.event_repeat as enum ('none', 'daily', 'weekly');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  kind public.event_kind not null default 'event',
  status public.event_status not null default 'draft',
  title_id text not null,
  title_en text,
  summary_id text,
  summary_en text,
  description_id text,
  description_en text,
  image_path text,
  link_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  repeat public.event_repeat not null default 'none',
  repeat_until date,
  last_ends_at timestamptz not null default now(),
  floor_id uuid references public.floors (id) on delete set null,
  geom geometry(Point, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_title check (length(btrim(title_id)) between 1 and 120),
  constraint events_title_en check (title_en is null or length(title_en) <= 120),
  constraint events_summary check (
    coalesce(length(summary_id), 0) <= 280 and coalesce(length(summary_en), 0) <= 280
  ),
  constraint events_description check (
    coalesce(length(description_id), 0) <= 5000 and coalesce(length(description_en), 0) <= 5000
  ),
  constraint events_image_path check (
    image_path is null
    or image_path ~ '^events/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,120}\.(png|jpe?g|webp)$'
  ),
  constraint events_link_url check (
    link_url is null or (link_url ~ '^https?://[^\s]+$' and length(link_url) <= 500)
  ),
  constraint events_valid_period check (ends_at > starts_at),
  constraint events_max_duration check (ends_at <= starts_at + interval '1 year'),
  constraint events_repeat_until check ((repeat = 'none') = (repeat_until is null)),
  constraint events_point check ((floor_id is null) = (geom is null))
);

create index events_venue_starts_idx on public.events (venue_id, starts_at desc);
create index events_venue_live_idx on public.events (venue_id, last_ends_at)
  where status = 'active';
create index events_floor_idx on public.events (floor_id) where floor_id is not null;

create table public.event_locations (
  event_id uuid not null references public.events (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  primary key (event_id, location_id)
);
create index event_locations_location_idx on public.event_locations (location_id);

create function app.license_has_feature(p_feature text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.licenses l
    where l.is_current and l.payload->'features' ? p_feature
  )
$$;
revoke execute on function app.license_has_feature(text) from public;
grant execute on function app.license_has_feature(text) to anon, authenticated, service_role;

create function app.event_last_ends_at(
  p_starts timestamptz,
  p_ends timestamptz,
  p_repeat public.event_repeat,
  p_until date,
  p_time_zone text
) returns timestamptz
language sql stable
set search_path = ''
as $$
  select case
    when p_repeat = 'none' or p_until is null then p_ends
    else (
      (p_starts at time zone p_time_zone)
      + make_interval(days => (
          floor((p_until - (p_starts at time zone p_time_zone)::date)::numeric / step) * step
        )::int)
    ) at time zone p_time_zone + (p_ends - p_starts)
  end
  from (select case p_repeat when 'weekly' then 7 else 1 end as step) s
$$;

create function app.events_before_write() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  tz text;
  local_start date;
  period interval;
begin
  if not app.license_has_feature('events') then
    raise exception 'Event & Promo tidak termasuk paket lisensi ini.' using errcode = 'IM422';
  end if;
  select v.timezone into tz from public.venues v where v.id = new.venue_id;
  tz := coalesce(nullif(tz, ''), 'Asia/Jakarta');
  if new.ends_at <= new.starts_at then
    raise exception 'Waktu selesai harus setelah waktu mulai.' using errcode = 'IM422';
  end if;
  if new.ends_at > new.starts_at + interval '1 year' then
    raise exception 'Durasi event paling lama 1 tahun.' using errcode = 'IM422';
  end if;
  if new.repeat <> 'none' then
    local_start := (new.starts_at at time zone tz)::date;
    if new.repeat_until is null or new.repeat_until < local_start then
      raise exception 'Ulangi sampai harus pada atau setelah tanggal mulai.' using errcode = 'IM422';
    end if;
    if new.repeat_until > (local_start + interval '1 year')::date then
      raise exception 'Jadwal berulang paling lama 1 tahun.' using errcode = 'IM422';
    end if;
    period := interval '1 day';
    if new.repeat = 'weekly' then
      period := interval '7 days';
    end if;
    if new.ends_at - new.starts_at > period then
      raise exception 'Durasi satu kemunculan lebih panjang dari jarak pengulangannya.'
        using errcode = 'IM422';
    end if;
  end if;
  if new.floor_id is not null and not exists (
    select 1 from public.floors f where f.id = new.floor_id and f.venue_id = new.venue_id
  ) then
    raise exception 'Lantai titik peta bukan milik venue ini.' using errcode = 'IM422';
  end if;
  new.title_id := btrim(new.title_id);
  new.last_ends_at := app.event_last_ends_at(
    new.starts_at, new.ends_at, new.repeat, new.repeat_until, tz
  );
  return new;
end
$$;
revoke execute on function app.events_before_write() from public;

create trigger events_before_write before insert or update on public.events
  for each row execute function app.events_before_write();
create trigger events_touch_updated_at before update on public.events
  for each row execute function app.touch_updated_at();

create function app.event_locations_before_insert() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if not app.license_has_feature('events') then
    raise exception 'Event & Promo tidak termasuk paket lisensi ini.' using errcode = 'IM422';
  end if;
  if not exists (
    select 1 from public.events e join public.locations l on l.venue_id = e.venue_id
    where e.id = new.event_id and l.id = new.location_id
  ) then
    raise exception 'Lokasi bukan milik venue event ini.' using errcode = 'IM422';
  end if;
  return new;
end
$$;
revoke execute on function app.event_locations_before_insert() from public;

create trigger event_locations_before_insert before insert on public.event_locations
  for each row execute function app.event_locations_before_insert();

alter table public.events enable row level security;
alter table public.event_locations enable row level security;

create policy events_read on public.events for select to authenticated using (
  (select app.can_read())
  and (case when (select app.all_venues_user()) then true
       else venue_id in (select app.accessible_venue_ids()) end)
);
create policy events_read_public on public.events for select to anon using (
  status = 'active' and last_ends_at > now() and (select app.license_has_feature('events'))
);
create policy events_insert on public.events for insert to authenticated with check (
  app.can_edit()
  and (case when (select app.all_venues_user()) then true
       else venue_id in (select app.writable_venue_ids()) end)
);
create policy events_update on public.events for update to authenticated
  using (
    app.can_edit()
    and (case when (select app.all_venues_user()) then true
         else venue_id in (select app.writable_venue_ids()) end)
  )
  with check (
    app.can_edit()
    and (case when (select app.all_venues_user()) then true
         else venue_id in (select app.writable_venue_ids()) end)
  );
create policy events_delete on public.events for delete to authenticated using (
  app.can_edit()
  and (case when (select app.all_venues_user()) then true
       else venue_id in (select app.writable_venue_ids()) end)
);

create policy event_locations_read on public.event_locations for select to authenticated
  using (exists (select 1 from public.events e where e.id = event_id));
create policy event_locations_read_public on public.event_locations for select to anon
  using (exists (select 1 from public.events e where e.id = event_id));
create policy event_locations_insert on public.event_locations for insert to authenticated
  with check (app.can_edit() and exists (select 1 from public.events e where e.id = event_id
    and (case when (select app.all_venues_user()) then true
         else e.venue_id in (select app.writable_venue_ids()) end)));
create policy event_locations_delete on public.event_locations for delete to authenticated
  using (app.can_edit() and exists (select 1 from public.events e where e.id = event_id
    and (case when (select app.all_venues_user()) then true
         else e.venue_id in (select app.writable_venue_ids()) end)));

grant select on public.events, public.event_locations to anon;
grant select, insert, update, delete on public.events, public.event_locations to authenticated;

create policy public_assets_events_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'events' and app.can_edit()
    and (case when (select app.all_venues_user()) then true
         else (storage.foldername(name))[2] in (select app.writable_venue_keys()) end)
  );
create policy public_assets_events_update on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'events' and app.can_edit()
    and (case when (select app.all_venues_user()) then true
         else (storage.foldername(name))[2] in (select app.writable_venue_keys()) end)
  )
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'events' and app.can_edit()
    and (case when (select app.all_venues_user()) then true
         else (storage.foldername(name))[2] in (select app.writable_venue_keys()) end)
  );
create policy public_assets_events_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'events' and app.can_edit()
    and (case when (select app.all_venues_user()) then true
         else (storage.foldername(name))[2] in (select app.writable_venue_keys()) end)
  );
