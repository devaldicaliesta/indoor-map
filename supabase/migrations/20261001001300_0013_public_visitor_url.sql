-- =====================================================================
-- 0013_public_visitor_url.sql — URL publik Visitor untuk QR titik asal (T-212)
-- system_settings hanya dibaca Super Admin karena berisi konfigurasi SMTP (0004),
-- tetapi Admin dan Editor perlu URL publik untuk membuat QR. Fungsi ini hanya
-- mengembalikan kolom itu, untuk semua staf yang boleh membaca konten.
-- =====================================================================

create or replace function public.public_visitor_url() returns text
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
begin
  if not app.can_read() then
    raise exception 'Hanya staf yang bisa membaca URL publik Visitor.' using errcode = '42501';
  end if;
  return (select public_visitor_url from public.system_settings where id);
end
$$;

revoke execute on function public.public_visitor_url() from public, anon;
grant execute on function public.public_visitor_url() to authenticated;
