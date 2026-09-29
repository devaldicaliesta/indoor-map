import { defineConfig } from 'vitest/config';

// Butuh Supabase lokal yang berjalan; dijalankan lewat `pnpm test:integration`.
export default defineConfig({
  test: {
    include: ['test/integration/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
