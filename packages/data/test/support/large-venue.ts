import { randomUUID } from 'node:crypto';
import type { LocationStatus } from '@indoor/domain';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/database.types';

/**
 * Venue berisi banyak lokasi untuk tabel server (T-503, TC-TBL-01): Gedung Utama (B1, GF, L1,
 * L2) + Area Luar, tiga tipe lokasi dengan dua kategori masing-masing, status campuran, nama
 * beragam (aksen, emoji, `%`, `_`, kutip), dan sebagian lokasi tertaut ke unit. Lokasi ke-i
 * selalu sama (`largeVenueLocation`) sehingga test bisa menghitung hasil yang diharapkan.
 */
export interface LargeVenue {
  venueId: string;
  name: string;
  buildingId: string;
  outdoorFloorId: string;
  floorIds: Record<FloorKey, string>;
  typeIds: Record<TypeKey, string>;
  categoryIds: Record<CategoryKey, string>;
  count: number;
}

type Db = SupabaseClient<Database>;
export type FloorKey = 'B1' | 'GF' | 'L1' | 'L2';
export type TypeKey = 'layanan' | 'gerai' | 'fasilitas';
export type CategoryKey = 'pemeriksaan' | 'rawat_jalan' | 'makanan' | 'kopi' | 'toilet' | 'ibadah';

const FLOORS: { key: FloorKey; level: number }[] = [
  { key: 'B1', level: -1 },
  { key: 'GF', level: 0 },
  { key: 'L1', level: 1 },
  { key: 'L2', level: 2 },
];
const TYPES: { key: TypeKey; name: string; categories: { key: CategoryKey; name: string }[] }[] = [
  {
    key: 'layanan',
    name: 'Layanan',
    categories: [
      { key: 'pemeriksaan', name: 'Pemeriksaan' },
      { key: 'rawat_jalan', name: 'Rawat Jalan' },
    ],
  },
  {
    key: 'gerai',
    name: 'Gerai',
    categories: [
      { key: 'makanan', name: 'Makanan & Minuman' },
      { key: 'kopi', name: 'Kopi & Teh' },
    ],
  },
  {
    key: 'fasilitas',
    name: 'Fasilitas Umum',
    categories: [
      { key: 'toilet', name: 'Toilet' },
      { key: 'ibadah', name: 'Ibadah' },
    ],
  },
];

const PLACES: { name: string; category: CategoryKey }[] = [
  { name: 'Poli Anak', category: 'rawat_jalan' },
  { name: 'Laboratorium Klinik', category: 'pemeriksaan' },
  { name: 'Radiologi', category: 'pemeriksaan' },
  { name: 'Kafé Lumière', category: 'kopi' },
  { name: 'Kopi Senja', category: 'kopi' },
  { name: 'Warung Soto Pak Ümar', category: 'makanan' },
  { name: 'Toilet Difabel', category: 'toilet' },
  { name: 'Musala Al-Ikhlas', category: 'ibadah' },
  { name: 'Poli Gigi & Mulut', category: 'rawat_jalan' },
  { name: "Roti O'Bakery", category: 'makanan' },
  { name: 'Diskon 50% Optik', category: 'makanan' },
  { name: 'Ruang_Laktasi', category: 'toilet' },
  { name: 'Teh Tarik 🍵', category: 'kopi' },
  { name: 'Fisioterapi', category: 'rawat_jalan' },
  { name: 'Apotek 24 Jam', category: 'pemeriksaan' },
  { name: 'Kapel Oikumene', category: 'ibadah' },
];

const STATUS_CYCLE: LocationStatus[] = [
  'active',
  'active',
  'active',
  'coming_soon',
  'active',
  'inactive_temporary',
  'active',
  'inactive_permanent',
];

const typeOf = (category: CategoryKey): TypeKey =>
  TYPES.find((t) => t.categories.some((c) => c.key === category))?.key ?? 'layanan';

export interface LargeVenueLocation {
  code: string;
  name: string;
  status: LocationStatus;
  type: TypeKey;
  category: CategoryKey;
  /** Lantai unitnya; `null` = belum tertaut unit, `outdoor` = unit di Area Luar. */
  floor: FloorKey | 'outdoor' | null;
  unitCode: string | null;
}

/** Lokasi ke-i (mulai 0) venue besar; deterministik. */
export function largeVenueLocation(i: number): LargeVenueLocation {
  const place = PLACES[i % PLACES.length] ?? PLACES[0];
  const status = STATUS_CYCLE[i % STATUS_CYCLE.length] ?? 'active';
  // Dua dari tiga lokasi tertaut ke unit; yang nonaktif permanen tidak memegang unit.
  const linked = i % 3 !== 2 && status !== 'inactive_permanent';
  const floor = linked ? (i % 10 === 0 ? 'outdoor' : (FLOORS[i % 4]?.key ?? 'GF')) : null;
  const serial = String(i + 1).padStart(4, '0');
  return {
    code: `LK-${serial}`,
    name: `${place?.name} ${Math.floor(i / PLACES.length) + 1}`,
    status,
    type: typeOf(place?.category ?? 'pemeriksaan'),
    category: place?.category ?? 'pemeriksaan',
    floor,
    unitCode: floor ? `${floor === 'outdoor' ? 'LR' : floor}-U${serial}` : null,
  };
}

