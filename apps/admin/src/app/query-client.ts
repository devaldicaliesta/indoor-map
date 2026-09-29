import { DataError } from '@indoor/data';
import { QueryClient } from '@tanstack/react-query';

// Error yang tidak akan berubah bila diulang (izin, data tidak ada, data salah) tidak dicoba lagi.
const NON_RETRYABLE = new Set(['forbidden', 'not_found', 'invalid', 'conflict']);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof DataError && NON_RETRYABLE.has(error.kind)) && failureCount < 2,
    },
  },
});
