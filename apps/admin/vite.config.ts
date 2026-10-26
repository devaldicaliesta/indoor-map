import { thirdPartyNotices, UI_FONT_NOTICES } from '@indoor/third-party-notices';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // .env.local dibaca dari root repo agar satu file dipakai semua app.
  envDir: '../..',
  // MapLibre 6 memuat web worker dari file terpisah; pre-bundle Vite merusak URL-nya.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  plugins: [
    react(),
    tailwindcss(),
    thirdPartyNotices({
      product: 'PanduArah Admin',
      include: ['tailwindcss'],
      extra: [...UI_FONT_NOTICES],
    }),
  ],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
});
