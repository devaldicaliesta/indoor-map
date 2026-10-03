import type { FloorFeature } from '@indoor/data';
import {
  type Building,
  type FacilityType,
  type Floor,
  type InfoPointPlace,
  type Location,
  normalizeSearchText,
  type OriginPoint,
  orderedUnits,
  type SnapshotLanguage,
} from '@indoor/domain';
import type { RoutePlace } from '@indoor/routing';

export type PlaceKind = 'location' | 'unit' | 'facility' | 'origin_point' | 'info_point';

/** Urutan jenis di daftar saran bila kecocokannya sama. */
const KIND_ORDER: readonly PlaceKind[] = [
  'location',
  'unit',
  'facility',
  'origin_point',
  'info_point',
];

/** Asal atau tujuan yang bisa dipilih di panel Uji rute. */
export interface PlaceOption {
  key: string;
  kind: PlaceKind;
  place: RoutePlace;
  label: string;
  /** Jenis dan tempatnya, misalnya "Unit · Gedung Utama · GF". */
  detail: string;
  /** Kode unit ditulis dengan huruf mono. */
  mono: boolean;
  /** Teks pencarian yang sudah dinormalkan. */
  search: string;
}

export interface PlaceSources {
  floors: readonly Floor[];
  buildings: readonly Building[];
  features: readonly FloorFeature[];
  facilityTypes: readonly FacilityType[];
  locations: readonly Location[];
  originPoints: readonly OriginPoint[];
  infoPoints: readonly InfoPointPlace[];
}

export function placeKey(place: RoutePlace): string {
  switch (place.kind) {
    case 'feature':
      return `feature:${place.featureId}`;
    case 'location':
      return `location:${place.locationId}`;
    case 'origin_point':
    case 'info_point':
      return `${place.kind}:${place.code}`;
    case 'point':
      return `point:${place.lng},${place.lat},${place.floorId}`;
  }
}

/** "Gedung Utama · GF", atau nama lapisan Area Luar. */
export function floorText(
  floorId: string,
  floors: readonly Floor[],
  buildings: readonly Building[],
): string {
  const floor = floors.find((f) => f.id === floorId);
  if (!floor) return 'Lantai tidak ditemukan';
  const building = buildings.find((b) => b.id === floor.buildingId);
  return building ? `${building.name} · ${floor.name}` : floor.name;
}

/** Semua tempat yang bisa menjadi asal atau tujuan; lokasi nonaktif permanen tidak tampil. */
export function placeOptions(sources: PlaceSources): PlaceOption[] {
  const where = (floorId: string) => floorText(floorId, sources.floors, sources.buildings);
  const typeNames = new Map(sources.facilityTypes.map((t) => [t.id as string, t.name]));
  const options: PlaceOption[] = [];
  const add = (
    kind: PlaceKind,
    place: RoutePlace,
    label: string,
    detail: string,
    terms: readonly (string | null | undefined)[],
    mono = false,
  ) =>
    options.push({
      key: placeKey(place),
      kind,
      place,
      label,
      detail,
      mono,
      search: normalizeSearchText([label, detail, ...terms].filter(Boolean).join(' ')),
    });

  for (const location of sources.locations) {
    if (location.status === 'inactive_permanent') continue;
    const unit = orderedUnits(location.units)[0];
    const code = location.code ? ` ${location.code}` : '';
    const at = unit ? `${unit.unitCode} · ${where(unit.floorId)}` : 'Belum ada di peta';
    add(
      'location',
      { kind: 'location', locationId: location.id },
      location.name,
      `Lokasi${code} · ${at}`,
      [location.code],
    );
  }
  for (const feature of sources.features) {
    const p = feature.properties;
    const place: RoutePlace = { kind: 'feature', featureId: p.id };
    if (p.kind === 'unit') {
      add(
        'unit',
        place,
        p.unitCode ?? 'Unit tanpa kode',
        `Unit · ${where(p.floorId)}`,
        [p.name],
        Boolean(p.unitCode),
      );
    } else if (p.kind === 'facility') {
      const type = (p.facilityTypeId && typeNames.get(p.facilityTypeId)) || 'Fasilitas';
      add('facility', place, p.name ?? type, `${type} · ${where(p.floorId)}`, []);
    }
  }
  for (const origin of sources.originPoints) {
    add(
      'origin_point',
      { kind: 'origin_point', code: origin.code },
      origin.name,
      `QR titik asal · ${where(origin.floorId)}`,
      [origin.code],
    );
  }
  for (const point of sources.infoPoints) {
    add(
      'info_point',
      { kind: 'info_point', code: point.code },
      point.name,
      `Info Point ${point.code} · ${where(point.floorId)}`,
      [],
    );
  }
  return options;
}

/**
 * Saran untuk teks yang diketik: setiap kata harus ada di nama, kode, jenis, atau tempatnya.
 * Nama yang sama persis lalu yang berawalan teks itu didahulukan.
 */
export function searchPlaces(
  options: readonly PlaceOption[],
  query: string,
  limit = 8,
): PlaceOption[] {
  const text = normalizeSearchText(query);
  const words = text.split(' ').filter(Boolean);
  if (!words.length) return [];
  const rank = (option: PlaceOption) => {
    const label = normalizeSearchText(option.label);
    return label === text ? 0 : label.startsWith(text) ? 1 : 2;
  };
  return options
    .filter((option) => words.every((word) => option.search.includes(word)))
    .map((option) => ({ option, rank: rank(option) }))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        KIND_ORDER.indexOf(a.option.kind) - KIND_ORDER.indexOf(b.option.kind) ||
        a.option.label.localeCompare(b.option.label, 'id', { numeric: true }),
    )
    .slice(0, limit)
    .map(({ option }) => option);
}

const POINT_NAME: Record<SnapshotLanguage, string> = {
  id: 'titik yang dipilih',
  en: 'the selected point',
};

/** Nama tempat untuk `{origin}`/`{destination}` di teks instruksi, dalam bahasa instruksi. */
export function placeName(
  place: RoutePlace,
  options: ReadonlyMap<string, PlaceOption>,
  language: SnapshotLanguage,
): string {
  if (place.kind === 'point') return POINT_NAME[language];
  return options.get(placeKey(place))?.label ?? '';
}
