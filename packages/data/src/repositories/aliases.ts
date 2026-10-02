import type { AliasTarget, VenueId } from '@indoor/domain';
import { toDataError } from '../errors';
import { fetchAllPages } from '../pagination';
import type { Db } from '../supabase';

export interface AliasesRepository {
  /** Alias venue per sasaran, kunci `${kind}:${id}`, terurut kata kunci. */
  listByVenue(venueId: VenueId): Promise<Map<string, string[]>>;
  /** Mengganti seluruh alias satu sasaran (`set_search_aliases`, satu transaksi). */
  set(venueId: VenueId, target: AliasTarget, keywords: readonly string[]): Promise<void>;
}

export const aliasKey = (target: AliasTarget) => `${target.kind}:${target.id}`;

interface AliasRow {
  location_id: string | null;
  category_id: string | null;
  facility_type_id: string | null;
  keyword: string;
}

export function groupAliasRows(rows: readonly AliasRow[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const row of rows) {
    const target: AliasTarget | null = row.location_id
      ? { kind: 'location', id: row.location_id }
      : row.category_id
        ? { kind: 'category', id: row.category_id }
        : row.facility_type_id
          ? { kind: 'facility_type', id: row.facility_type_id }
          : null;
    if (!target) continue;
    const key = aliasKey(target);
    out.set(key, [...(out.get(key) ?? []), row.keyword]);
  }
  for (const list of out.values()) list.sort((a, b) => a.localeCompare(b, 'id'));
  return out;
}

export function createAliasesRepository(db: Db): AliasesRepository {
  return {
    async listByVenue(venueId) {
      const rows = await fetchAllPages((from, to) =>
        db
          .from('search_aliases')
          .select('location_id, category_id, facility_type_id, keyword')
          .eq('venue_id', venueId)
          .order('id')
          .range(from, to),
      );
      return groupAliasRows(rows);
    },

    async set(venueId, target, keywords) {
      const { error } = await db.rpc('set_search_aliases', {
        p_venue_id: venueId,
        p_target_kind: target.kind,
        p_target_id: target.id,
        p_keywords: [...keywords],
      });
      if (error) throw toDataError(error);
    },
  };
}
