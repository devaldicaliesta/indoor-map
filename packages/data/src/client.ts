import { createClient } from '@supabase/supabase-js';
import { type AuthRepository, createAuthRepository } from './auth';
import type { Database } from './database.types';
import { createProfilesRepository, type ProfilesRepository } from './repositories/profiles';
import {
  createSystemSettingsRepository,
  type SystemSettingsRepository,
} from './repositories/system-settings';
import { createVenuesRepository, type VenuesRepository } from './repositories/venues';
import type { Db } from './supabase';

/** Nilai dibaca app dari `import.meta.env`, bukan oleh paket ini. */
export interface DataClientConfig {
  url: string;
  anonKey: string;
}

/** Pintu tunggal app ke database. Klien Supabase mentah tidak pernah diekspos. */
export interface DataClient {
  auth: AuthRepository;
  profiles: ProfilesRepository;
  systemSettings: SystemSettingsRepository;
  venues: VenuesRepository;
}

export function createRepositories(db: Db): DataClient {
  const profiles = createProfilesRepository(db);
  return {
    auth: createAuthRepository(db, profiles),
    profiles,
    systemSettings: createSystemSettingsRepository(db),
    venues: createVenuesRepository(db),
  };
}

export function createDataClient(config: DataClientConfig): DataClient {
  return createRepositories(createClient<Database>(config.url, config.anonKey));
}
