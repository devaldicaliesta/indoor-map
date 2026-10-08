/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  /** Alamat fungsi form trial di server vendor; bawaan `${VITE_SUPABASE_URL}/functions/v1/trial-request`. */
  readonly VITE_TRIAL_ENDPOINT?: string;
}
