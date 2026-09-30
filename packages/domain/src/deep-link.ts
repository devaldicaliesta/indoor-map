import { z } from 'zod';
import {
  type BuildingId,
  BuildingIdSchema,
  type FloorId,
  FloorIdSchema,
  type LocationId,
  LocationIdSchema,
  type VenueId,
  VenueIdSchema,
} from './ids';
import { type LanguageCode, LanguageCodeSchema } from './language';

/** Koordinat ditulis 7 desimal (≈ 1 cm), sama dengan presisi snapshot. */
export const DEEP_LINK_COORDINATE_DECIMALS = 7;

/** Ujung rute: lokasi, atau titik di lantai (ketuk peta, fasilitas, unit tanpa lokasi). */
export type RouteEnd =
  | { kind: 'location'; locationId: LocationId }
  | { kind: 'point'; lng: number; lat: number; floorId: FloorId };

/**
 * Keadaan Visitor yang bisa dibagikan (FR-VST-12). Hanya id, kode publik, koordinat, dan
 * pilihan tampilan: tidak ada data pribadi pengunjung.
 */
export interface DeepLink {
  venueId: VenueId;
  buildingId?: BuildingId;
  floorId?: FloorId;
  locationId?: LocationId;
  /** Kode publik QR titik asal (`origin_points.public_code`). */
  originCode?: string;
  /** Kode Info Point sebagai titik asal (QR "Lanjutkan di HP"). */
  infoPointCode?: string;
  from?: RouteEnd;
  to?: RouteEnd;
  accessible?: boolean;
  language?: LanguageCode;
}

export const OriginCodeSchema = z.string().regex(/^[0-9a-f]{12}$/);
export const InfoPointCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{1,32}$/);

/** Angka desimal biasa; string kosong, `Infinity`, atau notasi `1e3` ditolak. */
const coordinate = (limit: number) =>
  z
    .string()
    .regex(/^-?\d{1,3}(\.\d+)?$/)
    .transform(Number)
    .pipe(z.number().min(-limit).max(limit));

const PointEndSchema = z
  .string()
  .transform((value) => value.split(','))
  .pipe(z.tuple([coordinate(180), coordinate(90), FloorIdSchema]))
  .transform(([lng, lat, floorId]): RouteEnd => ({ kind: 'point', lng, lat, floorId }));

const LocationEndSchema = LocationIdSchema.transform(
  (locationId): RouteEnd => ({ kind: 'location', locationId }),
);

/** Skema tiap parameter URL; nilai yang tidak lolos dibuang satu per satu. */
export const DeepLinkParamSchemas = {
  v: VenueIdSchema,
  b: BuildingIdSchema,
  f: FloorIdSchema,
  loc: LocationIdSchema,
  o: OriginCodeSchema,
  ip: InfoPointCodeSchema,
  from: z.union([PointEndSchema, LocationEndSchema]),
  to: z.union([PointEndSchema, LocationEndSchema]),
  a11y: z.enum(['1', '0']).transform((value) => value === '1'),
  lang: LanguageCodeSchema,
} as const;

type ParamName = keyof typeof DeepLinkParamSchemas;

const round = (value: number) => Number(value.toFixed(DEEP_LINK_COORDINATE_DECIMALS));

function encodeEnd(end: RouteEnd): string {
  return end.kind === 'location'
    ? end.locationId
    : `${round(end.lng)},${round(end.lat)},${end.floorId}`;
}

/**
 * Path + query relatif untuk sebuah keadaan: `/v/{venue}?b=…&f=…&loc=…&o=…&ip=…&from=…&to=…
 * &a11y=1&lang=en`. Urutan parameter tetap agar tautan yang sama selalu identik.
 */
export function encodeDeepLink(link: DeepLink): string {
  const params: [ParamName, string | undefined][] = [
    ['b', link.buildingId],
    ['f', link.floorId],
    ['loc', link.locationId],
    ['o', link.originCode],
    ['ip', link.infoPointCode],
    ['from', link.from && encodeEnd(link.from)],
    ['to', link.to && encodeEnd(link.to)],
    ['a11y', link.accessible === undefined ? undefined : link.accessible ? '1' : '0'],
    ['lang', link.language],
  ];
  const query = params
    .flatMap(([name, value]) =>
      value === undefined ? [] : [`${name}=${encodeURIComponent(value)}`],
    )
    .join('&');
  return `/v/${link.venueId}${query ? `?${query}` : ''}`;
}

/** URL lengkap dari URL publik Visitor di Pengaturan Sistem (QR titik asal, bagikan). */
export function deepLinkUrl(publicUrl: string, link: DeepLink): string {
  return `${publicUrl.replace(/\/+$/, '')}${encodeDeepLink(link)}`;
}

/** Nilai pertama tiap parameter; bagian yang persen-enkodenya rusak dilewati. */
function readQuery(query: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const part of query.replace(/^\?/, '').split('&')) {
    const separator = part.indexOf('=');
    if (separator <= 0) continue;
    try {
      const name = decodeURIComponent(part.slice(0, separator));
      const value = decodeURIComponent(part.slice(separator + 1).replace(/\+/g, ' '));
      if (!values.has(name)) values.set(name, value);
    } catch {
      // Tautan dari luar bisa terpotong atau diubah; parameter rusak cukup diabaikan.
    }
  }
  return values;
}

function parse<N extends ParamName>(
  values: ReadonlyMap<string, string>,
  name: N,
): z.output<(typeof DeepLinkParamSchemas)[N]> | undefined {
  const raw = values.get(name);
  if (raw === undefined) return undefined;
  const result = DeepLinkParamSchemas[name].safeParse(raw);
  return result.success ? (result.data as z.output<(typeof DeepLinkParamSchemas)[N]>) : undefined;
}

/**
 * Keadaan dari path + query (`/v/{venue}?…`, atau `?v={venue}&…`). Tidak pernah melempar
 * error: parameter yang rusak atau tidak dikenal diabaikan, dan hasilnya `null` hanya bila venue
 * tidak bisa dibaca.
 */
export function decodeDeepLink(pathAndQuery: string): DeepLink | null {
  const [path = '', ...rest] = pathAndQuery.split('?');
  const values = readQuery(rest.join('?').split('#')[0] ?? '');
  const fromPath = /\/v\/([^/?#]+)/.exec(path)?.[1];
  const venue = VenueIdSchema.safeParse(fromPath ?? values.get('v'));
  if (!venue.success) return null;

  const link: DeepLink = { venueId: venue.data };
  const buildingId = parse(values, 'b');
  const floorId = parse(values, 'f');
  const locationId = parse(values, 'loc');
  const originCode = parse(values, 'o');
  const infoPointCode = parse(values, 'ip');
  const from = parse(values, 'from');
  const to = parse(values, 'to');
  const accessible = parse(values, 'a11y');
  const language = parse(values, 'lang');
  if (buildingId) link.buildingId = buildingId;
  if (floorId) link.floorId = floorId;
  if (locationId) link.locationId = locationId;
  if (originCode) link.originCode = originCode;
  if (infoPointCode) link.infoPointCode = infoPointCode;
  if (from) link.from = from;
  if (to) link.to = to;
  if (accessible !== undefined) link.accessible = accessible;
  if (language) link.language = language;
  return link;
}
