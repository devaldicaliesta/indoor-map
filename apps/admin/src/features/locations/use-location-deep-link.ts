import {
  type BuildingId,
  BuildingIdSchema,
  type FeatureId,
  FeatureIdSchema,
  type Location,
  LocationIdSchema,
  type VenueId,
} from '@indoor/domain';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { LOCATION_FILTER } from './location-table';
import { useLocation } from './queries';

export type DeepLinkTarget = { location: Location | null; unitId: FeatureId | null };

/**
 * Tautan dari editor: `?location=<id>` membuka lokasi (walau di luar halaman tabel saat ini),
 * `?unit=<id>` membuat lokasi untuk unit itu. Parameter tabel lain di URL tetap.
 */
export function useDeepLink(venueId: VenueId, open: (target: DeepLinkTarget) => void) {
  const [params, setParams] = useSearchParams();
  const locationId = LocationIdSchema.safeParse(params.get('location'));
  const unitId = FeatureIdSchema.safeParse(params.get('unit'));
  const target = useLocation(venueId, locationId.success ? locationId.data : null);
  useEffect(() => {
    if (!unitId.success && (!locationId.success || target.isPending)) return;
    if (target.data) open({ location: target.data, unitId: null });
    else if (unitId.success) open({ location: null, unitId: unitId.data });
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('location');
        next.delete('unit');
        return next;
      },
      { replace: true },
    );
  }, [
    locationId.success,
    unitId.success,
    unitId.data,
    target.isPending,
    target.data,
    open,
    setParams,
  ]);
}

/** Gedung terpilih di URL (bukan Area Luar), untuk pilihan filter lantai. */
export function useSelectedBuilding(): BuildingId | null {
  const [params] = useSearchParams();
  const parsed = BuildingIdSchema.safeParse(params.get(LOCATION_FILTER.building));
  return parsed.success ? parsed.data : null;
}
