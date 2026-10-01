import { type BrowseTarget, targetTitle } from './browse';
import {
  compareSearchScores,
  type PreparedSearchEntry,
  prepareSearchEntries,
  searchEntries,
} from './search';
import type { SearchEntry, SearchTargetKind } from './snapshot';
import { compareNames, type SnapshotLookup } from './snapshot-lookup';

export interface SnapshotSearch {
  lookup: SnapshotLookup;
  entries: PreparedSearchEntry<SearchEntry>[];
}

function opensSomething(lookup: SnapshotLookup, entry: SearchEntry): boolean {
  switch (entry.kind) {
    case 'location':
      return lookup.locations.has(entry.id);
    case 'category':
      return (lookup.categoryLocations.get(entry.id)?.length ?? 0) > 0;
    case 'facility_type':
      return (lookup.typeFacilities.get(entry.id)?.length ?? 0) > 0;
    case 'unit':
      // Unit yang ditempati ditemukan lewat lokasinya (teks lokasi memuat kode unitnya).
      return (
        lookup.features.get(entry.id)?.properties.kind === 'unit' &&
        !lookup.unitLocation.has(entry.id)
      );
  }
}

/**
 * Indeks pencarian snapshot yang siap dipakai, dibuat sekali per snapshot. Kategori dan jenis
 * fasilitas tanpa anggota dilewati karena membukanya hanya menampilkan daftar kosong.
 */
export function prepareSnapshotSearch(lookup: SnapshotLookup): SnapshotSearch {
  const entries = lookup.snapshot.searchIndex.filter((entry) => opensSomething(lookup, entry));
  return { lookup, entries: prepareSearchEntries(entries) };
}

/** Kategori dan jenis fasilitas (yang mewakili banyak tempat) lebih dulu bila sama relevan. */
const KIND_ORDER: Record<SearchTargetKind, number> = {
  category: 0,
  facility_type: 1,
  location: 2,
  unit: 3,
};

/**
 * Pencarian pengunjung di snapshot, tanpa server: nama, kode lokasi, kode unit, alias, dan field
 * yang dapat dicari; awalan kata dan salah ketik ringan (lihat `search.ts`). Urut relevansi,
 * lalu jenis, lalu nama.
 */
export function searchSnapshot(search: SnapshotSearch, query: string): BrowseTarget[] {
  return searchEntries(search.entries, query)
    .map(({ entry, score }) => {
      const target: BrowseTarget = { kind: entry.kind, id: entry.id };
      return {
        target,
        score,
        order: KIND_ORDER[entry.kind],
        title: targetTitle(search.lookup, target) ?? '',
      };
    })
    .sort(
      (a, b) =>
        compareSearchScores(a.score, b.score) ||
        a.order - b.order ||
        compareNames(a.title, b.title),
    )
    .map((item) => item.target);
}
