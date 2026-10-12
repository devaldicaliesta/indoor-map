-- T-612c: admin-venue (pengguna trial) mengundang anggota venue-nya (arch §3.2).
--
-- Sebelumnya hanya Super Admin yang bisa mengundang (`admin-users` → `requireSuperAdmin`).
-- Pengguna trial berperan `admin` dengan `all_venues = false`, sehingga tertutup total. §3.2:
-- "pengguna trial hanya melihat dan mengundang anggota venue-nya (batas 2 pengguna)".
--
-- Aturan siapa boleh mengundang, ke venue mana, dan dalam batas berapa diletakkan di SATU fungsi
-- SQL. Edge Function memanggilnya dengan JWT pemanggil SEBELUM mengirim email undangan, jadi:
--   • otorisasi tetap di server dan bisa diuji pgTAP, tidak tersebar di TypeScript;
--   • undangan yang pasti ditolak (batas penuh) tidak sempat mengirim email.
-- Penegakan akhirnya tetap trigger kuota pada `profiles` dan `venue_members` (0038, 0044).
--
-- Nilai kembali: NULL = undangan tingkat instalasi (Super Admin, perilaku lama, profil
-- `all_venues = true`); uuid = undangan ke venue itu (profil `all_venues = false` + anggota).

create function public.user_invite_check(p_role public.app_role) returns uuid
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_venues uuid[];
  v_venue uuid;
  v_scope uuid;
  v_limit integer;
  v_used integer;
begin
  if app.is_super_admin() then
    v_venue := null;
  elsif app.user_role() = 'admin' and not app.all_venues_user() then
    v_venues := array(
      select m.venue_id from public.venue_members m
      where m.user_id = app.current_user_id()
      limit 2);
    if cardinality(v_venues) <> 1 then
      raise exception 'Akun Anda tidak terhubung ke satu venue.' using errcode = '42501';
    end if;
    v_venue := v_venues[1];
    if p_role = 'super_admin' then
      raise exception 'Admin venue tidak bisa mengundang Super Admin.' using errcode = '42501';
    end if;
    if app.venue_locked(v_venue) then
      raise exception 'Masa trial venue ini sudah berakhir. Hubungi kami untuk melanjutkan.'
        using errcode = '42501';
    end if;
  else
    -- Pesan sama dengan sebelum 0046: di on-premise tidak ada Admin venue.
    raise exception 'Hanya Super Admin yang bisa menambah pengguna.' using errcode = '42501';
  end if;

  -- Batas pengguna aktif: per venue untuk venue trial, selain itu kuota lisensi seluruh instalasi.
  v_scope := app.quota_scope(v_venue);
  v_limit := app.quota_limit('users', v_scope);
  if v_limit is not null then
    v_used := app.quota_used('users', v_scope);
    if v_used >= v_limit then
      raise exception '%',
        app.quota_message('users', v_used, v_limit,
          app.trial_venue(v_venue) or app.license_is_trial())
        using errcode = 'IM422';
    end if;
  end if;
  return v_venue;
end
$$;
revoke execute on function public.user_invite_check(public.app_role) from public, anon;
grant execute on function public.user_invite_check(public.app_role) to authenticated;
