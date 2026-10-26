import { thirdPartyNotices, UI_FONT_NOTICES } from '@indoor/third-party-notices';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dasbor vendor trial ter-hosting (T-617), situs `vendor.panduarah.my.id`. Bukan bagian paket klien.
export default defineConfig({
  // .env.local dibaca dari root repo agar satu file dipakai semua app.
  envDir: '../..',
  plugins: [
    react(),
    tailwindcss(),
    thirdPartyNotices({
      product: 'PanduArah dasbor vendor',
      include: ['tailwindcss'],
      extra: [...UI_FONT_NOTICES],
    }),
  ],
  server: { port: 5176, strictPort: true },
  preview: { port: 4176, strictPort: true },
  build: {
    rollupOptions: {
      // Sama dengan landing: modul @indoor/ui dan @indoor/domain bebas efek samping, jadi yang
      // tidak diimpor (editor, skema zod, peta) dibuang; CSS tetap dipakai.
      treeshake: {
        moduleSideEffects: (id: string) =>
          !/packages[/](ui|domain)[/]/.test(id) || id.endsWith('.css'),
      },
    },
  },
});
