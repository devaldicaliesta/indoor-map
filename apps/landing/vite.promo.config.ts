import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Halaman perekaman video promosi (scripts/promo-motion.mjs); satu konsep per build lewat
// PROMO_CONCEPT. Bukan bagian situs landing dan tidak menyentuh video landing 15 detik.
const concept = process.env.PROMO_CONCEPT ?? 'pengelola';
const page = resolve(import.meta.dirname, 'motion-promo', concept, 'index.html');
if (!existsSync(page))
  throw new Error(`Konsep promo tidak ada: motion-promo/${concept}/index.html`);

export default defineConfig({
  envDir: '../..',
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: { input: page },
  },
});
