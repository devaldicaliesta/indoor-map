-- =====================================================================
-- 0069_model3d.sql — objek 3D di peta (T-571)
-- Fitur titik `model3d`: props.model = 'builtin:<kunci>' (pustaka bawaan) atau
-- 'models/{venue_id}/{nama}.glb' (unggahan di public-assets), props.modelScale,
-- props.modelRotation (derajat), props.baseHeight (meter). Validasi bentuk di sini,
-- isi GLB divalidasi Admin sebelum unggah; bucket membatasi 5 MB dan tipe MIME.
-- =====================================================================

alter type public.feature_kind add value if not exists 'model3d';

alter table public.features add constraint features_model3d check (
  kind::text <> 'model3d'
  or coalesce((
    geometrytype(geom) = 'POINT'
    and jsonb_typeof(props -> 'model') = 'string'
    and (
      props ->> 'model' ~ '^builtin:[a-z0-9-]{1,40}$'
      or props ->> 'model' ~ '^models/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,120}\.glb$'
    )
    and (
      props -> 'modelScale' is null
      or (jsonb_typeof(props -> 'modelScale') = 'number'
        and (props ->> 'modelScale')::numeric between 0.1 and 20)
    )
    and (
      props -> 'modelRotation' is null
      or (jsonb_typeof(props -> 'modelRotation') = 'number'
        and (props ->> 'modelRotation')::numeric between 0 and 360)
    )
    and (
      props -> 'baseHeight' is null
      or (jsonb_typeof(props -> 'baseHeight') = 'number'
        and (props ->> 'baseHeight')::numeric between 0 and 200)
    )
  ), false)
);

update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'model/gltf-binary')
where id = 'public-assets' and not ('model/gltf-binary' = any (allowed_mime_types));

create policy public_assets_models_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'models' and app.can_edit()
  );
create policy public_assets_models_update on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'models' and app.can_edit()
  )
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'models' and app.can_edit()
  );
create policy public_assets_models_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'models' and app.can_edit()
  );
