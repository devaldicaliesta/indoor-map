-- =====================================================================
-- 0056_tour_progress.sql — status tur panduan Admin per pengguna (T-599)
-- Tur yang sudah dilihat atau dilewati tidak tampil lagi, juga dari perangkat lain. Kunci
-- memakai versi (`editor@1`) agar tur yang isinya berubah besar bisa tampil lagi. Hanya pemilik
-- akun yang bisa membaca dan menulis barisnya; bukan konten venue, jadi tidak terkunci lisensi.
-- =====================================================================

create table public.tour_progress (
  user_id uuid not null default auth.uid() references public.profiles (user_id) on delete cascade,
  tour_key text not null check (tour_key ~ '^[a-z][a-z0-9-]*@[1-9][0-9]*$'),
  seen_at timestamptz not null default now(),
  primary key (user_id, tour_key)
);

alter table public.tour_progress enable row level security;

create policy tour_progress_own_select on public.tour_progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy tour_progress_own_insert on public.tour_progress
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy tour_progress_own_update on public.tour_progress
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.tour_progress from anon;
revoke delete, truncate on public.tour_progress from authenticated;
grant select, insert, update on public.tour_progress to authenticated;
