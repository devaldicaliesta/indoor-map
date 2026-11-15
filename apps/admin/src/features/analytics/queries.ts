import {
  ANALYTICS_DEVICE_LABELS,
  ANALYTICS_SOURCE_LABELS,
  type AnalyticsDevice,
  type AnalyticsSource,
  type Snapshot,
  type VenueId,
} from '@indoor/domain';
import { useQuery } from '@tanstack/react-query';
import { data } from '../../app/data-client';

export function useAnalyticsFacts(venueId: VenueId, from: string, to: string) {
  return useQuery({
    queryKey: ['analytics', venueId, from, to],
    queryFn: () => data.analytics.facts(venueId, from, to),
  });
}

export function useLatestSnapshot(venueId: VenueId) {
  return useQuery({
    queryKey: ['snapshot', 'latest', venueId],
    queryFn: () => data.snapshots.latest(venueId).catch(() => null),
    staleTime: 5 * 60_000,
  });
}

const LANGUAGE_LABELS: Record<string, string> = { id: 'Indonesia', en: 'English' };

export type KeyLabeler = (metric: string, key: string) => string;

export function keyLabeler(snapshot: Snapshot | null): KeyLabeler {
  const locations = new Map(snapshot?.locations.map((l) => [l.id, l.name]) ?? []);
  const features = new Map(
    snapshot?.features.features.map((f) => [
      f.properties.id,
      f.properties.name ?? f.properties.unitCode ?? '',
    ]) ?? [],
  );
  const infoPoints = new Map(snapshot?.infoPoints.map((p) => [p.code, p.name]) ?? []);
  const originPoints = new Map(snapshot?.originPoints.map((p) => [p.code, p.name]) ?? []);
  const target = (value: string) => {
    const [kind, id = ''] = value.split(':');
    if (kind === 'location') return locations.get(id) ?? 'Lokasi terhapus';
    if (kind === 'origin_point') return originPoints.get(id) ?? `QR ${id}`;
    if (kind === 'info_point') return infoPoints.get(id) ?? `Info Point ${id}`;
    if (kind === 'point') return 'Titik di peta';
    return features.get(id) || (kind === 'facility' ? 'Fasilitas' : 'Unit');
  };
  return (metric, key) => {
    switch (metric) {
      case 'location':
        return locations.get(key) ?? 'Lokasi terhapus';
      case 'route_to':
      case 'route_from':
        return target(key);
      case 'info_point':
        return infoPoints.get(key) ?? key;
      case 'origin_qr':
        return originPoints.get(key) ?? key;
      case 'source':
        return ANALYTICS_SOURCE_LABELS[key as AnalyticsSource] ?? key;
      case 'device':
        return ANALYTICS_DEVICE_LABELS[key as AnalyticsDevice] ?? key;
      case 'language':
        return LANGUAGE_LABELS[key] ?? key;
      default:
        return key;
    }
  };
}
