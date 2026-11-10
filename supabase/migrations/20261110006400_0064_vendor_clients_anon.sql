-- 0063 membuat vendor_clients dan vendor_installations tanpa mencabut hak eksekusi bawaan PUBLIC
-- dan anon, sehingga keduanya terekspos sebagai RPC tanpa login. require_vendor() tetap menolak,
-- tetapi RPC public hanya boleh dibuka untuk anon bila disengaja (TC-SEC-45b).
revoke execute on function public.vendor_clients() from public, anon;
revoke execute on function public.vendor_installations() from public, anon;
