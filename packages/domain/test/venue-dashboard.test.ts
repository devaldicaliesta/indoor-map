import { describe, expect, it } from 'vitest';
import { hasUnpublishedChanges, parseVenueDashboard } from '../src';

describe('parseVenueDashboard', () => {
  it('membaca hasil venue_dashboard dan menjumlah lokasi', () => {
    const dashboard = parseVenueDashboard({
      location_statuses: {
        active: 3,
        coming_soon: 1,
        inactive_temporary: 0,
        inactive_permanent: 2,
      },
      locations_without_unit: 2,
      units_total: 5,
      units_without_location: 1,
      closures_active: 1,
      closures_scheduled: 2,
      info_points: 1,
      publication: {
        version: 4,
        published_at: '2026-11-20T10:00:00Z',
        origin: 'rollback',
        source_version: 2,
        published_by: 'Admin',
      },
      draft_updated_at: '2026-11-21T10:00:00Z',
    });
    expect(dashboard.locationsTotal).toBe(6);
    expect(dashboard.locationStatuses.inactive_permanent).toBe(2);
    expect(dashboard.publication).toEqual({
      version: 4,
      publishedAt: '2026-11-20T10:00:00Z',
      origin: 'rollback',
      sourceVersion: 2,
      publishedBy: 'Admin',
    });
    expect(hasUnpublishedChanges(dashboard)).toBe(true);
  });

  it('nilai kosong atau asing menjadi nol, tanpa versi terbit', () => {
    const dashboard = parseVenueDashboard({ location_statuses: { active: -1 }, units_total: 'x' });
    expect(dashboard.locationsTotal).toBe(0);
    expect(dashboard.unitsTotal).toBe(0);
    expect(dashboard.publication).toBeNull();
    expect(hasUnpublishedChanges(dashboard)).toBe(false);
    expect(parseVenueDashboard(null).locationStatuses).toEqual({
      active: 0,
      coming_soon: 0,
      inactive_temporary: 0,
      inactive_permanent: 0,
    });
  });

  it('draft yang belum berubah sejak publish tidak ditandai', () => {
    const dashboard = parseVenueDashboard({
      publication: { version: 1, published_at: '2026-11-21T10:00:00Z' },
      draft_updated_at: '2026-11-20T10:00:00Z',
    });
    expect(hasUnpublishedChanges(dashboard)).toBe(false);
  });
});
