create type public.analytics_kind as enum ('visit', 'search', 'location', 'route');
create type public.analytics_source as enum ('direct', 'origin_qr', 'info_point', 'link', 'embed');
create type public.analytics_device as enum ('mobile', 'tablet', 'desktop', 'kiosk');

alter table public.system_settings
  add column analytics_enabled boolean not null default false,
  add column analytics_notice_id text not null
    default 'Kami mencatat statistik pemakaian peta tanpa data pribadi untuk memperbaiki layanan.'
    check (char_length(analytics_notice_id) between 1 and 500),
  add column analytics_notice_en text not null
    default 'We record map usage statistics without personal data to improve this service.'
    check (char_length(analytics_notice_en) between 1 and 500);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  venue_id uuid not null references public.venues (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  kind public.analytics_kind not null,
  source public.analytics_source not null,
  source_ref text check (source_ref ~ '^[A-Za-z0-9_-]{1,32}$'),
  language public.language_code not null,
  device public.analytics_device not null,
  query text check (char_length(query) between 1 and 100),
  result_count integer check (result_count between 0 and 10000),
  target_kind text check (target_kind in ('location', 'unit', 'facility')),
  target_id uuid,
  origin_kind text check (origin_kind in ('origin_point', 'info_point', 'location', 'unit', 'facility', 'point')),
  origin_ref text check (char_length(origin_ref) between 1 and 64),
  check ((kind = 'search') = (query is not null and result_count is not null)),
  check ((kind in ('location', 'route')) = (target_kind is not null and target_id is not null)),
  check ((kind = 'route') = (origin_kind is not null)),
  check (kind <> 'location' or target_kind = 'location'),
  check ((source in ('origin_qr', 'info_point')) = (source_ref is not null))
);

create index analytics_events_venue_time on public.analytics_events (venue_id, occurred_at);
create index analytics_events_time on public.analytics_events (occurred_at);

create table public.analytics_daily (
  venue_id uuid not null references public.venues (id) on delete cascade,
  day date not null,
  metric text not null,
  key text not null,
  count integer not null check (count > 0),
  primary key (venue_id, day, metric, key)
);

create table public.analytics_rollups (
  venue_id uuid not null references public.venues (id) on delete cascade,
  day date not null,
  rolled_at timestamptz not null default now(),
  primary key (venue_id, day)
);

alter table public.analytics_events enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.analytics_rollups enable row level security;

revoke all on public.analytics_events, public.analytics_daily, public.analytics_rollups from anon;
revoke insert, update, delete, truncate on public.analytics_events, public.analytics_daily, public.analytics_rollups from authenticated;

create function app.can_read_analytics() returns boolean
language sql stable
as $$ select app.has_role(array['super_admin', 'admin', 'viewer']::public.app_role[]) $$;

create policy analytics_events_read on public.analytics_events for select to authenticated using (
  (select app.can_read_analytics())
  and (case when (select app.all_venues_user()) then true
       else venue_id in (select app.accessible_venue_ids()) end)
);
create policy analytics_daily_read on public.analytics_daily for select to authenticated using (
  (select app.can_read_analytics())
  and (case when (select app.all_venues_user()) then true
       else venue_id in (select app.accessible_venue_ids()) end)
);
create policy analytics_rollups_read on public.analytics_rollups for select to authenticated using (
  (select app.can_read_analytics())
  and (case when (select app.all_venues_user()) then true
       else venue_id in (select app.accessible_venue_ids()) end)
);

create function app.analytics_metrics(e public.analytics_events)
returns table (metric text, key text)
language sql immutable
as $$
  select m.metric, m.key
  from (values
    ('kind', e.kind::text),
    ('source', e.source::text),
    ('language', e.language::text),
    ('device', e.device::text),
    ('search', case when e.kind = 'search' then e.query end),
    ('search_empty', case when e.kind = 'search' and e.result_count = 0 then e.query end),
    ('location', case when e.kind = 'location' then e.target_id::text end),
    ('route_to', case when e.kind = 'route' then e.target_kind || ':' || e.target_id end),
    ('route_from', case when e.kind = 'route' then e.origin_kind || ':' || coalesce(e.origin_ref, '') end),
    ('info_point', case when e.source = 'info_point' and e.kind <> 'visit' then e.source_ref end),
    ('origin_qr', case when e.source = 'origin_qr' and e.kind = 'visit' then e.source_ref end)
  ) as m (metric, key)
  where m.key is not null
$$;

create function app.analytics_day(p_at timestamptz, p_timezone text) returns date
language sql immutable
as $$ select (p_at at time zone p_timezone)::date $$;

