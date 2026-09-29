import {
  BuildingIdSchema,
  type Point,
  VENUE_TYPES,
  type Venue,
  type VenueId,
  VenueIdSchema,
  type VenueInput,
  type VenueSummary,
  type VenueType,
} from '@indoor/domain';
import type { Tables } from '../database.types';
import { DataError, toDataError } from '../errors';
import { geometryToColumn, nullableGeometryFromColumn } from '../geometry';
import { zeroRowsError } from '../mutations';
import type { Db } from '../supabase';

const COLUMNS =
  'id, name, address, center, logo_path, timezone, venue_type, default_building_id, created_at, updated_at';
const ASSETS_BUCKET = 'public-assets';
/** NFR-SEC-04: 5 MB per gambar; juga ditegakkan batas bucket di server. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const LOGO_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export type VenueRow = Tables<'venues'>;

export function mapVenueRow(row: VenueRow): Venue {
  const center = nullableGeometryFromColumn(row.center);
  if (center && center.type !== 'Point') {
    throw new DataError('invalid', { message: 'Titik pusat venue bukan titik.' });
  }
  return {
    id: VenueIdSchema.parse(row.id),
    name: row.name,
    address: row.address,
    center: center as Point | null,
    logoPath: row.logo_path,
    timezone: row.timezone,
    venueType: (VENUE_TYPES as readonly string[]).includes(row.venue_type)
      ? (row.venue_type as VenueType)
      : 'custom',
    defaultBuildingId: row.default_building_id
      ? BuildingIdSchema.parse(row.default_building_id)
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toVenueColumns(input: VenueInput) {
  return {
    name: input.name.trim(),
    address: input.address?.trim() || null,
    center: input.center ? geometryToColumn(input.center) : null,
    timezone: input.timezone,
  };
}

export interface VenuesRepository {
  list(): Promise<VenueSummary[]>;
  listDetailed(): Promise<Venue[]>;
  get(id: VenueId): Promise<Venue>;
  /** Venue baru memakai tipe `custom`; template industri di T-302. */
  create(input: VenueInput): Promise<Venue>;
  update(id: VenueId, input: VenueInput): Promise<Venue>;
  /** Menghapus venue beserta semua data turunannya (cascade) dan berkas logonya. */
  remove(id: VenueId): Promise<void>;
  uploadLogo(id: VenueId, file: Blob): Promise<Venue>;
  logoUrl(path: string): string;
}

export function createVenuesRepository(db: Db): VenuesRepository {
  async function isVisible(id: VenueId) {
    const { data } = await db.from('venues').select('id').eq('id', id).maybeSingle();
    return data !== null;
  }

  /** Logo venue dan ikon jenis fasilitasnya (T-112). */
  async function removeFiles(id: VenueId) {
    for (const folder of [`venues/${id}`, `facility-types/${id}`]) {
      const { data } = await db.storage.from(ASSETS_BUCKET).list(folder);
      if (data?.length)
        await db.storage.from(ASSETS_BUCKET).remove(data.map((f) => `${folder}/${f.name}`));
    }
  }

  return {
    async list() {
      const { data, error } = await db.from('venues').select('id, name').order('name');
      if (error) throw toDataError(error);
      return data.map((row) => ({ id: VenueIdSchema.parse(row.id), name: row.name }));
    },

    async listDetailed() {
      const { data, error } = await db.from('venues').select(COLUMNS).order('name');
      if (error) throw toDataError(error);
      return data.map(mapVenueRow);
    },

    async get(id) {
      const { data, error } = await db.from('venues').select(COLUMNS).eq('id', id).maybeSingle();
      if (error) throw toDataError(error);
      if (!data) throw new DataError('not_found', { message: 'Venue tidak ditemukan.' });
      return mapVenueRow(data);
    },

    async create(input) {
      const { data, error } = await db
        .from('venues')
        .insert({ ...toVenueColumns(input), venue_type: 'custom' })
        .select(COLUMNS)
        .single();
      if (error) throw toDataError(error);
      return mapVenueRow(data);
    },

    async update(id, input) {
      const { data, error } = await db
        .from('venues')
        .update(toVenueColumns(input))
        .eq('id', id)
        .select(COLUMNS);
      if (error) throw toDataError(error);
      const row = data[0];
      if (!row) throw await zeroRowsError(() => isVisible(id));
      return mapVenueRow(row);
    },

    async remove(id) {
      const { data, error } = await db.from('venues').delete().eq('id', id).select('id');
      if (error) throw toDataError(error);
      if (!data[0]) throw await zeroRowsError(() => isVisible(id));
      // Berkas tidak ikut cascade database; kegagalan pembersihan tidak membatalkan hapus.
      await removeFiles(id).catch(() => undefined);
    },

    async uploadLogo(id, file) {
      const extension = LOGO_TYPES[file.type];
      if (!extension) {
        throw new DataError('invalid', { message: 'Logo harus berupa PNG, JPG, atau WebP.' });
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new DataError('invalid', { message: 'Logo terlalu besar. Maksimal 5 MB.' });
      }
      const path = `venues/${id}/logo-${Date.now()}.${extension}`;
      const upload = await db.storage
        .from(ASSETS_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (upload.error) throw toDataError(upload.error);

      const previous = await db.from('venues').select('logo_path').eq('id', id).maybeSingle();
      const { data, error } = await db
        .from('venues')
        .update({ logo_path: path })
        .eq('id', id)
        .select(COLUMNS);
      if (error || !data[0]) {
        await db.storage.from(ASSETS_BUCKET).remove([path]);
        throw error ? toDataError(error) : await zeroRowsError(() => isVisible(id));
      }
      const old = previous.data?.logo_path;
      if (old && old !== path) await db.storage.from(ASSETS_BUCKET).remove([old]);
      return mapVenueRow(data[0]);
    },

    logoUrl(path) {
      return db.storage.from(ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;
    },
  };
}
