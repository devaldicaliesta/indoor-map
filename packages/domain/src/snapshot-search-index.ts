import { normalizeSearchText } from './search.ts';
import type {
  SearchEntry,
  SnapshotCategory,
  SnapshotFacilityType,
  SnapshotFeature,
} from './snapshot.ts';
import type { SourceAlias, SourceLocation } from './snapshot-source.ts';

function searchText(parts: readonly (string | null | undefined)[]): string {
  return normalizeSearchText(parts.filter((p): p is string => Boolean(p?.trim())).join(' '));
}

function searchableValues(l: SourceLocation, searchableKeys: ReadonlySet<string>): string[] {
  const values: string[] = [];
  for (const [key, value] of Object.entries(l.customFields)) {
    if (!searchableKeys.has(key)) continue;
    if (typeof value === 'string' || typeof value === 'number') values.push(String(value));
    else if (Array.isArray(value)) values.push(...value.filter((v) => typeof v === 'string'));
  }
  return values;
}

export interface SearchInput {
  locations: readonly SourceLocation[];
  categories: readonly SnapshotCategory[];
  facilityTypes: readonly SnapshotFacilityType[];
  units: readonly SnapshotFeature[];
  aliases: readonly SourceAlias[];
  searchableKeys: ReadonlyMap<string, ReadonlySet<string>>;
}

/**
 * Satu entri per lokasi (nama, kode, kode unit, alias, field yang dapat dicari), kategori,
 * jenis fasilitas (nama dan alias), dan unit (kode dan nama).
 */
export function buildSearchIndex(input: SearchInput): SearchEntry[] {
  const aliases = new Map<string, string[]>();
  for (const a of input.aliases) {
    const key = `${a.targetKind}:${a.targetId}`;
    aliases.set(key, [...(aliases.get(key) ?? []), a.keyword]);
  }
  const aliasesOf = (kind: SourceAlias['targetKind'], id: string) =>
    aliases.get(`${kind}:${id}`) ?? [];
  const unitCodes = new Map(input.units.map((u) => [u.id, u.properties.unitCode]));

  return [
    ...input.locations.map((l) => ({
      kind: 'location' as const,
      id: l.id,
      text: searchText([
        l.name,
        l.code,
        ...l.unitIds.map((id) => unitCodes.get(id)),
        ...aliasesOf('location', l.id),
        ...searchableValues(l, input.searchableKeys.get(l.locationTypeId) ?? new Set()),
      ]),
    })),
    ...input.categories.map((c) => ({
      kind: 'category' as const,
      id: c.id,
      text: searchText([c.name, ...aliasesOf('category', c.id)]),
    })),
    ...input.facilityTypes.map((t) => ({
      kind: 'facility_type' as const,
      id: t.id,
      text: searchText([t.name, ...aliasesOf('facility_type', t.id)]),
    })),
    ...input.units.map((u) => ({
      kind: 'unit' as const,
      id: u.id,
      text: searchText([u.properties.unitCode, u.properties.name]),
    })),
  ];
}
