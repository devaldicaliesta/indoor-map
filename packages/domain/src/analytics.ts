export const ANALYTICS_KINDS = ['visit', 'search', 'location', 'route'] as const;
export type AnalyticsKind = (typeof ANALYTICS_KINDS)[number];

export const ANALYTICS_SOURCES = ['direct', 'origin_qr', 'info_point', 'link', 'embed'] as const;
export type AnalyticsSource = (typeof ANALYTICS_SOURCES)[number];

export const ANALYTICS_DEVICES = ['mobile', 'tablet', 'desktop', 'kiosk'] as const;
export type AnalyticsDevice = (typeof ANALYTICS_DEVICES)[number];

export const ANALYTICS_TARGET_KINDS = ['location', 'unit', 'facility'] as const;
export type AnalyticsTargetKind = (typeof ANALYTICS_TARGET_KINDS)[number];

export const ANALYTICS_ORIGIN_KINDS = [
  'origin_point',
  'info_point',
  'location',
  'unit',
  'facility',
  'point',
] as const;
export type AnalyticsOriginKind = (typeof ANALYTICS_ORIGIN_KINDS)[number];

export const ANALYTICS_BATCH_MAX = 50;
export const ANALYTICS_QUERY_MAX = 100;
export const ANALYTICS_RETENTION_DAYS = 90;

export const ANALYTICS_KIND_LABELS: Record<AnalyticsKind, string> = {
  visit: 'Kunjungan',
  search: 'Pencarian',
  location: 'Lokasi dibuka',
  route: 'Rute dihitung',
};

export const ANALYTICS_SOURCE_LABELS: Record<AnalyticsSource, string> = {
  direct: 'Langsung',
  origin_qr: 'QR titik asal',
  info_point: 'Info Point',
  link: 'Tautan',
  embed: 'Embed',
};

export const ANALYTICS_DEVICE_LABELS: Record<AnalyticsDevice, string> = {
  mobile: 'HP',
  tablet: 'Tablet',
  desktop: 'Komputer',
  kiosk: 'Layar Info Point',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const REF = /^[A-Za-z0-9_-]{1,32}$/;
const LANGUAGES = ['id', 'en'] as const;

export interface AnalyticsContext {
  source: AnalyticsSource;
  sourceRef: string | null;
  language: (typeof LANGUAGES)[number];
  device: AnalyticsDevice;
}

export type AnalyticsEvent = AnalyticsContext &
  (
    | { kind: 'visit' }
    | { kind: 'search'; query: string; resultCount: number }
    | { kind: 'location'; targetKind: 'location'; targetId: string }
    | {
        kind: 'route';
        targetKind: AnalyticsTargetKind;
        targetId: string;
        originKind: AnalyticsOriginKind;
        originRef: string | null;
      }
  );

export function normalizeAnalyticsQuery(query: string): string | null {
  const text = query.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, ANALYTICS_QUERY_MAX);
  return text.length >= 2 ? text : null;
}

const oneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value);

function parseContext(item: Record<string, unknown>): AnalyticsContext | null {
  const { source, sourceRef, language, device } = item;
  if (!oneOf(ANALYTICS_SOURCES, source) || !oneOf(LANGUAGES, language)) return null;
  if (!oneOf(ANALYTICS_DEVICES, device)) return null;
  if (source === 'origin_qr' || source === 'info_point') {
    if (typeof sourceRef !== 'string' || !REF.test(sourceRef)) return null;
    return { source, sourceRef, language, device };
  }
  return sourceRef === null || sourceRef === undefined
    ? { source, sourceRef: null, language, device }
    : null;
}

function parseOriginRef(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' && value.length >= 1 && value.length <= 64 ? value : undefined;
}

function parseEvent(input: unknown): AnalyticsEvent | null {
  if (!input || typeof input !== 'object') return null;
  const item = input as Record<string, unknown>;
  const context = parseContext(item);
  if (!context) return null;
  const targetId =
    typeof item.targetId === 'string' && UUID.test(item.targetId) ? item.targetId : null;
  switch (item.kind) {
    case 'visit':
      return { ...context, kind: 'visit' };
    case 'search': {
      const query = typeof item.query === 'string' ? normalizeAnalyticsQuery(item.query) : null;
      const count = item.resultCount;
      if (!query || typeof count !== 'number' || !Number.isInteger(count)) return null;
      if (count < 0 || count > 10_000) return null;
      return { ...context, kind: 'search', query, resultCount: count };
    }
    case 'location':
      return item.targetKind === 'location' && targetId
        ? { ...context, kind: 'location', targetKind: 'location', targetId }
        : null;
    case 'route': {
      const { targetKind, originKind } = item;
      const originRef = parseOriginRef(item.originRef);
      if (!oneOf(ANALYTICS_TARGET_KINDS, targetKind) || !targetId) return null;
      if (!oneOf(ANALYTICS_ORIGIN_KINDS, originKind) || originRef === undefined) return null;
      return { ...context, kind: 'route', targetKind, targetId, originKind, originRef };
    }
    default:
      return null;
  }
}

