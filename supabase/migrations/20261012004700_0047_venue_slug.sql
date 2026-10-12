-- T-613: slug venue untuk alamat Visitor pendek (`/v/<slug>`; demo publik `/v/demo`).
--
-- Visitor membaca hanya berkas Storage (prefetch dari HTML, cache service worker untuk offline),
-- jadi slug tidak diselesaikan lewat query database per kunjungan: setiap publish menulis
-- penunjuk `snapshots/slugs/{slug}.json` = `{ "venueId": … }` (`_shared/snapshot-files.ts`).
-- Slug berpindah atau dihapus berlaku pada publish berikutnya, sama seperti isi peta.
--
-- Aturan bentuk sama dengan `VenueSlugSchema` (packages/domain): huruf kecil, angka, tanda hubung
-- tunggal di antaranya, 3–60 karakter, dan tidak berbentuk UUID (agar `/v/<x>` selalu jelas).
-- Kolom boleh kosong: venue on-premise tetap dibuka lewat id.

alter table public.venues add column slug text;

alter table public.venues add constraint venues_slug_format check (
  slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  and char_length(slug) between 3 and 60
  and slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);
alter table public.venues add constraint venues_slug_key unique (slug);

comment on column public.venues.slug is
  'Alamat pendek Visitor /v/<slug>. Diisi provisioning trial (T-614) atau vendor; penunjuknya ditulis saat publish.';

-- Slug adalah alamat publik di bawah domain vendor. Pengguna trial (`all_venues = false`) tidak
-- boleh mengisinya sendiri — mis. memakai nama instansi lain. Yang boleh: pengguna akses-semua
-- (vendor, on-premise) dan jalur tanpa pengguna (service role provisioning, migrasi).
create function app.guard_venue_slug() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.slug is not distinct from old.slug then
      return new;
    end if;
  elsif new.slug is null then
    return new;
  end if;
  if app.current_user_id() is not null and not app.all_venues_user() then
    raise exception 'Alamat pendek venue hanya bisa diubah tim PanduArah.' using errcode = '42501';
  end if;
  return new;
end
$$;
revoke execute on function app.guard_venue_slug() from public;

create trigger venues_slug_guard before insert or update of slug on public.venues
  for each row execute function app.guard_venue_slug();
