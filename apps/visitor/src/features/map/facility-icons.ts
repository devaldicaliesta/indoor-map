import {
  parseFacilityIcon,
  type SnapshotCategory,
  type SnapshotFacilityType,
  type SnapshotLocationType,
} from '@indoor/domain';
import { categoryIconTypeId, type FacilityIconSpec } from '@indoor/map-core';
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

/**
 * Penanda POI per kategori: lingkaran berwarna kategori dengan piktogramnya (atau titik),
 * digambar bersama sprite fasilitas. Kategori tanpa warna memakai warna tipe lokasinya.
 */
export function categoryIconSpecs(
  categories: readonly SnapshotCategory[],
  types: readonly SnapshotLocationType[],
): FacilityIconSpec[] {
  const typeColor = new Map(types.map((t) => [t.id, t.color]));
  return categories.map((category) => {
    const icon = parseFacilityIcon(category.icon);
    return {
      typeId: categoryIconTypeId(category.id),
      isSafety: false,
      background: category.color ?? typeColor.get(category.locationTypeId) ?? undefined,
      ring: '#ffffff',
      source: !icon
        ? null
        : icon.kind === 'builtin'
          ? { svg: pictogramSvg(icon.key) }
          : { url: data.snapshots.assetUrl(icon.path) },
    };
  });
}
