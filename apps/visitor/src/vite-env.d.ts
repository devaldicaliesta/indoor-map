/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  /** `off`: tur halaman tidak mulai sendiri (server test E2E); tombol tur tetap ada. */
  readonly VITE_TOUR_AUTOSTART?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
