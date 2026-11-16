import type { FacilityIcon, FacilityType } from '@indoor/domain';
import type { FacilityIconSpec, IconSource } from '@indoor/map-core';
import { pictogramSvg } from '@indoor/ui';
import { data } from '../../app/data-client';

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