create function public.analytics_facts(p_venue uuid, p_from date, p_to date)
returns table (day date, metric text, key text, count bigint)
language sql stable
set search_path = public, pg_temp
as $$
  with venue as (
    select v.timezone from public.venues v where v.id = p_venue
  ),
  rolled as (
    select r.day from public.analytics_rollups r
    where r.venue_id = p_venue and r.day between p_from and p_to
  )
  select d.day, d.metric, d.key, d.count::bigint
  from public.analytics_daily d
  where d.venue_id = p_venue and d.day in (select rolled.day from rolled)
  union all
  select app.analytics_day(e.occurred_at, venue.timezone) as day, m.metric, m.key, count(*)
  from public.analytics_events e
  cross join venue
  cross join lateral app.analytics_metrics(e) m
  where e.venue_id = p_venue
    and e.occurred_at >= (p_from::timestamp at time zone venue.timezone) - interval '1 day'
    and e.occurred_at < ((p_to + 1)::timestamp at time zone venue.timezone) + interval '1 day'
    and app.analytics_day(e.occurred_at, venue.timezone) between p_from and p_to
    and app.analytics_day(e.occurred_at, venue.timezone) not in (select rolled.day from rolled)
  group by 1, 2, 3
$$;

revoke execute on function public.analytics_facts(uuid, date, date) from public, anon;
grant execute on function public.analytics_facts(uuid, date, date) to authenticated;

create function app.analytics_rollup(p_now timestamptz default now()) returns integer
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v record;
  v_day date;
  v_count integer := 0;
begin
  for v in select id, timezone from public.venues loop
    v_day := app.analytics_day(p_now, v.timezone) - 1;
    continue when exists (
      select 1 from public.analytics_rollups r where r.venue_id = v.id and r.day = v_day
    );
    insert into public.analytics_daily (venue_id, day, metric, key, count)
    select v.id, v_day, m.metric, m.key, count(*)
    from public.analytics_events e
    cross join lateral app.analytics_metrics(e) m
    where e.venue_id = v.id
      and e.occurred_at >= (v_day::timestamp at time zone v.timezone)
      and e.occurred_at < ((v_day + 1)::timestamp at time zone v.timezone)
    group by m.metric, m.key;
    insert into public.analytics_rollups (venue_id, day) values (v.id, v_day);
    v_count := v_count + 1;
  end loop;
  delete from public.analytics_events where occurred_at < p_now - interval '90 days';
  delete from public.analytics_daily where day < (p_now - interval '2 years')::date;
  return v_count;
end
$$;

revoke execute on function app.analytics_rollup(timestamptz) from public, anon, authenticated;

select cron.schedule('analytics-rollup', '23 * * * *', 'select app.analytics_rollup()');

create function public.analytics_ingest(p_venue uuid, p_events jsonb) returns integer
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_inserted integer;
begin
  if not (select s.analytics_enabled from public.system_settings s where s.id) then
    return 0;
  end if;
  if not exists (select 1 from public.venues v where v.id = p_venue) then
    raise exception 'Venue tidak dikenal.' using errcode = 'IM404';
  end if;
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 50 then
    raise exception 'Kiriman analitik tidak valid.' using errcode = 'IM422';
  end if;
  insert into public.analytics_events (
    venue_id, kind, source, source_ref, language, device, query, result_count,
    target_kind, target_id, origin_kind, origin_ref
  )
  select p_venue,
    (x ->> 'kind')::public.analytics_kind,
    (x ->> 'source')::public.analytics_source,
    nullif(x ->> 'sourceRef', ''),
    (x ->> 'language')::public.language_code,
    (x ->> 'device')::public.analytics_device,
    left(nullif(lower(btrim(regexp_replace(x ->> 'query', '\s+', ' ', 'g'))), ''), 100),
    (x ->> 'resultCount')::integer,
    x ->> 'targetKind',
    (x ->> 'targetId')::uuid,
    x ->> 'originKind',
    left(nullif(x ->> 'originRef', ''), 64)
  from jsonb_array_elements(p_events) as x;
  get diagnostics v_inserted = row_count;
  return v_inserted;
end
$$;

revoke execute on function public.analytics_ingest(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.analytics_ingest(uuid, jsonb) to service_role;

create function public.analytics_config() returns jsonb
language sql stable security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'enabled', s.analytics_enabled,
    'notice', jsonb_build_object('id', s.analytics_notice_id, 'en', s.analytics_notice_en)
  )
  from public.system_settings s where s.id
$$;

revoke execute on function public.analytics_config() from public, anon, authenticated;
grant execute on function public.analytics_config() to service_role;
