import {
  type BulkLocationChange,
  bulkChangePayload,
  type LocationBulkEdit,
  type LocationId,
  type VenueId,
} from '@indoor/domain';
import type { Json } from '../database.types';
import { toDataError } from '../errors';
import type { Db } from '../supabase';

const COLUMNS = 'id, change, location_count, created_by, created_at, undone_at';

interface BulkEditRow {
  id: string;
  change: unknown;
  location_count: number;
  created_by: string | null;
  created_at: string;
  undone_at: string | null;
}

function mapBulkEditRow(row: BulkEditRow): LocationBulkEdit {
  const change =
    row.change && typeof row.change === 'object' && !Array.isArray(row.change)
      ? (row.change as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    change,
    locationCount: row.location_count,
    createdAt: row.created_at,
    createdBy: row.created_by,
    undoneAt: row.undone_at,
  };
}

export interface LocationBulkEditsRepository {
  /** Satu transaksi di server; mengembalikan edit massal yang tersimpan (untuk undo). */
  apply(
    venueId: VenueId,
    locationIds: readonly LocationId[],
    change: BulkLocationChange,
  ): Promise<LocationBulkEdit>;
  /** Edit massal terakhir venue, termasuk yang sudah diurungkan; `null` bila belum pernah. */
  latest(venueId: VenueId): Promise<LocationBulkEdit | null>;
  /** Memulihkan nilai sebelum edit massal; hanya edit terakhir. Mengembalikan jumlah lokasi. */
  undo(id: string): Promise<number>;
}

export function createLocationBulkEditsRepository(db: Db): LocationBulkEditsRepository {
  async function get(id: string) {
    const { data, error } = await db
      .from('location_bulk_edits')
      .select(COLUMNS)
      .eq('id', id)
      .single();
    if (error) throw toDataError(error);
    return mapBulkEditRow(data as BulkEditRow);
  }

  return {
    async apply(venueId, locationIds, change) {
      const { data, error } = await db.rpc('bulk_edit_locations', {
        p_venue_id: venueId,
        p_location_ids: [...locationIds],
        p_change: bulkChangePayload(change) as Json,
      });
      if (error) throw toDataError(error);
      return get(data);
    },

    async latest(venueId) {
      const { data, error } = await db
        .from('location_bulk_edits')
        .select(COLUMNS)
        .eq('venue_id', venueId)
        .order('seq', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw toDataError(error);
      return data ? mapBulkEditRow(data as BulkEditRow) : null;
    },

    async undo(id) {
      const { data, error } = await db.rpc('undo_location_bulk_edit', { p_id: id });
      if (error) throw toDataError(error);
      return data;
    },
  };
}
