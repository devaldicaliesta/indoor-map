import { EARTH_RADIUS_M } from './units';

const RAD = Math.PI / 180;

/**
 * Jarak lingkaran besar (haversine) antara dua koordinat WGS84 dalam meter. Satu rumus untuk
 * panjang edge jalur di editor dan heuristik rute, agar keduanya konsisten.
 */
export function haversineM(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const dLat = (lat2 - lat1) * RAD;
  const dLng = (lng2 - lng1) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** `haversineM` untuk dua posisi `[lng, lat]`. */
export function distanceM(a: readonly number[], b: readonly number[]): number {
  return haversineM(a[0] ?? 0, a[1] ?? 0, b[0] ?? 0, b[1] ?? 0);
}
