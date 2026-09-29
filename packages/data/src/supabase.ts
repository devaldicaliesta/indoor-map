import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/** Klien Supabase bertipe skema. Hanya dipakai di dalam paket ini. */
export type Db = SupabaseClient<Database>;
