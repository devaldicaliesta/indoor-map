import { createRequire } from 'node:module';
import { thirdPartyNotices, UI_FONT_NOTICES } from '@indoor/third-party-notices';
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
    thirdPartyNotices({
      product: 'PanduArah Visitor',
      include: ['tailwindcss'],
      extra: [
        ...UI_FONT_NOTICES,
        // Runtime service worker (workbox-core, -precaching, -routing, -strategies, -expiration)
        // dibangun terpisah oleh vite-plugin-pwa; lisensinya sama dengan workbox-window.
        {
          name: 'Workbox (service worker)',
          license: 'MIT',
          file: createRequire(import.meta.url).resolve('workbox-window/LICENSE'),
        },
      ],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg'],
      manifest: {
        name: 'PanduArah',
        short_name: 'PanduArah',
        // Tagline Inggris untuk pasar luar negeri (docs/20-F2-fase-2.md §2.3).
        description: 'PanduArah — Indoor Navigation',
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
        // Bundel utama (MapLibre + app) ±2,1 MB melewati batas bawaan workbox 2 MiB; tanpa
        // precache Visitor tidak terbuka saat offline (NFR-REL-03), jadi batasnya dinaikkan.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Snapshot venue: selalu ditanyakan ke server lebih dulu agar versi terbaru terpakai;
            // bila tidak berubah server membalas 304 (ETag) sehingga isinya diambil dari cache
            // browser. Saat server tidak terjangkau atau lambat, versi tersimpan yang dipakai.
            // Penunjuk slug (`slugs/{slug}.json`) diperlakukan sama agar `/v/<slug>` juga terbuka
            // tanpa jaringan.
            urlPattern: ({ url }) =>
              url.pathname.includes('/storage/v1/object/public/snapshots/') &&
              (url.pathname.endsWith('/latest.json') || url.pathname.includes('/snapshots/slugs/')),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'snapshots',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 20 },
            },
          },
          {
            // Graf jalur per versi (`v{n}.graph.json`) tidak pernah berubah: cukup diunduh sekali,
            // dan rute tetap bisa dihitung tanpa jaringan.
            urlPattern: ({ url }) =>
              url.pathname.includes('/storage/v1/object/public/snapshots/') &&
              url.pathname.endsWith('.graph.json'),
            handler: 'CacheFirst',
            options: { cacheName: 'snapshot-graphs', expiration: { maxEntries: 20 } },
          },
          {
            // Ikon fasilitas, logo, dan gambar lain di bucket aset publik: dipakai dari cache
            // lebih dulu dan diperbarui di latar, agar Info Point tetap lengkap saat jaringan
            // putus (NFR-REL-03).
            urlPattern: ({ url }) =>
              url.pathname.includes('/storage/v1/object/public/public-assets/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets', expiration: { maxEntries: 500 } },
          },
        ],
      },
    }),
  ],
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
});
