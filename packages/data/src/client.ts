import { createClient } from '@supabase/supabase-js';
import { type AuthRepository, createAuthRepository } from './auth';
import type { Database } from './database.types';
import { type AliasesRepository, createAliasesRepository } from './repositories/aliases';
import { type AnalyticsRepository, createAnalyticsRepository } from './repositories/analytics';
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
import { createEventsRepository, type EventsRepository } from './repositories/events';
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
  createLocationBulkEditsRepository,
  type LocationBulkEditsRepository,
} from './repositories/location-bulk-edits';
import {
  createLocationTypesRepository,
  type LocationTypesRepository,
} from './repositories/location-types';
import { createLocationsRepository, type LocationsRepository } from './repositories/locations';
import { createMediaRepository, type MediaRepository } from './repositories/media';
import { createMfaRepository, type MfaRepository } from './repositories/mfa';
import { createModels3dRepository, type Models3dRepository } from './repositories/models3d';
import { createNavGraphRepository, type NavGraphRepository } from './repositories/nav-graph';
import {
  createNotificationsRepository,
  type NotificationsRepository,
} from './repositories/notifications';
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
  createSystemHealthRepository,
  type SystemHealthRepository,
} from './repositories/system-health';
import {
  createSystemSettingsRepository,
  type SystemSettingsRepository,
} from './repositories/system-settings';
import { createTourProgressRepository, type TourProgressRepository } from './repositories/tours';
import { createTrialRepository, type TrialRepository } from './repositories/trial';
import { createUsersRepository, type UsersRepository } from './repositories/users';
import { createVendorRepository, type VendorRepository } from './repositories/vendor';
import {
  createVenueDashboardRepository,
  type VenueDashboardRepository,
} from './repositories/venue-dashboard';
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
  analytics: AnalyticsRepository;
  audit: AuditRepository;
  auth: AuthRepository;
  buildings: BuildingsRepository;
  cadConverter: CadConverterRepository;
  categories: CategoriesRepository;
  closures: ClosuresRepository;
  events: EventsRepository;
  connectors: ConnectorsRepository;
  displaySettings: DisplaySettingsRepository;
  editLocks: EditLocksRepository;
  facilityTypes: FacilityTypesRepository;
  models3d: Models3dRepository;
  features: FeaturesRepository;
  floorPlans: FloorPlansRepository;
  floors: FloorsRepository;
  infoPoints: InfoPointsRepository;
  license: LicenseRepository;
  instructionTemplates: InstructionTemplatesRepository;
  locations: LocationsRepository;
  /** Edit massal lokasi dan undo-nya (T-573). */
  locationBulkEdits: LocationBulkEditsRepository;
  locationTypes: LocationTypesRepository;
  /** Pustaka media venue: daftar berkas, pemakaian, unggah, hapus yang tidak terpakai. */
  media: MediaRepository;
  /** Verifikasi dua langkah Supabase Auth (TOTP); dasbor vendor dan Admin. */
  mfa: MfaRepository;
  navGraph: NavGraphRepository;
  /** Preferensi notifikasi email dan berhenti langganan (T-598). */
  notifications: NotificationsRepository;
  originPoints: OriginPointsRepository;
  profiles: ProfilesRepository;
  publications: PublicationsRepository;
  snapshots: SnapshotsRepository;
  /** Kesehatan sistem dari agen server (T-597); hanya Super Admin. */
  systemHealth: SystemHealthRepository;
  systemSettings: SystemSettingsRepository;
  /** Tur panduan Admin yang sudah dilihat pengguna ini. */
  tours: TourProgressRepository;
  trial: TrialRepository;
  users: UsersRepository;
  /** Dasbor vendor trial ter-hosting; hanya staf vendor ber-aal2 yang dilayani server. */
  vendor: VendorRepository;
  venues: VenuesRepository;
  venueDashboard: VenueDashboardRepository;
}

/** `endpoint` dipakai pelepasan kunci saat tab ditutup; test yang hanya memberi `db` tidak membutuhkannya. */
export function createRepositories(db: Db, endpoint?: DataClientConfig): DataClient {
  const profiles = createProfilesRepository(db);
  return {
    aliases: createAliasesRepository(db),
    analytics: createAnalyticsRepository(db, endpoint),
    audit: createAuditRepository(db),
    auth: createAuthRepository(db, profiles),
    buildings: createBuildingsRepository(db),
    cadConverter: createCadConverterRepository(
      async () => (await db.auth.getSession()).data.session?.access_token ?? null,
      endpoint?.cadConverterUrl,
    ),
    categories: createCategoriesRepository(db),
    closures: createClosuresRepository(db),
    events: createEventsRepository(db),
    connectors: createConnectorsRepository(db),
    displaySettings: createDisplaySettingsRepository(db),
    editLocks: createEditLocksRepository(db, endpoint),
    facilityTypes: createFacilityTypesRepository(db),
    models3d: createModels3dRepository(db),
    features: createFeaturesRepository(db),
    floorPlans: createFloorPlansRepository(db),
    floors: createFloorsRepository(db),
    infoPoints: createInfoPointsRepository(db),
    license: createLicenseRepository(db),
    instructionTemplates: createInstructionTemplatesRepository(db),
    locations: createLocationsRepository(db),
    locationBulkEdits: createLocationBulkEditsRepository(db),
    locationTypes: createLocationTypesRepository(db),
    media: createMediaRepository(db),
    mfa: createMfaRepository(db),
    navGraph: createNavGraphRepository(db),
    notifications: createNotificationsRepository(db),
    originPoints: createOriginPointsRepository(db),
    profiles,
    publications: createPublicationsRepository(db),
    snapshots: createSnapshotsRepository(db),
    trial: createTrialRepository(db),
    systemHealth: createSystemHealthRepository(db),
    systemSettings: createSystemSettingsRepository(db),
    tours: createTourProgressRepository(db),
    users: createUsersRepository(db),
    vendor: createVendorRepository(db),
    venues: createVenuesRepository(db),
    venueDashboard: createVenueDashboardRepository(db),
  };
}

export function createDataClient(config: DataClientConfig): DataClient {
  return createRepositories(createClient<Database>(config.url, config.anonKey), config);
}