async function insertRows(
  db: Db,
  table: keyof Database['public']['Tables'],
  rows: Record<string, unknown>[],
) {
  for (let i = 0; i < rows.length; i += 500) {
    // biome-ignore lint/suspicious/noExplicitAny: baris uji disusun dinamis; tipe dicek database.
    const { error } = await db.from(table).insert(rows.slice(i, i + 500) as any);
    if (error) throw new Error(`Gagal mengisi ${table}: ${error.message}`);
  }
}

/** Persegi kecil ±3 m di dalam gedung uji, berurutan menurut nomor unit. */
function unitSquare(center: readonly [number, number], n: number) {
  const step = 0.00004;
  const x = center[0] - 0.002 + (n % 100) * step;
  const y = center[1] - 0.002 + Math.floor(n / 100) * step;
  const h = step * 0.4;
  return {
    type: 'Polygon',
    coordinates: [
      [
        [x - h, y + h],
        [x + h, y + h],
        [x + h, y - h],
        [x - h, y - h],
        [x - h, y + h],
      ],
    ],
  };
}

/** Membuat venue besar lewat klien Super Admin (RLS berlaku). */
export async function createLargeVenue(
  db: Db,
  name: string,
  count = 2000,
  center: readonly [number, number] = [106.8456, -6.2088],
): Promise<LargeVenue> {
  const venue = await db
    .from('venues')
    .insert({
      name,
      timezone: 'Asia/Jakarta',
      center: { type: 'Point', coordinates: center } as unknown as string,
    })
    .select('id')
    .single();
  if (venue.error) throw new Error(`Gagal membuat venue: ${venue.error.message}`);
  const venueId = venue.data.id;
  const outdoor = await db
    .from('floors')
    .select('id')
    .eq('venue_id', venueId)
    .eq('is_outdoor', true)
    .single();
  if (outdoor.error) throw new Error(outdoor.error.message);

  const buildingId = randomUUID();
  await insertRows(db, 'buildings', [
    { id: buildingId, venue_id: venueId, name: 'Gedung Utama', code: 'GU' },
  ]);
  const floorIds = Object.fromEntries(FLOORS.map((f) => [f.key, randomUUID()])) as Record<
    FloorKey,
    string
  >;
  await insertRows(
    db,
    'floors',
    FLOORS.map((f, i) => ({
      id: floorIds[f.key],
      venue_id: venueId,
      building_id: buildingId,
      name: f.key,
      level: f.level,
      sort_order: i,
    })),
  );

  const typeIds = Object.fromEntries(TYPES.map((t) => [t.key, randomUUID()])) as Record<
    TypeKey,
    string
  >;
  await insertRows(
    db,
    'location_types',
    TYPES.map((t, i) => ({
      id: typeIds[t.key],
      venue_id: venueId,
      name: t.name,
      sort_order: 10 + i,
    })),
  );
  const categoryIds = {} as Record<CategoryKey, string>;
  await insertRows(
    db,
    'categories',
    TYPES.flatMap((t) =>
      t.categories.map((c, i) => {
        categoryIds[c.key] = randomUUID();
        return {
          id: categoryIds[c.key],
          location_type_id: typeIds[t.key],
          name: c.name,
          sort_order: i,
        };
      }),
    ),
  );

  const locations = Array.from({ length: count }, (_, i) => ({
    id: randomUUID(),
    ...largeVenueLocation(i),
  }));
  await insertRows(
    db,
    'locations',
    locations.map((l) => ({
      id: l.id,
      venue_id: venueId,
      code: l.code,
      name: l.name,
      location_type_id: typeIds[l.type],
      status: l.status,
      opening_date: l.status === 'coming_soon' ? '2026-12-01' : null,
    })),
  );
  await insertRows(
    db,
    'location_categories',
    locations.map((l) => ({ location_id: l.id, category_id: categoryIds[l.category] })),
  );
  const units = locations.flatMap((l, i) =>
    l.floor && l.unitCode
      ? [
          {
            location: l.id,
            feature: {
              id: randomUUID(),
              venue_id: venueId,
              floor_id: l.floor === 'outdoor' ? outdoor.data.id : floorIds[l.floor],
              kind: 'unit',
              geom: unitSquare(center, i),
              unit_code: l.unitCode,
              unit_status: 'occupied',
            },
          },
        ]
      : [],
  );
  await insertRows(
    db,
    'features',
    units.map((u) => u.feature),
  );
  await insertRows(
    db,
    'location_units',
    units.map((u) => ({ location_id: u.location, feature_id: u.feature.id, is_primary: true })),
  );
  return {
    venueId,
    name,
    buildingId,
    outdoorFloorId: outdoor.data.id,
    floorIds,
    typeIds,
    categoryIds,
    count,
  };
}
