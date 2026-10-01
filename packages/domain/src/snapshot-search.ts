import { prepareSearch, searchEntries } from './search';
import type { SearchTargetKind, Snapshot } from './snapshot';

/** Skor sama: lokasi dulu, lalu kategori, jenis fasilitas, dan unit tanpa lokasi. */
const KIND_ORDER: Record<SearchTargetKind, number> = {
  location: 0,
  category: 1,
  facility_type: 2,
  unit: 3,
};

export const SEARCH_RESULT_LIMIT = 50;

export interface SearchHit {
  kind: SearchTargetKind;
  id: string;
  score: number;
}

export type SnapshotSearch = (query: string, limit?: number) => SearchHit[];

/**
 * Pencarian pengunjung atas `searchIndex` snapshot, seluruhnya di perangkat. Unit yang
 * ditempati lokasi tidak muncul sendiri karena kode unitnya sudah ada di entri lokasi itu.
 */
export function createSnapshotSearch(
  snapshot: Pick<Snapshot, 'searchIndex' | 'locations'>,
): SnapshotSearch {
  const occupied = new Set(snapshot.locations.flatMap((l) => l.unitIds));
  const prepared = prepareSearch(
    snapshot.searchIndex.filter((e) => e.kind !== 'unit' || !occupied.has(e.id)),
  );
  return (query, limit = SEARCH_RESULT_LIMIT) =>
    searchEntries(prepared, query, (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind])
      .slice(0, limit)
      .map(({ entry, score }) => ({ kind: entry.kind, id: entry.id, score }));
}
