import { LOCATION_STATUSES, type LocationStatus } from './location';

export interface VenueDashboard {
  locationStatuses: Record<LocationStatus, number>;
  locationsTotal: number;
  locationsWithoutUnit: number;
  unitsTotal: number;
  unitsWithoutLocation: number;
  closuresActive: number;
  closuresScheduled: number;
  infoPoints: number;
  publication: {
    version: number;
    publishedAt: string;
    origin: 'publish' | 'rollback';
    sourceVersion: number | null;
    publishedBy: string | null;
  } | null;
  draftUpdatedAt: string | null;
}

const count = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
const text = (value: unknown) => (typeof value === 'string' && value ? value : null);
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/** Hasil RPC `venue_dashboard` (snake_case jsonb) menjadi bentuk domain; nilai asing = 0/kosong. */
export function parseVenueDashboard(raw: unknown): VenueDashboard {
  const data = record(raw);
  const statuses = record(data.location_statuses);
  const locationStatuses = Object.fromEntries(
    LOCATION_STATUSES.map((status) => [status, count(statuses[status])]),
  ) as Record<LocationStatus, number>;
  const publication = record(data.publication);
  const version = count(publication.version);
  const publishedAt = text(publication.published_at);
  return {
    locationStatuses,
    locationsTotal: LOCATION_STATUSES.reduce((sum, s) => sum + locationStatuses[s], 0),
    locationsWithoutUnit: count(data.locations_without_unit),
    unitsTotal: count(data.units_total),
    unitsWithoutLocation: count(data.units_without_location),
    closuresActive: count(data.closures_active),
    closuresScheduled: count(data.closures_scheduled),
    infoPoints: count(data.info_points),
    publication:
      version > 0 && publishedAt
        ? {
            version,
            publishedAt,
            origin: publication.origin === 'rollback' ? 'rollback' : 'publish',
            sourceVersion:
              typeof publication.source_version === 'number' ? publication.source_version : null,
            publishedBy: text(publication.published_by),
          }
        : null,
    draftUpdatedAt: text(data.draft_updated_at),
  };
}

/** Draft berubah setelah versi terbit terakhir (atau belum pernah terbit dan sudah ada isi). */
export function hasUnpublishedChanges(dashboard: VenueDashboard): boolean {
  if (!dashboard.draftUpdatedAt) return false;
  if (!dashboard.publication) return true;
  return Date.parse(dashboard.draftUpdatedAt) > Date.parse(dashboard.publication.publishedAt);
}
