import {
  BuildingIdSchema,
  CategoryIdSchema,
  FeatureIdSchema,
  FloorIdSchema,
  holdsUnits,
  type ImportWrite,
  LOCATION_STATUSES,
  type Location,
  type LocationId,
  LocationIdSchema,
  type LocationInput,
  type LocationRef,
  type LocationStatus,
  type LocationTypeId,
  LocationTypeIdSchema,
  type LocationUnit,
  MAX_IMAGE_BYTES,
  type OpeningHours,
  type OpeningHoursRow,
  openingHoursFromRows,
  type SnapshotFieldValue,
  UNIT_STATUSES,
  type UnitStatus,
  type VenueId,
  VenueIdSchema,
  type VenueUnit,
} from '@indoor/domain';
import type { Database, Json } from '../database.types';
import { DataError, toDataError } from '../errors';
import { zeroRowsError } from '../mutations';
import { fetchAllPages, listPage, type Page, type PageQuery } from '../pagination';
import type { Db } from '../supabase';

const ASSETS_BUCKET = 'public-assets';
/** Baris per panggilan `import_locations` (satu transaksi). */
export const IMPORT_BATCH = 200;
/** Sama dengan tipe yang diizinkan bucket `public-assets` (migrasi 0005). */
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const COLUMNS = `id, venue_id, location_type_id, code, name, description, logo_path, photo_paths, status, custom_fields, opening_date,
  opening_hours(weekday, special_date, opens_at, closes_at, is_closed),
  location_categories(category_id),
  location_units(feature_id, is_primary, features(unit_code, floor_id, floors(name, building_id, buildings!floors_building_same_venue(name))))`;

interface FloorEmbed {
  name: string;
  level?: number;
  building_id: string | null;
  buildings: { name: string } | null;
}

export interface LocationRow {
  id: string;
  venue_id: string;
  location_type_id: string;
  code: string | null;
  name: string;
  description: string | null;
  logo_path: string | null;
  photo_paths: string[];
  status: string;
  custom_fields: unknown;
  opening_date: string | null;
  opening_hours: OpeningHoursRow[];
  location_categories: { category_id: string }[];
  location_units: {
    feature_id: string;
    is_primary: boolean;
    features: { unit_code: string | null; floor_id: string; floors: FloorEmbed | null } | null;
  }[];
}

const statusOf = (value: string): LocationStatus =>
  (LOCATION_STATUSES as readonly string[]).includes(value) ? (value as LocationStatus) : 'active';

export function mapLocationRow(row: LocationRow): Location {
  const units: LocationUnit[] = row.location_units.flatMap((link) => {
    const feature = link.features;
    if (!feature) return [];
    const floor = feature.floors;
    return [
      {
        featureId: FeatureIdSchema.parse(link.feature_id),
        unitCode: feature.unit_code ?? '',
        floorId: FloorIdSchema.parse(feature.floor_id),
        floorName: floor?.name ?? '',
        buildingId: floor?.building_id ? BuildingIdSchema.parse(floor.building_id) : null,
        buildingName: floor?.buildings?.name ?? null,
        isPrimary: link.is_primary,
      },
    ];
  });
  return {
    id: LocationIdSchema.parse(row.id),
    venueId: VenueIdSchema.parse(row.venue_id),
    locationTypeId: LocationTypeIdSchema.parse(row.location_type_id),
    code: row.code,
    name: row.name,
    description: row.description,
    logoPath: row.logo_path,
    photoPaths: row.photo_paths,
    status: statusOf(row.status),
    categoryIds: row.location_categories.map((c) => CategoryIdSchema.parse(c.category_id)),
    units,
    customFields: customFieldsOf(row.custom_fields),
    openingDate: row.opening_date,
    hours: openingHoursFromRows(row.opening_hours),
  };
}

/** Jadwal menjadi baris untuk `save_location`; tanggal khusus tanpa rentang = tutup. */
export function hoursToRows(hours: OpeningHours): OpeningHoursRow[] {
  const rows: OpeningHoursRow[] = [];
  hours.weekly.forEach((spans, i) => {
    for (const span of spans) {
      rows.push({
        weekday: i + 1,
        special_date: null,
        opens_at: span.opens,
        closes_at: span.closes,
        is_closed: false,
      });
    }
  });
  for (const [date, spans] of Object.entries(hours.special)) {
    if (spans.length === 0) {
      rows.push({
        weekday: null,
        special_date: date,
        opens_at: null,
        closes_at: null,
        is_closed: true,
      });
    }
    for (const span of spans) {
      rows.push({
        weekday: null,
        special_date: date,
        opens_at: span.opens,
        closes_at: span.closes,
        is_closed: false,
      });
    }
  }
  return rows;
}

