import { createDataClient, DataError } from '@indoor/data';
import { QueryClient } from '@tanstack/react-query';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diisi di .env.local (lihat .env.example).',
  );
}

export const data = createDataClient({ url, anonKey });

/** Visitor ter-hosting untuk tautan `/v/<slug>` setiap ruang kerja trial. */
export const visitorUrl = (
  import.meta.env.VITE_VISITOR_URL ?? 'https://app.panduarah.my.id'
).replace(/\/$/, '');

// Error yang tidak berubah bila diulang (izin, data salah) tidak dicoba lagi.
const NON_RETRYABLE = new Set(['forbidden', 'not_found', 'invalid', 'conflict', 'network']);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof DataError && NON_RETRYABLE.has(error.kind)) && failureCount < 2,
    },
  },
});