export function sanitizeAnalyticsEvents(input: unknown): AnalyticsEvent[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, ANALYTICS_BATCH_MAX).flatMap((item) => {
    const event = parseEvent(item);
    return event ? [event] : [];
  });
}

export interface AnalyticsLink {
  originCode?: string | undefined;
  infoPointCode?: string | undefined;
  locationId?: string | undefined;
  floorId?: string | undefined;
  eventId?: string | undefined;
  from?: unknown;
  to?: unknown;
}

export function analyticsSource(
  link: AnalyticsLink | null,
  options: { infoPointCode?: string | null | undefined; embedded?: boolean },
): Pick<AnalyticsContext, 'source' | 'sourceRef'> {
  if (options.infoPointCode) return { source: 'info_point', sourceRef: options.infoPointCode };
  if (options.embedded) return { source: 'embed', sourceRef: null };
  if (link?.originCode) return { source: 'origin_qr', sourceRef: link.originCode };
  const shared =
    link &&
    (link.locationId || link.from || link.to || link.infoPointCode || link.eventId || link.floorId);
  return { source: shared ? 'link' : 'direct', sourceRef: null };
}

export function analyticsDevice(options: {
  kiosk: boolean;
  width: number;
  coarsePointer: boolean;
}): AnalyticsDevice {
  if (options.kiosk) return 'kiosk';
  if (!options.coarsePointer) return 'desktop';
  return options.width < 600 ? 'mobile' : 'tablet';
}

export interface AnalyticsFact {
  day: string;
  metric: string;
  key: string;
  count: number;
}

export interface AnalyticsTrendDay extends Record<AnalyticsKind, number> {
  day: string;
}

export interface AnalyticsRanked {
  key: string;
  count: number;
}

export interface AnalyticsSummary {
  from: string;
  to: string;
  totals: Record<AnalyticsKind, number>;
  trend: AnalyticsTrendDay[];
  ranked(metric: string, limit?: number): AnalyticsRanked[];
}

export function analyticsDays(from: string, to: string): string[] {
  const days: string[] = [];
  const end = Date.parse(`${to}T00:00:00Z`);
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= end; t += 86_400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

const emptyKinds = (): Record<AnalyticsKind, number> => ({
  visit: 0,
  search: 0,
  location: 0,
  route: 0,
});

export function summarizeAnalytics(
  facts: readonly AnalyticsFact[],
  from: string,
  to: string,
): AnalyticsSummary {
  const totals = emptyKinds();
  const byDay = new Map(analyticsDays(from, to).map((day) => [day, { day, ...emptyKinds() }]));
  const sums = new Map<string, Map<string, number>>();
  for (const fact of facts) {
    if (fact.day < from || fact.day > to) continue;
    if (fact.metric === 'kind' && (ANALYTICS_KINDS as readonly string[]).includes(fact.key)) {
      const kind = fact.key as AnalyticsKind;
      totals[kind] += fact.count;
      const day = byDay.get(fact.day);
      if (day) day[kind] += fact.count;
    }
    const metric = sums.get(fact.metric) ?? new Map<string, number>();
    metric.set(fact.key, (metric.get(fact.key) ?? 0) + fact.count);
    sums.set(fact.metric, metric);
  }
  return {
    from,
    to,
    totals,
    trend: [...byDay.values()],
    ranked(metric, limit = 10) {
      return [...(sums.get(metric) ?? new Map<string, number>())]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
        .slice(0, limit);
    },
  };
}

function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export interface AnalyticsSection {
  title: string;
  rows: { label: string; count: number }[];
}

export function analyticsCsv(summary: AnalyticsSummary, sections: AnalyticsSection[]): string {
  const lines: (string | number)[][] = [
    ['Periode', summary.from, summary.to],
    [],
    ['Tanggal', ...ANALYTICS_KINDS.map((k) => ANALYTICS_KIND_LABELS[k])],
    ...summary.trend.map((d) => [d.day, ...ANALYTICS_KINDS.map((k) => d[k])]),
    ['Total', ...ANALYTICS_KINDS.map((k) => summary.totals[k])],
  ];
  for (const section of sections) {
    lines.push([], [section.title, 'Jumlah'], ...section.rows.map((r) => [r.label, r.count]));
  }
  return `${lines.map((line) => line.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
