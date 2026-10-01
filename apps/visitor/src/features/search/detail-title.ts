import type { ExploreTarget, SnapshotIndex } from '@indoor/domain';

/** Judul singkat detail: tombol kembali di header HP dan nama tujuan di panel rute. */
export function detailTitle(index: SnapshotIndex, detail: ExploreTarget): string {
  if (detail.kind === 'location') return index.locations.get(detail.id)?.name ?? '';
  const feature = index.features.get(detail.id);
  if (detail.kind === 'unit') return feature?.properties.unitCode ?? '';
  const typeId = feature?.properties.facilityTypeId;
  return feature?.properties.name ?? (typeId ? index.facilityTypes.get(typeId)?.name : '') ?? '';
}