/** Nilai field kustom yang bentuknya dikenal; isi jsonb lain diabaikan. */
export function customFieldsOf(value: unknown): Record<string, SnapshotFieldValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, SnapshotFieldValue> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string' || typeof item === 'boolean') out[key] = item;
    else if (typeof item === 'number' && Number.isFinite(item)) out[key] = item;
    else if (Array.isArray(item) && item.every((x) => typeof x === 'string')) out[key] = item;
  }
  return out;
}

type SaveArgs = Database['public']['Functions']['save_location']['Args'];

/** Argumen RPC `save_location`; yang kosong tidak dikirim sehingga bernilai `null` di server. */
export function toSaveLocationArgs(
  id: LocationId,
  venueId: VenueId,
  typeId: LocationTypeId,
  input: LocationInput,
  images: { logoPath: string | null; photoPaths: string[] },
): SaveArgs {
  const args: SaveArgs = {
    p_id: id,
    p_venue_id: venueId,
    p_location_type_id: typeId,
    p_name: input.name.trim(),
    p_category_ids: [...input.categoryIds],
    p_unit_ids: [...input.unitIds],
    p_photo_paths: images.photoPaths,
  };
  const code = input.code.trim();
  const description = input.description.trim();
  if (code) args.p_code = code;
  if (description) args.p_description = description;
  if (images.logoPath) args.p_logo_path = images.logoPath;
  args.p_custom_fields = input.customFields;
  args.p_status = input.status;
  if (input.status === 'coming_soon' && input.openingDate) args.p_opening_date = input.openingDate;
  args.p_hours = hoursToRows(input.hours) as unknown as Json;
  if (input.primaryUnitId && input.unitIds.includes(input.primaryUnitId)) {
    args.p_primary_unit_id = input.primaryUnitId;
  }
  return args;
}

/** Perubahan gambar lokasi yang dikirim bersama formulir. */
export interface LocationImages {
  /** Logo baru; `null` menghapus logo; tanpa nilai = logo tidak berubah. */
  logo?: Blob | null;
  /** Foto lama yang dipertahankan, lalu foto baru yang diunggah. */
  keepPhotoPaths: string[];
  newPhotos: Blob[];
}

interface VenueUnitRow {
  id: string;
  unit_code: string | null;
  unit_status: string | null;
  floor_id: string;
  floors: FloorEmbed | null;
  location_units: { location_id: string; locations: { name: string; status: string } | null }[];
}

export function mapVenueUnitRow(row: VenueUnitRow): VenueUnit {
  const floor = row.floors;
  return {
    featureId: FeatureIdSchema.parse(row.id),
    unitCode: row.unit_code ?? '',
    unitStatus: (UNIT_STATUSES as readonly string[]).includes(row.unit_status ?? '')
      ? (row.unit_status as UnitStatus)
      : null,
    floorId: FloorIdSchema.parse(row.floor_id),
    floorName: floor?.name ?? '',
    floorLevel: floor?.level ?? 0,
    buildingId: floor?.building_id ? BuildingIdSchema.parse(floor.building_id) : null,
    buildingName: floor?.buildings?.name ?? null,
    holders: row.location_units.flatMap((link) =>
      link.locations && holdsUnits(statusOf(link.locations.status))
        ? [{ locationId: LocationIdSchema.parse(link.location_id), name: link.locations.name }]
        : [],
    ),
  };
}

/** Filter tabel Lokasi di server; semua berlaku bersamaan. */
export interface LocationPageFilters {
  statuses: readonly LocationStatus[];
  categoryId: string | null;
  typeId: string | null;
  /** Id gedung atau `outdoor` (unit di Area Luar). */
  building: string | null;
  floorId: string | null;
  unlinkedOnly: boolean;
}

