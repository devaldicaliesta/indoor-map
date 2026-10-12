-- T-616: isian form trial disimpan paling lama 12 bulan (kebijakan privasi landing, UU PDP).
--
-- Kebijakan privasi menyebut "isian form trial dan email disimpan paling lama 12 bulan". Janji
-- itu ditegakkan di sini, bukan hanya ditulis: siklus hidup (T-615) memanggil fungsi ini tiap jam.
-- Permintaan yang masih punya ruang kerja (`active`, `locked`) atau menunggu giliran (`queued`)
-- tidak disentuh; ruang kerja sendiri sudah dihapus hari ke-24.

create function public.hosting_lifecycle_forget() returns integer
language sql security definer
set search_path = ''
as $$
  with forgotten as (
    delete from hosting.trial_requests r
    where r.created_at < now() - interval '12 months'
      and r.status in ('unverified', 'rejected', 'deleted')
    returning 1
  )
  select count(*)::integer from forgotten
$$;
revoke execute on function public.hosting_lifecycle_forget() from public, anon, authenticated;
grant execute on function public.hosting_lifecycle_forget() to service_role;
