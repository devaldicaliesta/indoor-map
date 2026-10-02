import { createClient } from '@supabase/supabase-js';
import { type AuthRepository, createAuthRepository } from './auth';
import type { Database } from './database.types';
import { type AuditRepository, createAuditRepository } from './repositories/audit';
import { type BuildingsRepository, createBuildingsRepository } from './repositories/buildings';
import { type CategoriesRepository, createCategoriesRepository } from './repositories/categories';
import { type ClosuresRepository, createClosuresRepository } from './repositories/closures';
import { type ConnectorsRepository, createConnectorsRepository } from './repositories/connectors';
import {
  createDisplaySettingsRepository,
  type DisplaySettingsRepository,
} from './repositories/display-settings';
import { createEditLocksRepository, type EditLocksRepository } from './repositories/edit-locks';
import {
  createFacilityTypesRepository,
  type FacilityTypesRepository,
} from './repositories/facility-types';
import { createFeaturesRepository, type FeaturesRepository } from './repositories/features';
import { createFloorPlansRepository, type FloorPlansRepository } from './repositories/floor-plans';
import { createFloorsRepository, type FloorsRepository } from './repositories/floors';
import { createInfoPointsRepository, type InfoPointsRepository } from './repositories/info-points';
import {
  createInstructionTemplatesRepository,
  type InstructionTemplatesRepository,
} from './repositories/instruction-templates';
import {
  createLocationTypesRepository,
  type LocationTypesRepository,
} from './repositories/location-types';
import { createLocationsRepository, type LocationsRepository } from './repositories/locations';
import { createNavGraphRepository, type NavGraphRepository } from './repositories/nav-graph';
import {
  createOriginPointsRepository,
  type OriginPointsRepository,
} from './repositories/origin-points';
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
  closures: ClosuresRepository;
  connectors: ConnectorsRepository;
  displaySettings: DisplaySettingsRepository;
  editLocks: EditLocksRepository;
  facilityTypes: FacilityTypesRepository;
  features: FeaturesRepository;
  floorPlans: FloorPlansRepository;
  floors: FloorsRepository;
  infoPoints: InfoPointsRepository;
  instructionTemplates: InstructionTemplatesRepository;
  locations: LocationsRepository;
  locationTypes: LocationTypesRepository;
  navGraph: NavGraphRepository;
  originPoints: OriginPointsRepository;
  profiles: ProfilesRepository;
  publications: PublicationsRepository;
  snapshots: SnapshotsRepository;
  systemSettings: SystemSettingsRepository;
  users: UsersRepository;
  venues: VenuesRepository;
}

/** `endpoint` dipakai pelepasan kunci saat tab ditutup; test yang hanya memberi `db` tidak membutuhkannya. */
export function createRepositories(db: Db, endpoint?: DataClientConfig): DataClient {
  const profiles = createProfilesRepository(db);
  return {
    audit: createAuditRepository(db),
    auth: createAuthRepository(db, profiles),
    buildings: createBuildingsRepository(db),
    categories: createCategoriesRepository(db),
    closures: createClosuresRepository(db),
    connectors: createConnectorsRepository(db),
    displaySettings: createDisplaySettingsRepository(db),
    editLocks: createEditLocksRepository(db, endpoint),
    facilityTypes: createFacilityTypesRepository(db),
    features: createFeaturesRepository(db),
    floorPlans: createFloorPlansRepository(db),
    floors: createFloorsRepository(db),
    infoPoints: createInfoPointsRepository(db),
    instructionTemplates: createInstructionTemplatesRepository(db),
    locations: createLocationsRepository(db),
    locationTypes: createLocationTypesRepository(db),
    navGraph: createNavGraphRepository(db),
    originPoints: createOriginPointsRepository(db),
    profiles,
    publications: createPublicationsRepository(db),
    snapshots: createSnapshotsRepository(db),
    systemSettings: createSystemSettingsRepository(db),
    users: createUsersRepository(db),
    venues: createVenuesRepository(db),
  };
}

export function createDataClient(config: DataClientConfig): DataClient {
  return createRepositories(createClient<Database>(config.url, config.anonKey), config);
}
