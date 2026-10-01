import { parseFacilityIcon, type SnapshotFacilityType } from '@indoor/domain';
import type { FacilityIconSpec, IconSource } from '@indoor/map-core';
import { pictogramSvg } from '@indoor/ui';
import { data } from '../../data/client';

/** Ikon dari snapshot (`builtin:<kunci>` atau PNG di aset publik) sebagai sumber gambar sprite. */
export function iconSource(icon: string | null): IconSource | null {
  const parsed = parseFacilityIcon(icon);
  if (!parsed) return null;
  return parsed.kind === 'builtin'
    ? { svg: pictogramSvg(parsed.key) }
    : { url: data.snapshots.assetUrl(parsed.path) };
}

/** Sprite ikon fasilitas dari snapshot: piktogram bawaan atau PNG unggahan di aset publik. */
export function facilityIconSpecs(types: readonly SnapshotFacilityType[]): FacilityIconSpec[] {
  return types.map((type) => ({
    typeId: type.id,
    isSafety: type.isSafety,
    source: iconSource(type.icon),
  }));
}
