import { defineConfig } from 'vitest/config';

// Pengisi data demo lokal (`pnpm db:seed-demo`), bukan test; butuh Supabase lokal berjalan.
export default defineConfig({
  test: { include: ['test/seed/**/*.seed.ts'] },
});
