import {
  AUDIT_LOG_LIMIT,
  type AuditAction,
  AuditActionSchema,
  type AuditEvent,
} from '@indoor/domain';
import type { Json, Tables } from '../database.types';
import { toDataError } from '../errors';
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

export interface AuditRepository {
  /** 200 peristiwa terakhir, terbaru dulu. Hanya Super Admin (RLS). */
  listRecent(action?: AuditAction): Promise<AuditEvent[]>;
}

export function createAuditRepository(db: Db): AuditRepository {
  return {
    async listRecent(action) {
      let query = db
        .from('audit_events')
        .select('id, occurred_at, action, user_id, entity, entity_id, details')
        .order('occurred_at', { ascending: false })
        .limit(AUDIT_LOG_LIMIT);
      if (action) query = query.eq('action', action);
      const { data: rows, error } = await query;
      if (error) throw toDataError(error);

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
    },
  };
}
