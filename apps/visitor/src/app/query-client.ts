import { DataError } from '@indoor/data';
import { QueryClient } from '@tanstack/react-query';

// Venue yang belum terbit atau data yang rusak tidak akan berubah bila diulang.
const NON_RETRYABLE = new Set(['not_found', 'invalid', 'forbidden']);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) =>
        !(error instanceof DataError && NON_RETRYABLE.has(error.kind)) && failureCount < 2,
    },
  },
});
