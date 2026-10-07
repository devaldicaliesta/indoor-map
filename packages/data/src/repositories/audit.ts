import {
  AUDIT_LOG_LIMIT,
  type AuditAction,
  AuditActionSchema,
  type AuditEvent,
} from '@indoor/domain';
import type { Json, Tables } from '../database.types';
import { toDataError } from '../errors';
import { listPage, type Page, type PageQuery } from '../pagination';
import type { Db } from '../supabase';

type AuditRow = Pick<
  Tables<'audit_events'>,
  'id' | 'occurred_at' | 'action' | 'user_id' | 'entity' | 'entity_id' | 'details'
>;
type ActorRow = Pick<Tables<'profiles'>, 'user_id' | 'full_name' | 'email'>;

function asRecord(value: Json): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {};
}

const toPerson = (row: ActorRow) => ({
  userId: row.user_id,
  name: row.full_name,
  email: row.email,
});

/** Baris dengan aksi yang tidak dikenal dilewati, bukan menggagalkan seluruh daftar. */
export function mapAuditRows(rows: AuditRow[], actors: ActorRow[]): AuditEvent[] {
  const byId = new Map(actors.map((a) => [a.user_id, a]));
  return rows.flatMap((row) => {
    const action = AuditActionSchema.safeParse(row.action);
    if (!action.success) return [];
    const actor = row.user_id ? byId.get(row.user_id) : undefined;
    const target = row.entity === 'user' && row.entity_id ? byId.get(row.entity_id) : undefined;
    return [
      {
        id: row.id,
        occurredAt: row.occurred_at,
        action: action.data,
        actor: actor ? toPerson(actor) : null,
        target: target ? toPerson(target) : null,
        entityId: row.entity_id,
        details: asRecord(row.details),
      },
    ];
  });
}

/** Filter tabel Log audit; tanggal kalender (YYYY-MM-DD) di zona waktu tampilan. */
export interface AuditFilters {
  actions: readonly AuditAction[];
  userId: string | null;
  from: string | null;
  to: string | null;
  timeZone: string;
}

export interface AuditRepository {
  /** 200 peristiwa terakhir, terbaru dulu. Hanya Super Admin (RLS). */
  listRecent(action?: AuditAction): Promise<AuditEvent[]>;
  /**
   * Satu halaman Log audit, terbaru dulu, disaring di server (`search_audit_events`). Kata kunci
   * mencari nama/email pelaku dan pengguna sasaran serta nilai rincian. Role selain Super Admin
   * mendapat halaman kosong dengan total 0 (RLS), bukan jumlah yang sebenarnya.
   */
  listPage(query: PageQuery<AuditFilters>): Promise<Page<AuditEvent>>;
}

const AUDIT_COLUMNS = 'id, occurred_at, action, user_id, entity, entity_id, details';

export function createAuditRepository(db: Db): AuditRepository {
  /** Pelaku dan pengguna sasaran (entity `user`) untuk baris-baris itu. */
  async function withPeople(rows: AuditRow[]): Promise<AuditEvent[]> {
    const ids = [
      ...new Set(
        rows.flatMap((r) => [
          ...(r.user_id ? [r.user_id] : []),
          ...(r.entity === 'user' && r.entity_id ? [r.entity_id] : []),
        ]),
      ),
    ];
    const actors = ids.length
      ? await db.from('profiles').select('user_id, full_name, email').in('user_id', ids)
      : { data: [], error: null };
    if (actors.error) throw toDataError(actors.error);
    return mapAuditRows(rows, actors.data ?? []);
  }

  return {
    async listRecent(action) {
      let query = db
        .from('audit_events')
        .select(AUDIT_COLUMNS)
        .order('occurred_at', { ascending: false })
        .limit(AUDIT_LOG_LIMIT);
      if (action) query = query.eq('action', action);
      const { data: rows, error } = await query;
      if (error) throw toDataError(error);
      return withPeople(rows);
    },

    listPage({ q, filters, page, size }) {
      const args = {
        p_query: q,
        ...(filters.actions.length ? { p_actions: [...filters.actions] } : {}),
        ...(filters.userId ? { p_user_id: filters.userId } : {}),
        ...(filters.from ? { p_from: filters.from } : {}),
        ...(filters.to ? { p_to: filters.to } : {}),
        p_time_zone: filters.timeZone,
      };
      return listPage(
        (from, to) =>
          db
            .rpc('search_audit_events', args, { count: 'exact' })
            .select(AUDIT_COLUMNS)
            // id ikut diurutkan agar halaman stabil saat beberapa peristiwa bertanda waktu sama.
            .order('occurred_at', { ascending: false })
            .order('id', { ascending: false })
            .range(from, to),
        { page, size },
        withPeople,
      );
    },
  };
}
