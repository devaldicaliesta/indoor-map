import type { DrawKind, FeatureKind, OutdoorSubtype, UnitStatus } from '@indoor/domain';

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

export const OUTDOOR_SUBTYPE_LABELS: Record<OutdoorSubtype, string> = {
  road: 'Jalan/trotoar',
  garden: 'Taman',
  parking: 'Parkir',
};

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  occupied: 'Terisi',
  vacant: 'Kosong',
  renovation: 'Renovasi',
};

export function drawKindLabel(drawKind: DrawKind): string {
  return drawKind.kind === 'outdoor_area' && drawKind.subtype
    ? OUTDOOR_SUBTYPE_LABELS[drawKind.subtype]
    : FEATURE_KIND_LABELS[drawKind.kind];
}

/** Nilai tunggal untuk <Select>: `outdoor_area:garden`, `unit`, … */
export const drawKindValue = (d: DrawKind) => (d.subtype ? `${d.kind}:${d.subtype}` : d.kind);
