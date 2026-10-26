import { resolve } from 'node:path';
import { thirdPartyNotices, UI_FONT_NOTICES } from '@indoor/third-party-notices';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Situs vendor statis (T-505): beranda, kebijakan privasi, dan verifikasi trial (T-616) sebagai
// halaman HTML terpisah, sehingga bisa di-host di mana saja tanpa aturan rewrite.
export default defineConfig({
  // .env.local dibaca dari root repo agar satu file dipakai semua app.
  envDir: '../..',
  // MapLibre 6 memuat web worker dari file terpisah; pre-bundle Vite merusak URL-nya.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  plugins: [
    react(),
    tailwindcss(),
    thirdPartyNotices({
      product: 'PanduArah landing',
      include: ['tailwindcss'],
      extra: [
        ...UI_FONT_NOTICES,
        {
          name: 'Figtree (font)',
          license: 'OFL-1.1',
          file: resolve(import.meta.dirname, 'src/fonts/LICENSE-figtree.txt'),
        },
      ],
    }),
  ],
  server: { port: 5175, strictPort: true },
  preview: { port: 4175, strictPort: true },
  build: {
    rollupOptions: {
      // Modul TypeScript @indoor/ui dan @indoor/domain bebas efek samping (konstanta skema zod,
      // komponen yang tidak dipakai), jadi boleh dibuang bila tidak diimpor; CSS tetap dipakai.
      treeshake: {
        moduleSideEffects: (id: string) =>
          !/packages[/](ui|domain)[/]/.test(id) || id.endsWith('.css'),
      },
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privasi/index.html'),
        trialVerify: resolve(import.meta.dirname, 'trial/verifikasi/index.html'),
      },
    },
  },
});
