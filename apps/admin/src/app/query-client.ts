import { DataError } from '@indoor/data';
import { QueryClient } from '@tanstack/react-query';

// Error yang tidak akan berubah bila diulang (izin, data tidak ada, data salah) tidak dicoba lagi.
// Galat jaringan juga tidak: supabase-js sudah mengulang GET 3 kali (1, 2, 4 s); mengulang lagi di
// sini membuat layar memuat ±24 s sebelum pesan "Server tidak terjangkau" muncul.
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
