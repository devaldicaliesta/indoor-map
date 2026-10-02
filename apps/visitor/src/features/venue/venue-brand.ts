import { brandDisplayName, type Snapshot } from '@indoor/domain';
import { ROUTE_COLOR } from '@indoor/map-core';

export interface VenueBrand {
  /** Nama tampilan branding, atau nama venue. */
  name: string;
  logoUrl: string | null;
  /** Warna garis rute di peta. */
  routeColor: string;
}

/** Snapshot lama tanpa branding memakai nama venue dan warna bawaan. */
export function venueBrand(snapshot: Snapshot, assetUrl: (path: string) => string): VenueBrand {
  const { venue } = snapshot;
  return {
    name: brandDisplayName(venue.name, venue.branding),
    logoUrl: venue.logoPath ? assetUrl(venue.logoPath) : null,
    routeColor: venue.branding?.routeColor ?? ROUTE_COLOR,
  };
}
