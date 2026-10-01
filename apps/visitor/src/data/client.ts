import { createDataClient } from '@indoor/data';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diisi di .env.local (lihat .env.example).',
  );
}

/** Visitor hanya membaca data publik: snapshot published dan aset publik. */
export const data = createDataClient({ url, anonKey });
