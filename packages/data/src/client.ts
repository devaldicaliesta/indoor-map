import { createClient } from '@supabase/supabase-js';
import { type AuthRepository, createAuthRepository } from './auth';
import type { Database } from './database.types';
import { type AliasesRepository, createAliasesRepository } from './repositories/aliases';
import { type AuditRepository, createAuditRepository } from './repositories/audit';
import { type BuildingsRepository, createBuildingsRepository } from './repositories/buildings';
import {
  type CadConverterRepository,
  createCadConverterRepository,
} from './repositories/cad-converter';
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
import { createLicenseRepository, type LicenseRepository } from './repositories/license';
import {
  createLocationTypesRepository,
  type LocationTypesRepository,
} from './repositories/location-types';
import { createLocationsRepository, type LocationsRepository } from './repositories/locations';
import { createMfaRepository, type MfaRepository } from './repositories/mfa';
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
import { createTourProgressRepository, type TourProgressRepository } from './repositories/tours';
import { createTrialRepository, type TrialRepository } from './repositories/trial';
import { createUsersRepository, type UsersRepository } from './repositories/users';
import { createVendorRepository, type VendorRepository } from './repositories/vendor';
import { createVenuesRepository, type VenuesRepository } from './repositories/venues';
import type { Db } from './supabase';

/** Nilai dibaca app dari `import.meta.env`, bukan oleh paket ini. */
export interface DataClientConfig {
  url: string;
  anonKey: string;
  /** Alamat `services/cad-converter`; tanpa ini unggah DXF ditolak dengan pesan jelas. */
  cadConverterUrl?: string | undefined;
}

/** Pintu tunggal app ke database. Klien Supabase mentah tidak pernah diekspos. */
export interface DataClient {
  aliases: AliasesRepository;
  audit: AuditRepository;
  auth: AuthRepository;
  buildings: BuildingsRepository;
  cadConverter: CadConverterRepository;
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
  license: LicenseRepository;
  instructionTemplates: InstructionTemplatesRepository;
  locations: LocationsRepository;
  locationTypes: LocationTypesRepository;
  /** Verifikasi dua langkah Supabase Auth (TOTP); dipakai dasbor vendor. */
  mfa: MfaRepository;
  navGraph: NavGraphRepository;
  originPoints: OriginPointsRepository;
  profiles: ProfilesRepository;
  publications: PublicationsRepository;
  snapshots: SnapshotsRepository;
  systemSettings: SystemSettingsRepository;
  /** Tur panduan Admin yang sudah dilihat pengguna ini. */
  tours: TourProgressRepository;
  trial: TrialRepository;
  users: UsersRepository;
  /** Dasbor vendor trial ter-hosting; hanya staf vendor ber-aal2 yang dilayani server. */
  vendor: VendorRepository;
  venues: VenuesRepository;
}

/** `endpoint` dipakai pelepasan kunci saat tab ditutup; test yang hanya memberi `db` tidak membutuhkannya. */
export function createRepositories(db: Db, endpoint?: DataClientConfig): DataClient {
  const profiles = createProfilesRepository(db);
  return {
    aliases: createAliasesRepository(db),
    audit: createAuditRepository(db),
    auth: createAuthRepository(db, profiles),
    buildings: createBuildingsRepository(db),
    cadConverter: createCadConverterRepository(
      async () => (await db.auth.getSession()).data.session?.access_token ?? null,
      endpoint?.cadConverterUrl,
    ),
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
    license: createLicenseRepository(db),
    instructionTemplates: createInstructionTemplatesRepository(db),
    locations: createLocationsRepository(db),
    locationTypes: createLocationTypesRepository(db),
    mfa: createMfaRepository(db),
    navGraph: createNavGraphRepository(db),
    originPoints: createOriginPointsRepository(db),
    profiles,
    publications: createPublicationsRepository(db),
    snapshots: createSnapshotsRepository(db),
    trial: createTrialRepository(db),
    systemSettings: createSystemSettingsRepository(db),
    tours: createTourProgressRepository(db),
    users: createUsersRepository(db),
    vendor: createVendorRepository(db),
    venues: createVenuesRepository(db),
  };
}

export function createDataClient(config: DataClientConfig): DataClient {
  return createRepositories(createClient<Database>(config.url, config.anonKey), config);
}
