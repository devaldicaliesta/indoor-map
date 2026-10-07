-- T-502: pencarian dan filter tabel Admin di server (DataTable). Fungsi `search_*` berjalan
-- sebagai pemanggil (security invoker), jadi RLS tetap berlaku: baris dan jumlah total
-- (`count=exact` PostgREST) hanya mencakup data yang boleh dibaca role itu.

create extension if not exists unaccent with schema extensions;

-- Teks pencarian: huruf kecil, tanpa diakritik, spasi dirapatkan; sama dengan
-- normalizeSearchText di packages/domain agar tabel klien dan server memberi hasil yang sama.
create or replace function app.search_text(p_value text) returns text
language sql immutable parallel safe
set search_path = pg_catalog, pg_temp
as $$
  select btrim(regexp_replace(
    lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(p_value, ''))),
    '\s+', ' ', 'g'))
$$;

-- Pola LIKE "memuat kata kunci"; %, _, dan \ dari pengguna dicari sebagai teks biasa.
create or replace function app.contains_pattern(p_query text) returns text
language sql immutable parallel safe
set search_path = pg_catalog, pg_temp
as $$
  select '%' || replace(replace(replace(app.search_text(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
$$;

-- Batas rentang tanggal kalender di zona waktu tampilan: [dari 00.00, sampai+1 00.00).
create or replace function app.day_start(p_date date, p_time_zone text) returns timestamptz
language sql stable parallel safe
set search_path = pg_catalog, pg_temp
as $$ select p_date::timestamp at time zone coalesce(nullif(p_time_zone, ''), 'UTC') $$;

grant execute on function app.search_text(text) to authenticated, anon, service_role;
grant execute on function app.contains_pattern(text) to authenticated, anon, service_role;
grant execute on function app.day_start(date, text) to authenticated, anon, service_role;

-- Log audit: kata kunci mencari nama/email pelaku dan pengguna sasaran serta nilai rincian.
create or replace function public.search_audit_events(
  p_query text default '',
  p_actions text[] default null,
  p_user_id uuid default null,
  p_from date default null,
  p_to date default null,
  p_time_zone text default 'Asia/Jakarta'
) returns setof public.audit_events
language sql stable security invoker
set search_path = public, pg_temp
as $$
  select e.*
  from public.audit_events e
  where (p_actions is null or cardinality(p_actions) = 0 or e.action = any (p_actions))
    and (p_user_id is null or e.user_id = p_user_id)
    and (p_from is null or e.occurred_at >= app.day_start(p_from, p_time_zone))
    and (p_to is null or e.occurred_at < app.day_start(p_to + 1, p_time_zone))
    and (
      app.search_text(p_query) = ''
      or app.search_text(concat_ws(' ',
           (select concat_ws(' ', p.full_name, p.email) from public.profiles p where p.user_id = e.user_id),
           (select concat_ws(' ', p.full_name, p.email) from public.profiles p
             where e.entity = 'user' and p.user_id = e.entity_id),
           (select string_agg(d.value, ' ') from jsonb_each_text(e.details) d)
         )) like app.contains_pattern(p_query)
    )
$$;

revoke execute on function public.search_audit_events(text, text[], uuid, date, date, text) from public, anon;
grant execute on function public.search_audit_events(text, text[], uuid, date, date, text) to authenticated;
