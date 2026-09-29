import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { createProfilesRepository, type ProfilesRepository } from './repositories/profiles';
import {
  createSystemSettingsRepository,
  type SystemSettingsRepository,
} from './repositories/system-settings';
import type { Db } from './supabase';

/** Nilai dibaca app dari `import.meta.env`, bukan oleh paket ini. */
export interface DataClientConfig {
  url: string;
  anonKey: string;
}

/** Pintu tunggal app ke database. Klien Supabase mentah tidak pernah diekspos. */
export interface DataClient {
  profiles: ProfilesRepository;
  systemSettings: SystemSettingsRepository;
}

export function createRepositories(db: Db): DataClient {
  return {
    profiles: createProfilesRepository(db),
    systemSettings: createSystemSettingsRepository(db),
  };
}

export function createDataClient(config: DataClientConfig): DataClient {
  return createRepositories(createClient<Database>(config.url, config.anonKey));
}
