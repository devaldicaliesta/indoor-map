import type { CategoryWithUsage, LocationPageFilters } from '@indoor/data';
import {
  type Building,
  type Floor,
  LOCATION_STATUSES,
  type LocationStatus,
  type LocationType,
  OUTDOOR_BUILDING,
} from '@indoor/domain';
import type { FilterDef, TableState } from '@indoor/ui';
import { LOCATION_STATUS_LABELS } from './labels';

/** Parameter URL tabel Lokasi (`unit` dan `location` sudah dipakai tautan langsung). */
export const LOCATION_FILTER = {
  status: 'status',
  category: 'kategori',
  type: 'tipe',
  building: 'gedung',
  floor: 'lantai',
  link: 'tautan',
} as const;

const UNLINKED = 'belum';

/** Filter tabel Lokasi; pilihan yang masih dimuat bernilai `undefined`. */
export function locationFilters(options: {
  categories: readonly CategoryWithUsage[] | undefined;
  types: readonly LocationType[] | undefined;
  buildings: readonly Building[] | undefined;
  outdoorName: string;
  /** Lantai gedung yang dipilih; tanpa gedung terpilih filter lantai tidak tersedia. */
  floors: readonly Floor[] | undefined;
}): FilterDef[] {
  const { categories, types, buildings, outdoorName, floors } = options;
  return [
    {
      kind: 'multi',
      key: LOCATION_FILTER.status,
      label: 'Status',
      options: LOCATION_STATUSES.map((value) => ({ value, label: LOCATION_STATUS_LABELS[value] })),
    },
    {
      kind: 'select',
      key: LOCATION_FILTER.category,
      label: 'Kategori',
      allLabel: 'Semua kategori',
      options: categories?.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      kind: 'select',
      key: LOCATION_FILTER.type,
      label: 'Tipe',
      allLabel: 'Semua tipe',
      options: types?.map((t) => ({ value: t.id, label: t.name })),
    },
    {
      kind: 'select',
      key: LOCATION_FILTER.building,
      label: 'Gedung',
      allLabel: 'Semua gedung',
      options: buildings && [
        ...buildings.map((b) => ({ value: b.id, label: b.name })),
        { value: OUTDOOR_BUILDING, label: outdoorName },
      ],
    },
    {
      kind: 'select',
      key: LOCATION_FILTER.floor,
      label: 'Lantai',
      allLabel: 'Semua lantai',
      options: floors?.map((f) => ({ value: f.id, label: f.name })),
    },
    {
      kind: 'select',
      key: LOCATION_FILTER.link,
      label: 'Tautan unit',
      allLabel: 'Semua tautan unit',
      options: [{ value: UNLINKED, label: 'Belum tertaut unit' }],
    },
  ];
}

const first = (state: TableState, key: string) => state.filters[key]?.[0] ?? null;

/** Keadaan tabel (URL) menjadi filter repository `locations.listPage`. */
export function toLocationPageFilters(state: TableState): LocationPageFilters {
  return {
    statuses: (state.filters[LOCATION_FILTER.status] ?? []).filter((s): s is LocationStatus =>
      (LOCATION_STATUSES as readonly string[]).includes(s),
    ),
    categoryId: first(state, LOCATION_FILTER.category),
    typeId: first(state, LOCATION_FILTER.type),
    building: first(state, LOCATION_FILTER.building),
    floorId: first(state, LOCATION_FILTER.floor),
    unlinkedOnly: first(state, LOCATION_FILTER.link) === UNLINKED,
  };
}
