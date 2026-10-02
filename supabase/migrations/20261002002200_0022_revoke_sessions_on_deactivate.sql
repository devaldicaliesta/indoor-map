-- =====================================================================
-- 0022_revoke_sessions_on_deactivate.sql — cabut sesi saat pengguna dinonaktifkan (T-009b, temuan T-307a)
-- RLS sudah menolak data untuk profil nonaktif, tetapi sesi dan refresh token tetap hidup:
-- pengguna masih bisa memakai endpoint Auth, dan sesi lama berlaku lagi bila diaktifkan kembali.
-- =====================================================================

create or replace function app.revoke_sessions_on_deactivate() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Refresh token ikut terhapus (foreign key on delete cascade).
  delete from auth.sessions where user_id = new.user_id;
  return new;
end
$$;
revoke execute on function app.revoke_sessions_on_deactivate() from public, anon, authenticated;

create trigger profiles_revoke_sessions_on_deactivate
  after update of is_active on public.profiles
  for each row
  when (old.is_active and not new.is_active)
  execute function app.revoke_sessions_on_deactivate();
