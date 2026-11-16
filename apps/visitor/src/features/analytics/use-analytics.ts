import {
  type AnalyticsContext,
  type AnalyticsEvent,
  analyticsDevice,
  analyticsSource,
  type ExploreTarget,
  normalizeAnalyticsQuery,
  type SnapshotIndex,
  type VenueId,
} from '@indoor/domain';
import type { RoutePlace } from '@indoor/routing';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { data } from '../../data/client';
import { useInfoPointMode } from '../../infopoint/info-point-mode';
import { useExplore } from '../search/explore-context';
import { privacyChoice, subscribePrivacy, track } from './tracker';

export const SEARCH_SETTLE_MS = 1_200;

type Payload = AnalyticsEvent extends infer E
  ? E extends AnalyticsEvent
    ? Omit<E, keyof AnalyticsContext>
    : never
  : never;

export const analyticsConfigQuery = {
  queryKey: ['analytics-config'] as const,
  queryFn: () => data.analytics.config(),
  staleTime: 10 * 60_000,
};

export function usePrivacyChoice() {
  return useSyncExternalStore(subscribePrivacy, privacyChoice, privacyChoice);
}

export function useAnalyticsConfig(enabled = true) {
  return useQuery({ ...analyticsConfigQuery, enabled }).data ?? null;
}

function embedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function targetEvent(target: ExploreTarget) {
  return { targetKind: target.kind, targetId: target.id };
}

function originEvent(index: SnapshotIndex, origin: RoutePlace) {
  switch (origin.kind) {
    case 'origin_point':
      return { originKind: 'origin_point' as const, originRef: origin.code };
    case 'info_point':
      return { originKind: 'info_point' as const, originRef: origin.code };
    case 'location':
      return { originKind: 'location' as const, originRef: origin.locationId };
    case 'feature': {
      const kind = index.features.get(origin.featureId)?.properties.kind;
      return {
        originKind: kind === 'facility' ? ('facility' as const) : ('unit' as const),
        originRef: origin.featureId,
      };
    }
    default:
      return { originKind: 'point' as const, originRef: null };
  }
}

export function useAnalytics(enabled: boolean) {
  const { snapshot, index, store, search, link } = useExplore();
  const { i18n } = useTranslation();
  const infoPoint = useInfoPointMode();
  const config = useAnalyticsConfig(enabled);
  const { optedOut } = usePrivacyChoice();
  const active = enabled && config?.enabled === true && (infoPoint !== null || !optedOut);
  const kioskCode = infoPoint?.code ?? null;
  const latest = useRef({ search, index, i18n, link });
  latest.current = { search, index, i18n, link };

  useEffect(() => {
    if (!active) return;
    const venueId = snapshot.venue.id as VenueId;
    const origin = analyticsSource(latest.current.link, {
      infoPointCode: kioskCode,
      embedded: embedded(),
    });
    const device = analyticsDevice({
      kiosk: kioskCode !== null,
      width: window.innerWidth,
      coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    });
    const context = (): AnalyticsContext => ({
      ...origin,
      device,
      language: latest.current.i18n.resolvedLanguage === 'en' ? 'en' : 'id',
    });
    const send = (event: Payload) => track(venueId, { ...context(), ...event } as AnalyticsEvent);
    const sendRoute = (state: ReturnType<typeof store.getState>) => {
      const target = state.stops.at(-1) ?? state.destination;
      if (!state.origin || !target) return;
      send({
        kind: 'route',
        ...targetEvent(target),
        ...originEvent(latest.current.index, state.origin),
      });
    };

    send({ kind: 'visit' });
    const initial = store.getState();
    if (initial.detail?.kind === 'location') {
      send({ kind: 'location', targetKind: 'location', targetId: initial.detail.id });
    }
    if (initial.routeSeq > 0) sendRoute(initial);

    let lastQuery = '';
    let pending: { query: string; raw: string; timer: number } | null = null;
    const commit = () => {
      if (!pending) return;
      window.clearTimeout(pending.timer);
      const { query, raw } = pending;
      pending = null;
      if (query === lastQuery) return;
      lastQuery = query;
      send({ kind: 'search', query, resultCount: latest.current.search(raw).length });
    };
    const unsubscribe = store.subscribe((state, previous) => {
      if (state.query !== previous.query) {
        const query = normalizeAnalyticsQuery(state.query);
        if (!query) commit();
        else if (pending?.query !== query) {
          if (pending) window.clearTimeout(pending.timer);
          pending = { query, raw: state.query, timer: window.setTimeout(commit, SEARCH_SETTLE_MS) };
        }
      }
      if (state.detail !== previous.detail || state.routeSeq !== previous.routeSeq) commit();
      if (state.detail !== previous.detail && state.detail?.kind === 'location') {
        send({ kind: 'location', targetKind: 'location', targetId: state.detail.id });
      }
      if (state.routeSeq !== previous.routeSeq) sendRoute(state);
    });
    return () => {
      commit();
      unsubscribe();
    };
  }, [active, snapshot, kioskCode, store]);
}
