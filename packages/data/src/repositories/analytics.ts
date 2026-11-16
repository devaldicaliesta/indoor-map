import {
  type AnalyticsEvent,
  type AnalyticsFact,
  type LocalizedText,
  trimTrailingSlashes,
  type VenueId,
} from '@indoor/domain';
import type { DataClientConfig } from '../client';
import { toDataError } from '../errors';
import type { Db } from '../supabase';

export interface AnalyticsConfig {
  enabled: boolean;
  notice: LocalizedText;
}

export interface AnalyticsRepository {
  config(): Promise<AnalyticsConfig>;
  send(
    venueId: VenueId,
    events: readonly AnalyticsEvent[],
    options?: { keepalive?: boolean },
  ): Promise<number>;
  facts(venueId: VenueId, from: string, to: string): Promise<AnalyticsFact[]>;
}

const DISABLED: AnalyticsConfig = { enabled: false, notice: { id: '', en: '' } };

export function createAnalyticsRepository(
  db: Db,
  endpoint?: DataClientConfig,
): AnalyticsRepository {
  const target = endpoint ? `${trimTrailingSlashes(endpoint.url)}/functions/v1/analytics` : null;
  const headers = endpoint
    ? {
        apikey: endpoint.anonKey,
        Authorization: `Bearer ${endpoint.anonKey}`,
        'Content-Type': 'application/json',
      }
    : {};
  return {
    async config() {
      if (!target) return DISABLED;
      const response = await fetch(target, { headers }).catch(() => null);
      if (!response?.ok) return DISABLED;
      const body = (await response.json()) as Partial<AnalyticsConfig>;
      return {
        enabled: body.enabled === true,
        notice: { id: body.notice?.id ?? '', en: body.notice?.en ?? '' },
      };
    },
    async send(venueId, events, options = {}) {
      if (!target || !events.length) return 0;
      const response = await fetch(target, {
        method: 'POST',
        keepalive: options.keepalive ?? false,
        headers,
        body: JSON.stringify({ venueId, events }),
      }).catch(() => null);
      if (!response?.ok) return 0;
      const body = (await response.json().catch(() => ({}))) as { accepted?: number };
      return body.accepted ?? 0;
    },
    async facts(venueId, from, to) {
      const { data, error } = await db.rpc('analytics_facts', {
        p_venue: venueId,
        p_from: from,
        p_to: to,
      });
      if (error) throw toDataError(error);
      return (data ?? []).map((row) => ({
        day: row.day,
        metric: row.metric,
        key: row.key,
        count: Number(row.count),
      }));
    },
  };
}
