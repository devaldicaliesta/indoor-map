alter table public.categories
  add column name_en text
    check (name_en is null or length(trim(name_en)) between 1 and 60);

alter table public.locations
  add column description_en text
    check (description_en is null or length(description_en) <= 500);
