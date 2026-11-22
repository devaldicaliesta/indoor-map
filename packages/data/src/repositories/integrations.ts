import {
  API_SCOPES,
  type ApiKey,
  type ApiScope,
  WEBHOOK_DELIVERY_STATUSES,
  WEBHOOK_EVENTS,
  type Webhook,
  type WebhookDelivery,
  type WebhookDeliveryStatus,
  type WebhookEvent,
} from '@indoor/domain';
import { toDataError } from '../errors';
import { listPage, type Page, type PageQuery } from '../pagination';
import type { Db } from '../supabase';

export interface ApiKeyInput {
  name: string;
  scopes: readonly ApiScope[];
  /** `null` = semua venue, termasuk venue yang dibuat nanti. */
  venueIds: readonly string[] | null;
}

export interface WebhookInput {
  name: string;
  url: string;
  events: readonly WebhookEvent[];
  venueIds: readonly string[] | null;
}

export interface DeliveryFilters {
  statuses: readonly WebhookDeliveryStatus[];
  webhookId: string | null;
}

export interface IntegrationsRepository {
  listApiKeys(): Promise<ApiKey[]>;
  /** Kunci utuh hanya dikembalikan sekali di sini; server hanya menyimpan hash-nya. */
  createApiKey(input: ApiKeyInput): Promise<{ id: string; key: string }>;
  revokeApiKey(id: string): Promise<void>;
  listWebhooks(): Promise<Webhook[]>;
  /** Rahasia penandatangan hanya dikembalikan saat dibuat atau diganti. */
  createWebhook(input: WebhookInput): Promise<{ id: string; secret: string }>;
  updateWebhook(id: string, input: WebhookInput & { active: boolean }): Promise<void>;
  removeWebhook(id: string): Promise<void>;
  rotateWebhookSecret(id: string): Promise<string>;
  pingWebhook(id: string): Promise<string>;
  listDeliveries(query: PageQuery<DeliveryFilters>): Promise<Page<WebhookDelivery>>;
  redeliver(id: string): Promise<void>;
}

const KEY_COLUMNS =
  'id, name, prefix, scopes, venue_ids, created_by, created_at, last_used_at, revoked_at';
const WEBHOOK_COLUMNS = 'id, name, url, events, venue_ids, active, created_at';
const DELIVERY_COLUMNS =
  'id, webhook_id, event, status, attempts, response_status, error, created_at, last_attempt_at, next_attempt_at, delivered_at, webhooks(name)';

const only = <T extends string>(allowed: readonly T[], values: readonly string[]) =>
  values.filter((v): v is T => (allowed as readonly string[]).includes(v));

export function createIntegrationsRepository(db: Db): IntegrationsRepository {
  async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await db.rpc(name as never, args as never);
    if (error) throw toDataError(error);
    return data as T;
  }

  return {
    async listApiKeys() {
      const { data, error } = await db
        .from('api_keys')
        .select(KEY_COLUMNS)
        .order('revoked_at', { ascending: false, nullsFirst: true })
        .order('created_at', { ascending: false });
      if (error) throw toDataError(error);
      return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        prefix: row.prefix,
        scopes: only(API_SCOPES, row.scopes),
        venueIds: row.venue_ids,
        createdAt: row.created_at,
        createdBy: row.created_by,
        lastUsedAt: row.last_used_at,
        revokedAt: row.revoked_at,
      }));
    },

    createApiKey(input) {
      return rpc('create_api_key', {
        p_name: input.name,
        p_scopes: input.scopes,
        p_venue_ids: input.venueIds,
      });
    },

    async revokeApiKey(id) {
      await rpc('revoke_api_key', { p_id: id });
    },

    async listWebhooks() {
      const { data, error } = await db
        .from('webhooks')
        .select(WEBHOOK_COLUMNS)
        .order('created_at', { ascending: false });
      if (error) throw toDataError(error);
      return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        url: row.url,
        events: only(WEBHOOK_EVENTS, row.events),
        venueIds: row.venue_ids,
        active: row.active,
        createdAt: row.created_at,
      }));
    },

    createWebhook(input) {
      return rpc('create_webhook', {
        p_name: input.name,
        p_url: input.url,
        p_events: input.events,
        p_venue_ids: input.venueIds,
      });
    },

    async updateWebhook(id, input) {
      await rpc('update_webhook', {
        p_id: id,
        p_name: input.name,
        p_url: input.url,
        p_events: input.events,
        p_venue_ids: input.venueIds,
        p_active: input.active,
      });
    },

    async removeWebhook(id) {
      await rpc('delete_webhook', { p_id: id });
    },

    rotateWebhookSecret(id) {
      return rpc('rotate_webhook_secret', { p_id: id });
    },

    pingWebhook(id) {
      return rpc('ping_webhook', { p_id: id });
    },

    listDeliveries(query) {
      const statuses = only(WEBHOOK_DELIVERY_STATUSES, query.filters.statuses);
      const q = query.q.trim();
      return listPage(
        (from, to) => {
          let request = db
            .from('webhook_deliveries')
            .select(DELIVERY_COLUMNS, { count: 'exact' })
            .order('created_at', { ascending: false })
            .order('id');
          if (statuses.length) request = request.in('status', statuses);
          if (query.filters.webhookId) request = request.eq('webhook_id', query.filters.webhookId);
          if (q) request = request.ilike('event', `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
          return request.range(from, to);
        },
        query,
        (rows) =>
          rows.map((row) => ({
            id: row.id,
            webhookId: row.webhook_id,
            webhookName: row.webhooks?.name ?? '',
            event: row.event,
            status: (only(WEBHOOK_DELIVERY_STATUSES, [row.status])[0] ??
              'pending') as WebhookDeliveryStatus,
            attempts: row.attempts,
            responseStatus: row.response_status,
            error: row.error,
            createdAt: row.created_at,
            lastAttemptAt: row.last_attempt_at,
            nextAttemptAt: row.next_attempt_at,
            deliveredAt: row.delivered_at,
          })),
      );
    },

    async redeliver(id) {
      await rpc('redeliver_webhook', { p_delivery_id: id });
    },
  };
}
