import type { FeatureKind } from '@indoor/domain';

/** Nama jenis fitur di Admin (Bahasa Indonesia), urut seperti daftar fitur. */
export const FEATURE_KIND_LABELS: Record<FeatureKind, string> = {
  unit: 'Unit',
  corridor: 'Koridor',
  wall: 'Dinding',
  door: 'Pintu',
  elevator: 'Lift',
  escalator: 'Eskalator',
  stairs: 'Tangga',
  exit: 'Pintu keluar',
  non_walkable: 'Area non-akses',
  outdoor_area: 'Area luar',
  facility: 'Fasilitas',
  landmark: 'Penanda',
};
