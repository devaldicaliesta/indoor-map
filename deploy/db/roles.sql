-- Password peran layanan Supabase sama dengan POSTGRES_PASSWORD (dibangkitkan install.sh).
-- Hanya dijalankan sekali saat volume database pertama kali dibuat.
\set pgpass `echo "$POSTGRES_PASSWORD"`

alter user authenticator with password :'pgpass';
alter user supabase_auth_admin with password :'pgpass';
alter user supabase_storage_admin with password :'pgpass';
alter user supabase_admin with password :'pgpass';
