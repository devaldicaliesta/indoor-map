import {
  type Category,
  type CategoryId,
  CategoryIdSchema,
  type CategoryInput,
  facilityIconPath,
  type LocationTypeId,
  LocationTypeIdSchema,
  type LocationTypeSummary,
  parseFacilityIcon,
  sortCategories,
  type VenueId,
} from '@indoor/domain';
import type { Tables } from '../database.types';
import { DataError, toDataError } from '../errors';
import { zeroRowsError } from '../mutations';
import type { Db } from '../supabase';
import { checkIconPng } from './facility-types';

const COLUMNS = 'id, location_type_id, name, icon, sort_order';
const ASSETS_BUCKET = 'public-assets';

type CategoryRow = Pick<
  Tables<'categories'>,
  'id' | 'location_type_id' | 'name' | 'icon' | 'sort_order'
>;

/** Kategori beserta jumlah lokasi yang memakainya. */
export interface CategoryWithUsage extends Category {
  usageCount: number;
}

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: CategoryIdSchema.parse(row.id),
    locationTypeId: LocationTypeIdSchema.parse(row.location_type_id),
    name: row.name,
    icon: parseFacilityIcon(row.icon),
    sortOrder: row.sort_order,
  };
}

export interface CategoriesRepository {
  /** Saat ini hanya tipe bawaan "Lokasi"; kelola tipe di T-303. */
  listTypes(venueId: VenueId): Promise<LocationTypeSummary[]>;
  /** Kategori semua tipe lokasi venue, terurut, dengan jumlah lokasinya. */
  list(venueId: VenueId): Promise<CategoryWithUsage[]>;
  /** `iconPng` (hasil rasterisasi ikon unggahan) diunggah lebih dulu; dihapus lagi bila gagal. */
  create(
    venueId: VenueId,
    typeId: LocationTypeId,
    input: CategoryInput & { sortOrder: number },
    iconPng?: Blob,
  ): Promise<Category>;
  update(id: CategoryId, input: CategoryInput, iconPng?: Blob): Promise<Category>;
  reorder(order: readonly { id: CategoryId; sortOrder: number }[]): Promise<void>;
  /** Kategori yang dipakai lokasi ikut dilepas dari lokasi tersebut (cascade). */
  remove(id: CategoryId): Promise<void>;
  iconUrl(path: string): string;
}

const isUpload = (path: string | null): path is string =>
  path !== null && parseFacilityIcon(path)?.kind === 'upload';

export function createCategoriesRepository(db: Db): CategoriesRepository {
  const storage = () => db.storage.from(ASSETS_BUCKET);

  async function isVisible(id: CategoryId) {
    const { data } = await db.from('categories').select('id').eq('id', id).maybeSingle();
    return data !== null;
  }

  async function uploadIcon(venueId: string, id: string, file: Blob): Promise<string> {
    checkIconPng(file);
    const path = `categories/${venueId}/${id}-${Date.now()}.png`;
    const { error } = await storage().upload(path, file, { contentType: 'image/png' });
    if (error) throw toDataError(error);
    return path;
  }

  async function removeFile(path: string | null) {
    // Kegagalan membersihkan berkas tidak membatalkan perubahan data.
    if (isUpload(path))
      await storage()
        .remove([path])
        .then(undefined, () => undefined);
  }

  function saveError(error: unknown): DataError {
    const mapped = toDataError(error);
    return mapped.code === '23505'
      ? new DataError('conflict', {
          message: 'Nama kategori sudah dipakai di tipe lokasi ini.',
          code: mapped.code,
          cause: error,
        })
      : mapped;
  }

  return {
    async listTypes(venueId) {
      const { data, error } = await db
        .from('location_types')
        .select('id, name, sort_order')
        .eq('venue_id', venueId)
        .order('sort_order')
        .order('created_at');
      if (error) throw toDataError(error);
      return data.map((row) => ({ id: LocationTypeIdSchema.parse(row.id), name: row.name }));
    },

    async list(venueId) {
      const { data, error } = await db
        .from('categories')
        .select(`${COLUMNS}, location_types!inner(venue_id), location_categories(count)`)
        .eq('location_types.venue_id', venueId);
      if (error) throw toDataError(error);
      return sortCategories(
        data.map((row) => ({
          ...mapCategoryRow(row),
          usageCount: (row.location_categories as unknown as { count: number }[])[0]?.count ?? 0,
        })),
      );
    },

    async create(venueId, typeId, input, iconPng) {
      const id = globalThis.crypto.randomUUID();
      const uploaded = iconPng ? await uploadIcon(venueId, id, iconPng) : null;
      const { data, error } = await db
        .from('categories')
        .insert({
          id,
          location_type_id: typeId,
          name: input.name.trim(),
          icon: uploaded ?? facilityIconPath(input.icon),
          sort_order: input.sortOrder,
        })
        .select(COLUMNS)
        .single();
      if (error) {
        await removeFile(uploaded);
        throw saveError(error);
      }
      return mapCategoryRow(data);
    },

    async update(id, input, iconPng) {
      const current = await db
        .from('categories')
        .select('icon, location_types(venue_id)')
        .eq('id', id)
        .maybeSingle();
      if (current.error) throw toDataError(current.error);
      if (!current.data) throw new DataError('not_found');
      const venueId = (current.data.location_types as unknown as { venue_id: string }).venue_id;
      const uploaded = iconPng ? await uploadIcon(venueId, id, iconPng) : null;
      const icon = uploaded ?? facilityIconPath(input.icon);
      const { data, error } = await db
        .from('categories')
        .update({ name: input.name.trim(), icon })
        .eq('id', id)
        .select(COLUMNS);
      if (error || !data[0]) {
        await removeFile(uploaded);
        throw error ? saveError(error) : await zeroRowsError(() => isVisible(id));
      }
      if (current.data.icon !== icon) await removeFile(current.data.icon);
      return mapCategoryRow(data[0]);
    },

    async reorder(order) {
      const results = await Promise.all(
        order.map(({ id, sortOrder }) =>
          db.from('categories').update({ sort_order: sortOrder }).eq('id', id).select('id'),
        ),
      );
      for (const [index, { data, error }] of results.entries()) {
        if (error) throw toDataError(error);
        const id = order[index]?.id;
        if (!data[0] && id) throw await zeroRowsError(() => isVisible(id));
      }
    },

    async remove(id) {
      const { data, error } = await db.from('categories').delete().eq('id', id).select('icon');
      if (error) throw toDataError(error);
      const row = data[0];
      if (!row) throw await zeroRowsError(() => isVisible(id));
      await removeFile(row.icon);
    },

    iconUrl(path) {
      return storage().getPublicUrl(path).data.publicUrl;
    },
  };
}
