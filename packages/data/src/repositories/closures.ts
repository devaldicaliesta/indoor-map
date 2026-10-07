import type { Closure, ClosureInput, ClosureStatus, VenueId } from '@indoor/domain';
import type { Tables } from '../database.types';
import { toDataError } from '../errors';
import { fetchAllPages, listPage, type Page, type PageQuery } from '../pagination';
import type { Db } from '../supabase';

type ClosureRow = Pick<
  Tables<'closures'>,
  'id' | 'feature_id' | 'edge_id' | 'connector_id' | 'reason' | 'starts_at' | 'ends_at'
>;

/** Filter tabel Penutupan; keadaan dihitung server terhadap waktu sekarang. */
export interface ClosurePageFilters {
  states: readonly ClosureStatus[];
  /** Rentang tanggal kalender (YYYY-MM-DD) yang beririsan dengan masa berlaku penutupan. */
  from: string | null;
  to: string | null;
  timeZone: string;
}

export interface ClosuresRepository {
  /** Penutupan venue yang belum berakhir pada `now`: yang sedang berlaku dan yang terjadwal. */
  listCurrent(venueId: VenueId, now: Date): Promise<Closure[]>;
  /**
   * Satu halaman penutupan (termasuk yang sudah selesai), terbaru mulai lebih dulu, disaring di
   * server (`search_closures`): kata kunci mencari alasan dan nama sasaran.
   */
  listPage(venueId: VenueId, query: PageQuery<ClosurePageFilters>): Promise<Page<Closure>>;
  create(venueId: VenueId, input: ClosureInput): Promise<Closure>;
  /** Mengakhiri sekarang atau memperpanjang; `null` = sampai diakhiri. */
  setEndsAt(id: string, endsAt: string | null): Promise<Closure>;
  /** Membatalkan penutupan terjadwal (yang belum mulai tidak bisa "diakhiri"). */
  remove(id: string): Promise<void>;
}

const COLUMNS = 'id, feature_id, edge_id, connector_id, reason, starts_at, ends_at';

export function toClosureInsert(venueId: VenueId, input: ClosureInput) {
  const { kind, id } = input.target;
  return {
    venue_id: venueId,
    feature_id: kind === 'feature' ? id : null,
    edge_id: kind === 'edge' ? id : null,
    connector_id: kind === 'connector' ? id : null,
    reason: input.reason.trim(),
    starts_at: input.startsAt,
    ends_at: input.endsAt,
  };
}

export function mapClosureRow(row: ClosureRow): Closure {
  return {
    id: row.id,
    featureId: row.feature_id,
    edgeId: row.edge_id,
    connectorId: row.connector_id,
    reason: row.reason,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export function createClosuresRepository(db: Db): ClosuresRepository {
  return {
    async listCurrent(venueId, now) {
      const rows = await fetchAllPages((from, to) =>
        db
          .from('closures')
          .select(COLUMNS)
          .eq('venue_id', venueId)
          .or(`ends_at.is.null,ends_at.gt."${now.toISOString()}"`)
          .order('starts_at')
          .order('id')
          .range(from, to),
      );
      return rows.map(mapClosureRow);
    },
    listPage(venueId, { q, filters, page, size }) {
      const args = {
        p_venue_id: venueId,
        p_query: q,
        ...(filters.states.length ? { p_states: [...filters.states] } : {}),
        ...(filters.from ? { p_from: filters.from } : {}),
        ...(filters.to ? { p_to: filters.to } : {}),
        p_time_zone: filters.timeZone,
      };
      return listPage(
        (from, to) =>
          db
            .rpc('search_closures', args, { count: 'exact' })
            .select(COLUMNS)
            .order('starts_at', { ascending: false })
            .order('id')
            .range(from, to),
        { page, size },
        (rows) => rows.map(mapClosureRow),
      );
    },
    async create(venueId, input) {
      const { data, error } = await db
        .from('closures')
        .insert(toClosureInsert(venueId, input))
        .select(COLUMNS)
        .single();
      if (error) throw toDataError(error);
      return mapClosureRow(data);
    },
    async setEndsAt(id, endsAt) {
      const { data, error } = await db
        .from('closures')
        .update({ ends_at: endsAt })
        .eq('id', id)
        .select(COLUMNS)
        .single();
      if (error) throw toDataError(error);
      return mapClosureRow(data);
    },
    async remove(id) {
      const { error } = await db.from('closures').delete().eq('id', id);
      if (error) throw toDataError(error);
    },
  };
}
