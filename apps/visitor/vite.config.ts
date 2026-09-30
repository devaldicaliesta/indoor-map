import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Warna manifest sama dengan token --canvas dan --ink (manifest tidak bisa membaca CSS).
const CANVAS = '#f2f3ef';
const INK = '#111418';

export default defineConfig({
  // .env.local dibaca dari root repo agar satu file dipakai semua app.
  envDir: '../..',
  // MapLibre 6 memuat web worker dari file terpisah; pre-bundle Vite merusak URL-nya.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Indoor Map',
        short_name: 'Indoor Map',
        description: 'Peta dan petunjuk arah di dalam gedung',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: CANVAS,
        theme_color: INK,
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Aset app (termasuk font) di-precache: cache-first.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        // IBM Plex Sans hanya untuk Admin; Visitor memakai Atkinson Hyperlegible.
        globIgnores: ['**/ibm-plex-sans-*'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Snapshot venue: tampil cepat dari cache, diperbarui di latar.
            urlPattern: ({ url }) => url.pathname.includes('/storage/v1/object/public/snapshots/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'snapshots', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
});