export interface LocationsRepository {
  /** Semua lokasi venue dengan kategori dan unitnya (gedung/lantai ikut untuk filter). */
  list(venueId: VenueId): Promise<Location[]>;
  /**
   * Satu halaman lokasi urut nama, disaring di server (`search_locations`): kata kunci mencari
   * nama, kode lokasi, dan kode unit tanpa membedakan huruf besar/kecil dan diakritik.
   */
  listPage(venueId: VenueId, query: PageQuery<LocationPageFilters>): Promise<Page<Location>>;
  /** Satu lokasi lengkap (tautan langsung `?location=`); `null` bila tidak ada atau tidak boleh dibaca. */
  get(id: LocationId): Promise<Location | null>;
  /** Kode dan nama semua lokasi venue saja, untuk memeriksa kode ganda di formulir. */
  codes(venueId: VenueId): Promise<{ id: string; code: string | null; name: string }[]>;
  /**
   * Menyimpan lokasi, kategori, dan unit dalam satu transaksi (`save_location`). Logo dan
   * foto baru diunggah lebih dulu; bila penyimpanan gagal, berkasnya dihapus lagi, dan bila
   * berhasil, berkas lama yang tidak dipakai lagi dibersihkan. Mengembalikan id lokasi.
   */
  save(
    venueId: VenueId,
    typeId: LocationTypeId,
    id: LocationId | null,
    input: LocationInput,
    images: LocationImages,
  ): Promise<LocationId>;
  /** Tautan kategori dan unit ikut terhapus (cascade), begitu juga berkas gambarnya. */
  remove(id: LocationId): Promise<void>;
  /** Semua unit venue beserta lokasi aktif yang memakainya (pemilih unit). */
  venueUnits(venueId: VenueId): Promise<VenueUnit[]>;
  /** Lokasi yang ditautkan ke satu unit (panel properti unit di editor). */
  forUnit(featureId: string): Promise<LocationRef[]>;
  imageUrl(path: string): string;
  /**
   * Menulis baris import yang sudah divalidasi, per batch 200 baris (satu transaksi per batch).
   * `onProgress` dipanggil dengan jumlah baris yang sudah tersimpan. Bila satu batch gagal, batch
   * sebelumnya tetap tersimpan dan galatnya menyebut baris pertama batch itu.
   */
  importRows(
    venueId: VenueId,
    typeId: LocationTypeId,
    rows: readonly ImportWrite[],
    onProgress?: (saved: number) => void,
  ): Promise<number>;
  /** Gambar untuk field kustom berjenis gambar; path-nya disimpan sebagai nilai field. */
  uploadFieldImage(venueId: VenueId, file: Blob): Promise<string>;
}

