-- =====================================================================
-- 0007_floor_plan_storage.sql — bucket denah dan snapshot (T-105)
-- floor-plans: privat; file asli + raster denah per lantai (NFR-SEC-04: ≤ 50 MB,
--   hanya PNG/JPG/PDF; DWG/DXF menyusul di T-313).
-- snapshots: baca publik; ditulis hanya Edge Function publish (service role).
-- Path denah: floor-plans/{venue_id}/{floor_id}/{nama berkas}.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('floor-plans', 'floor-plans', false, 52428800, array['image/png', 'image/jpeg', 'application/pdf']),
  ('snapshots', 'snapshots', true, 52428800, array['application/json'])
on conflict (id) do nothing;

create policy floor_plans_read on storage.objects for select to authenticated
  using (bucket_id = 'floor-plans' and app.can_read());
create policy floor_plans_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'floor-plans' and app.can_manage());
create policy floor_plans_delete on storage.objects for delete to authenticated
  using (bucket_id = 'floor-plans' and app.can_manage());
