import { createClient } from '@supabase/supabase-js';
import { type AuthRepository, createAuthRepository } from './auth';
import type { Database } from './database.types';
import { type AuditRepository, createAuditRepository } from './repositories/audit';
import { type BuildingsRepository, createBuildingsRepository } from './repositories/buildings';
import { type CategoriesRepository, createCategoriesRepository } from './repositories/categories';
import {
  createDisplaySettingsRepository,
  type DisplaySettingsRepository,
} from './repositories/display-settings';
import {
  createFacilityTypesRepository,
  type FacilityTypesRepository,
} from './repositories/facility-types';
import { createFeaturesRepository, type FeaturesRepository } from './repositories/features';
import { createFloorPlansRepository, type FloorPlansRepository } from './repositories/floor-plans';
import { createFloorsRepository, type FloorsRepository } from './repositories/floors';
import { createLocationsRepository, type LocationsRepository } from './repositories/locations';
import { createNavGraphRepository, type NavGraphRepository } from './repositories/nav-graph';
import { createProfilesRepository, type ProfilesRepository } from './repositories/profiles';
import {
  createPublicationsRepository,
  type PublicationsRepository,
} from './repositories/publications';
import { createSnapshotsRepository, type SnapshotsRepository } from './repositories/snapshots';
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
  categories: CategoriesRepository;
  displaySettings: DisplaySettingsRepository;
  facilityTypes: FacilityTypesRepository;
  features: FeaturesRepository;
  floorPlans: FloorPlansRepository;
  floors: FloorsRepository;
  locations: LocationsRepository;
  navGraph: NavGraphRepository;
  profiles: ProfilesRepository;
  publications: PublicationsRepository;
  snapshots: SnapshotsRepository;
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
    categories: createCategoriesRepository(db),
    displaySettings: createDisplaySettingsRepository(db),
    facilityTypes: createFacilityTypesRepository(db),
    features: createFeaturesRepository(db),
    floorPlans: createFloorPlansRepository(db),
    floors: createFloorsRepository(db),
    locations: createLocationsRepository(db),
    navGraph: createNavGraphRepository(db),
    profiles,
    publications: createPublicationsRepository(db),
    snapshots: createSnapshotsRepository(db),
    systemSettings: createSystemSettingsRepository(db),
    users: createUsersRepository(db),
    venues: createVenuesRepository(db),
  };
}

export function createDataClient(config: DataClientConfig): DataClient {
  return createRepositories(createClient<Database>(config.url, config.anonKey));
}