export function createLocationsRepository(db: Db): LocationsRepository {
  const storage = () => db.storage.from(ASSETS_BUCKET);

  async function isVisible(id: LocationId) {
    const { data } = await db.from('locations').select('id').eq('id', id).maybeSingle();
    return data !== null;
  }

  async function upload(venueId: VenueId, name: string, file: Blob): Promise<string> {
    const extension = IMAGE_EXTENSIONS[file.type];
    if (!extension) {
      throw new DataError('invalid', { message: 'Gambar harus berupa PNG, JPG, atau WebP.' });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new DataError('invalid', { message: 'Gambar terlalu besar. Maksimal 5 MB.' });
    }
    const path = `locations/${venueId}/${name}.${extension}`;
    const { error } = await storage().upload(path, file, { contentType: file.type });
    if (error) throw toDataError(error);
    return path;
  }

  async function removeFiles(paths: readonly (string | null)[]) {
    const list = paths.filter((p): p is string => Boolean(p));
    // Kegagalan membersihkan berkas tidak membatalkan perubahan data.
    if (list.length)
      await storage()
        .remove(list)
        .then(undefined, () => undefined);
  }

  function saveError(error: unknown): DataError {
    const mapped = toDataError(error);
    return mapped.code === '23505'
      ? new DataError('conflict', {
          message: 'Kode lokasi sudah dipakai lokasi lain di venue ini.',
          code: mapped.code,
          cause: error,
        })
      : mapped;
  }

  return {
    async list(venueId) {
      const rows = await fetchAllPages((from, to) =>
        db.from('locations').select(COLUMNS).eq('venue_id', venueId).order('id').range(from, to),
      );
      return (rows as unknown as LocationRow[]).map(mapLocationRow);
    },

    listPage(venueId, { q, filters, page, size }) {
      const args = {
        p_venue_id: venueId,
        p_query: q,
        ...(filters.statuses.length ? { p_statuses: [...filters.statuses] } : {}),
        ...(filters.categoryId ? { p_category_id: filters.categoryId } : {}),
        ...(filters.typeId ? { p_type_id: filters.typeId } : {}),
        ...(filters.building ? { p_building: filters.building } : {}),
        ...(filters.floorId ? { p_floor_id: filters.floorId } : {}),
        p_unlinked_only: filters.unlinkedOnly,
      };
      return listPage(
        (from, to) =>
          db
            .rpc('search_locations', args, { count: 'exact' })
            .select(COLUMNS)
            .order('name')
            .order('id')
            .range(from, to),
        { page, size },
        (rows) => (rows as unknown as LocationRow[]).map(mapLocationRow),
      );
    },

    async get(id) {
      const { data, error } = await db.from('locations').select(COLUMNS).eq('id', id).maybeSingle();
      if (error) throw toDataError(error);
      return data ? mapLocationRow(data as unknown as LocationRow) : null;
    },

    codes(venueId) {
      return fetchAllPages((from, to) =>
        db
          .from('locations')
          .select('id, code, name')
          .eq('venue_id', venueId)
          .order('id')
          .range(from, to),
      );
    },

    async save(venueId, typeId, id, input, images) {
      const locationId = id ?? LocationIdSchema.parse(globalThis.crypto.randomUUID());
      const current = id
        ? await db.from('locations').select('logo_path, photo_paths').eq('id', id).maybeSingle()
        : null;
      if (current?.error) throw toDataError(current.error);
      if (id && !current?.data)
        throw new DataError('not_found', { message: 'Lokasi tidak ditemukan.' });
      const before = current?.data ?? { logo_path: null, photo_paths: [] };

      const stamp = Date.now();
      const uploaded: string[] = [];
      try {
        let logoPath = images.logo === null ? null : before.logo_path;
        if (images.logo) {
          logoPath = await upload(venueId, `${locationId}-logo-${stamp}`, images.logo);
          uploaded.push(logoPath);
        }
        const photoPaths = [...images.keepPhotoPaths];
        for (const [index, photo] of images.newPhotos.entries()) {
          const path = await upload(venueId, `${locationId}-photo-${stamp}-${index}`, photo);
          uploaded.push(path);
          photoPaths.push(path);
        }
        const { error } = await db.rpc(
          'save_location',
          toSaveLocationArgs(locationId, venueId, typeId, input, { logoPath, photoPaths }),
        );
        if (error) throw saveError(error);
        const kept = new Set([logoPath, ...photoPaths]);
        await removeFiles([before.logo_path, ...before.photo_paths].filter((p) => !kept.has(p)));
        return locationId;
      } catch (error) {
        await removeFiles(uploaded);
        throw toDataError(error);
      }
    },

    async importRows(venueId, typeId, rows, onProgress) {
      let saved = 0;
      for (let start = 0; start < rows.length; start += IMPORT_BATCH) {
        const batch = rows.slice(start, start + IMPORT_BATCH);
        const { data, error } = await db.rpc('import_locations', {
          p_venue_id: venueId,
          p_location_type_id: typeId,
          p_rows: batch as unknown as Json,
        });
        if (error) throw toDataError(error);
        saved += data ?? batch.length;
        onProgress?.(saved);
      }
      return saved;
    },

    uploadFieldImage(venueId, file) {
      return upload(venueId, `field-${globalThis.crypto.randomUUID()}`, file);
    },

    async remove(id) {
      const { data, error } = await db
        .from('locations')
        .delete()
        .eq('id', id)
        .select('logo_path, photo_paths');
      if (error) throw toDataError(error);
      const row = data[0];
      if (!row) throw await zeroRowsError(() => isVisible(id));
      await removeFiles([row.logo_path, ...row.photo_paths]);
    },

    async venueUnits(venueId) {
      const rows = await fetchAllPages((from, to) =>
        db
          .from('features')
          .select(
            'id, unit_code, unit_status, floor_id, floors(name, level, building_id, buildings!floors_building_same_venue(name)), location_units(location_id, locations(name, status))',
          )
          .eq('venue_id', venueId)
          .eq('kind', 'unit')
          .order('id')
          .range(from, to),
      );
      return (rows as unknown as VenueUnitRow[]).map(mapVenueUnitRow);
    },

    async forUnit(featureId) {
      const { data, error } = await db
        .from('location_units')
        .select('locations(id, name, status)')
        .eq('feature_id', featureId);
      if (error) throw toDataError(error);
      return data.flatMap((row) => {
        const location = row.locations as unknown as {
          id: string;
          name: string;
          status: string;
        } | null;
        return location
          ? [
              {
                id: LocationIdSchema.parse(location.id),
                name: location.name,
                status: statusOf(location.status),
              },
            ]
          : [];
      });
    },

    imageUrl(path) {
      return storage().getPublicUrl(path).data.publicUrl;
    },
  };
}
