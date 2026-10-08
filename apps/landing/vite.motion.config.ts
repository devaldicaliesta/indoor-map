import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Halaman perekaman motion graphic (scripts/landing-motion.mjs); bukan bagian situs.
export default defineConfig({
  envDir: '../..',
  plugins: [tailwindcss()],
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: { input: resolve(import.meta.dirname, 'motion/index.html') },
  },
});
