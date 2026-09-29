import { createDataClient } from '@indoor/data';

// Disimpan sebelum klien dibuat: supabase-js membaca lalu membersihkan hash tautan reset.
export const initialAuthRedirectHash = window.location.hash;

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diisi di .env.local (lihat .env.example).',
  );
}

export const data = createDataClient({ url, anonKey });
