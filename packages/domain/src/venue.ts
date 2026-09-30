import type { Point } from './geometry';
import type { BuildingId, VenueId } from './ids';
import { isValidTimezone } from './system-settings';

/** Ringkasan venue untuk pemilih venue. */
export interface VenueSummary {
  id: VenueId;
  name: string;
}

export const VENUE_TYPES = [
  'hospital',
  'campus',
  'office',
  'airport_station',
  'factory_warehouse',
  'shopping_center',
  'custom',
] as const;
export type VenueType = (typeof VENUE_TYPES)[number];

export interface Venue extends VenueSummary {
  address: string | null;
  center: Point | null;
  logoPath: string | null;
  timezone: string;
  venueType: VenueType;
  defaultBuildingId: BuildingId | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueInput {
  name: string;
  address: string | null;
  center: Point | null;
  timezone: string;
}

export type VenueInputProblem = 'name_required' | 'invalid_timezone';

export function checkVenueInput(input: VenueInput): VenueInputProblem[] {
  const problems: VenueInputProblem[] = [];
  if (input.name.trim().length === 0) problems.push('name_required');
  if (!isValidTimezone(input.timezone)) problems.push('invalid_timezone');
  return problems;
}

/**
 * Titik pusat venue dari teks "lat, lng" seperti yang disalin dari Google Maps
 * (misalnya "-6.1754, 106.8272"). Menghasilkan GeoJSON Point [lng, lat].
 */
export function parseLatLng(text: string): Point | null {
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(text);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { type: 'Point', coordinates: [lng, lat] };
}

export function formatLatLng(point: Point): string {
  const [lng, lat] = point.coordinates;
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/** Hapus venue (beserta semua datanya) hanya bila nama diketik ulang persis. */
export function confirmsVenueDeletion(typed: string, venueName: string): boolean {
  return typed.trim() === venueName.trim() && venueName.trim().length > 0;
}
