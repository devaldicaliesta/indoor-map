alter table public.info_points
  add column playlist_enabled boolean not null default false,
  add column playlist_slide_seconds integer not null default 8
    check (playlist_slide_seconds between 4 and 60),
  add column playlist_event_ids uuid[] not null default '{}'
    check (cardinality(playlist_event_ids) <= 50);
