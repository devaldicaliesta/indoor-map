import { parseFacilityIcon, type SnapshotFacilityType } from '@indoor/domain';
import type { FacilityIconSpec } from '@indoor/map-core';
import { pictogramSvg } from '@indoor/ui';
import { data } from '../../data/client';

/** Sprite ikon fasilitas dari snapshot: piktogram bawaan atau PNG unggahan di aset publik. */
export function facilityIconSpecs(types: readonly SnapshotFacilityType[]): FacilityIconSpec[] {
  return types.map((type) => {
    const icon = parseFacilityIcon(type.icon);
    return {
      typeId: type.id,
      isSafety: type.isSafety,
      source: !icon
        ? null
        : icon.kind === 'builtin'
          ? { svg: pictogramSvg(icon.key) }
          : { url: data.snapshots.assetUrl(icon.path) },
    };
  });
}
