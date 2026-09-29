-- Venue contoh dari seed.sql punya semua data bawaan dari trigger venues_on_created (T-004).
begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

select is(
  (select count(*)::int from public.venues where name = 'Venue Contoh'),
  1,
  'Venue Contoh ada'
);
select is(
  (select count(*)::int from public.floors f join public.venues v on v.id = f.venue_id
   where v.name = 'Venue Contoh' and f.is_outdoor and f.building_id is null),
  1,
  'Venue Contoh punya tepat satu lapisan Area Luar'
);
select is(
  (select count(*)::int from public.display_settings d join public.venues v on v.id = d.venue_id
   where v.name = 'Venue Contoh'),
  1,
  'Venue Contoh punya display_settings'
);
select is(
  (select count(*)::int from public.location_types t join public.venues v on v.id = t.venue_id
   where v.name = 'Venue Contoh' and t.name = 'Lokasi'),
  1,
  'Venue Contoh punya tipe lokasi "Lokasi"'
);
select is(
  (select count(*)::int from public.instruction_templates i join public.venues v on v.id = i.venue_id
   where v.name = 'Venue Contoh'),
  15,
  'Venue Contoh punya 15 template instruksi'
);
select is(
  (select count(*)::int from public.floors f join public.venues v on v.id = f.venue_id
   where v.name = 'Venue Contoh' and not f.is_outdoor),
  2,
  'Venue Contoh punya satu gedung dengan dua lantai'
);

select * from finish();
rollback;
