import type { Snapshot } from '@indoor/domain';
import { applyBranding } from '@indoor/ui';
import { useEffect } from 'react';
import { data } from '../../data/client';
import { type VenueBrand, venueBrand } from './venue-brand';

/**
 * Branding venue selama venue terbuka: warna dipasang sebagai token di `<html>` (dilepas saat
 * keluar) dan judul tab memakai nama tampilan.
 */
export function useVenueBranding(snapshot: Snapshot): VenueBrand {
  const brand = venueBrand(snapshot, data.snapshots.assetUrl);
  const primaryColor = snapshot.venue.branding?.primaryColor ?? null;
  const routeColor = snapshot.venue.branding?.routeColor ?? null;

  useEffect(
    () => applyBranding(document.documentElement, { primaryColor, routeColor }),
    [primaryColor, routeColor],
  );

  useEffect(() => {
    const previous = document.title;
    document.title = brand.name;
    return () => {
      document.title = previous;
    };
  }, [brand.name]);

  return brand;
}
