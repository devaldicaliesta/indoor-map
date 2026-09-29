import { createClient } from '@supabase/supabase-js';
import { type AuthRepository, createAuthRepository } from './auth';
import type { Database } from './database.types';
import { type AuditRepository, createAuditRepository } from './repositories/audit';
import { type BuildingsRepository, createBuildingsRepository } from './repositories/buildings';
import { createFeaturesRepository, type FeaturesRepository } from './repositories/features';
import { createFloorPlansRepository, type FloorPlansRepository } from './repositories/floor-plans';
import { createFloorsRepository, type FloorsRepository } from './repositories/floors';
import { createProfilesRepository, type ProfilesRepository } from './repositories/profiles';
import {
  createSystemSettingsRepository,
  type SystemSettingsRepository,
} from './repositories/system-settings';
import { createUsersRepository, type UsersRepository } from './repositories/users';
import { createVenuesRepository, type VenuesRepository } from './repositories/venues';
import type { Db } from './supabase';

/** Nilai dibaca app dari `import.meta.env`, bukan oleh paket ini. */
export interface DataClientConfig {
  url: string;
  anonKey: string;
}

/** Pintu tunggal app ke database. Klien Supabase mentah tidak pernah diekspos. */
export interface DataClient {
  audit: AuditRepository;
  auth: AuthRepository;
  buildings: BuildingsRepository;
  features: FeaturesRepository;
  floorPlans: FloorPlansRepository;
  floors: FloorsRepository;
  profiles: ProfilesRepository;
  systemSettings: SystemSettingsRepository;
  users: UsersRepository;
  venues: VenuesRepository;
}

export function createRepositories(db: Db): DataClient {
  const profiles = createProfilesRepository(db);
  return {
    audit: createAuditRepository(db),
    auth: createAuthRepository(db, profiles),
    buildings: createBuildingsRepository(db),
    features: createFeaturesRepository(db),
    floorPlans: createFloorPlansRepository(db),
    floors: createFloorsRepository(db),
    profiles,
    systemSettings: createSystemSettingsRepository(db),
    users: createUsersRepository(db),
    venues: createVenuesRepository(db),
  };
}

export function createDataClient(config: DataClientConfig): DataClient {
  return createRepositories(createClient<Database>(config.url, config.anonKey));
}
