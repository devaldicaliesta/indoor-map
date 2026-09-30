import type { FacilityIcon, FacilityType, PictogramKey } from '@indoor/domain';
import type { FacilityIconSpec, IconSource } from '@indoor/map-core';
import { pictogramSvg } from '@indoor/ui';
import { data } from '../../app/data-client';

/** Nama piktogram bawaan di pemilih ikon. */
export const PICTOGRAM_LABELS: Record<PictogramKey, string> = {
  'toilet-male': 'Toilet pria',
  'toilet-female': 'Toilet wanita',
  'toilet-accessible': 'Toilet difabel',
  'prayer-room': 'Musala',
  atm: 'ATM',
  'first-aid': 'P3K',
  information: 'Informasi',
  'fire-extinguisher': 'APAR',
  'assembly-point': 'Titik kumpul',
  'emergency-exit': 'Pintu darurat',
  elevator: 'Lift',
  escalator: 'Eskalator',
  stairs: 'Tangga',
  parking: 'Parkir',
};

export function iconSource(icon: FacilityIcon | null): IconSource | null {
  if (!icon) return null;
  return icon.kind === 'builtin'
    ? { svg: pictogramSvg(icon.key) }
    : { url: data.facilityTypes.iconUrl(icon.path) };
}

/** Sprite peta untuk semua jenis fasilitas venue. */
export function facilityIconSpecs(
  types: readonly Pick<FacilityType, 'id' | 'icon' | 'isSafety'>[],
): FacilityIconSpec[] {
  return types.map((t) => ({ typeId: t.id, isSafety: t.isSafety, source: iconSource(t.icon) }));
}
