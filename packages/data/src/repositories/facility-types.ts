import {
  type FacilityType,
  type FacilityTypeId,
  FacilityTypeIdSchema,
  type FacilityTypeInput,
  facilityIconPath,
  MAX_FACILITY_ICON_BYTES,
  parseFacilityIcon,
  sortFacilityTypes,
  type VenueId,
  VenueIdSchema,
} from '@indoor/domain';
import type { Tables } from '../database.types';
import { DataError, toDataError } from '../errors';
import { zeroRowsError } from '../mutations';
import type { Db } from '../supabase';

const COLUMNS = 'id, venue_id, name, icon_path, is_safety, sort_order';
const ASSETS_BUCKET = 'public-assets';

type FacilityTypeRow = Pick<
  Tables<'facility_types'>,
  'id' | 'venue_id' | 'name' | 'icon_path' | 'is_safety' | 'sort_order'
>;

/** Jenis fasilitas beserta jumlah fitur fasilitas (draft) yang memakainya. */
export interface FacilityTypeWithUsage extends FacilityType {
  usageCount: number;
}

export function mapFacilityTypeRow(row: FacilityTypeRow): FacilityType {
  return {
    id: FacilityTypeIdSchema.parse(row.id),
    venueId: VenueIdSchema.parse(row.venue_id),
    name: row.name,
    icon: parseFacilityIcon(row.icon_path),
    isSafety: row.is_safety,
    sortOrder: row.sort_order,
  };
}

/** Pesan saat jenis masih dipakai: menyebut jumlah dan lantainya agar mudah dicari di editor. */
export function facilityTypeInUseMessage(
  name: string,
  count: number,
  floors: readonly string[],
): string {
  const used = count > 0 ? `${count} fasilitas` : 'fasilitas';
  const where = floors.length ? ` di ${floors.join(', ')}` : '';
  return `Jenis "${name}" tidak bisa dihapus karena masih dipakai ${used}${where}. Ganti jenisnya atau hapus fasilitas tersebut di Editor Peta lebih dulu.`;
}

export interface FacilityTypesRepository {
  /** Semua jenis fasilitas venue, terurut, dengan jumlah pemakaiannya. */
  list(venueId: VenueId): Promise<FacilityTypeWithUsage[]>;
  /**
   * Membuat jenis baru. `iconPng` (hasil rasterisasi ikon unggahan) diunggah lebih dulu;
   * bila menyimpan baris gagal, berkasnya dihapus lagi.
   */
  create(venueId: VenueId, input: FacilityTypeInput, iconPng?: Blob): Promise<FacilityType>;
  /** Mengubah jenis; ikon unggahan lama dihapus bila diganti. */
  update(id: FacilityTypeId, input: FacilityTypeInput, iconPng?: Blob): Promise<FacilityType>;
  /** Jenis yang masih dipakai fitur ditolak (FK `on delete restrict`) dengan pesan yang jelas. */
  remove(id: FacilityTypeId): Promise<void>;
  iconUrl(path: string): string;
}

function checkIconPng(file: Blob) {
  if (file.type !== 'image/png') {
    throw new DataError('invalid', { message: 'Ikon harus berupa PNG hasil konversi.' });
  }
  if (file.size > MAX_FACILITY_ICON_BYTES) {
    throw new DataError('invalid', { message: 'Ikon terlalu besar. Maksimal 200 kB.' });
  }
}

const isUpload = (path: string | null): path is string =>
  path !== null && parseFacilityIcon(path)?.kind === 'upload';

export function createFacilityTypesRepository(db: Db): FacilityTypesRepository {
  const storage = () => db.storage.from(ASSETS_BUCKET);

  async function isVisible(id: FacilityTypeId) {
    const { data } = await db.from('facility_types').select('id').eq('id', id).maybeSingle();
    return data !== null;
  }

  async function uploadIcon(venueId: string, id: string, file: Blob): Promise<string> {
    checkIconPng(file);
    const path = `facility-types/${venueId}/${id}-${Date.now()}.png`;
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
          message: 'Nama jenis fasilitas sudah dipakai di venue ini.',
          code: mapped.code,
          cause: error,
        })
      : mapped;
  }

  async function inUseError(id: FacilityTypeId, cause: unknown): Promise<DataError> {
    const [{ data: type }, { data: rows }] = await Promise.all([
      db.from('facility_types').select('name').eq('id', id).maybeSingle(),
      db
        .from('features')
        .select('floors(name, buildings!floors_building_same_venue(name))')
        .eq('facility_type_id', id),
    ]);
    const floors = new Set<string>();
    for (const row of rows ?? []) {
      const floor = row.floors as unknown as { name: string; buildings: { name: string } | null };
      floors.add(floor.buildings ? `${floor.buildings.name} ${floor.name}` : floor.name);
    }
    return new DataError('conflict', {
      message: facilityTypeInUseMessage(type?.name ?? '', rows?.length ?? 0, [...floors]),
      code: '23503',
      cause,
    });
  }

  return {
    async list(venueId) {
      const { data, error } = await db
        .from('facility_types')
        .select(`${COLUMNS}, features(count)`)
        .eq('venue_id', venueId);
      if (error) throw toDataError(error);
      return sortFacilityTypes(
        data.map((row) => ({
          ...mapFacilityTypeRow(row),
          usageCount: (row.features as unknown as { count: number }[])[0]?.count ?? 0,
        })),
      );
    },

    async create(venueId, input, iconPng) {
      const id = globalThis.crypto.randomUUID();
      const uploaded = iconPng ? await uploadIcon(venueId, id, iconPng) : null;
      const { data, error } = await db
        .from('facility_types')
        .insert({
          id,
          venue_id: venueId,
          name: input.name.trim(),
          is_safety: input.isSafety,
          icon_path: uploaded ?? facilityIconPath(input.icon),
        })
        .select(COLUMNS)
        .single();
      if (error) {
        await removeFile(uploaded);
        throw saveError(error);
      }
      return mapFacilityTypeRow(data);
    },

    async update(id, input, iconPng) {
      const current = await db
        .from('facility_types')
        .select('venue_id, icon_path')
        .eq('id', id)
        .maybeSingle();
      if (current.error) throw toDataError(current.error);
      if (!current.data) throw new DataError('not_found');
      const uploaded = iconPng ? await uploadIcon(current.data.venue_id, id, iconPng) : null;
      const iconPath = uploaded ?? facilityIconPath(input.icon);
      const { data, error } = await db
        .from('facility_types')
        .update({ name: input.name.trim(), is_safety: input.isSafety, icon_path: iconPath })
        .eq('id', id)
        .select(COLUMNS);
      if (error || !data[0]) {
        await removeFile(uploaded);
        throw error ? saveError(error) : await zeroRowsError(() => isVisible(id));
      }
      if (current.data.icon_path !== iconPath) await removeFile(current.data.icon_path);
      return mapFacilityTypeRow(data[0]);
    },

    async remove(id) {
      const { data, error } = await db
        .from('facility_types')
        .delete()
        .eq('id', id)
        .select('icon_path');
      if (error) throw error.code === '23503' ? await inUseError(id, error) : toDataError(error);
      const row = data[0];
      if (!row) throw await zeroRowsError(() => isVisible(id));
      await removeFile(row.icon_path);
    },

    iconUrl(path) {
      return storage().getPublicUrl(path).data.publicUrl;
    },
  };
}
