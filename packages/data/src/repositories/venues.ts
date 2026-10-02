import {
  BuildingIdSchema,
  MAX_IMAGE_BYTES,
  type Point,
  VENUE_TYPES,
  type Venue,
  type VenueId,
  VenueIdSchema,
  type VenueInput,
  type VenueSummary,
  type VenueTemplate,
  VenueTemplateSchema,
  type VenueType,
} from '@indoor/domain';
import type { Json, Tables } from '../database.types';
import { DataError, toDataError } from '../errors';
import { geometryToColumn, nullableGeometryFromColumn } from '../geometry';
import { zeroRowsError } from '../mutations';
import type { Db } from '../supabase';

const COLUMNS =
  'id, name, address, center, logo_path, timezone, venue_type, default_building_id, created_at, updated_at';
const ASSETS_BUCKET = 'public-assets';
const SNAPSHOTS_BUCKET = 'snapshots';
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
  /** Venue baru memakai tipe `custom` sampai template diterapkan. */
  create(input: VenueInput): Promise<Venue>;
  /**
   * Menyalin template industri ke venue yang belum berisi lokasi (`apply_template`, satu
   * transaksi): tipe lokasi, field, kategori, jenis fasilitas, alias, dan tipe venue.
   */
  applyTemplate(id: VenueId, template: VenueTemplate): Promise<void>;
  update(id: VenueId, input: VenueInput): Promise<Venue>;
  /** Menghapus venue beserta semua data turunannya (cascade) dan berkas logonya. */
  remove(id: VenueId): Promise<void>;
  uploadLogo(id: VenueId, file: Blob): Promise<Venue>;
  /** Mengosongkan logo venue dan menghapus berkasnya. */
  removeLogo(id: VenueId): Promise<Venue>;
  logoUrl(path: string): string;
}

export function createVenuesRepository(db: Db): VenuesRepository {
  async function isVisible(id: VenueId) {
    const { data } = await db.from('venues').select('id').eq('id', id).maybeSingle();
    return data !== null;
  }

  /** Berkas publik venue: logo, ikon jenis fasilitas dan kategori, gambar lokasi. */
  async function removeFiles(id: VenueId) {
    const folders: [bucket: string, folder: string][] = [
      [ASSETS_BUCKET, `venues/${id}`],
      [ASSETS_BUCKET, `facility-types/${id}`],
      [ASSETS_BUCKET, `locations/${id}`],
      [ASSETS_BUCKET, `categories/${id}`],
      // Snapshot publik venue yang dihapus tidak boleh tetap bisa dibuka Visitor.
      [SNAPSHOTS_BUCKET, id],
    ];
    for (const [bucket, folder] of folders) {
      // Storage mendaftar paling banyak `limit` berkas per panggilan; berkas yang sudah
      // dihapus hilang dari daftar, jadi daftar diulang dari awal sampai kosong.
      for (;;) {
        const { data } = await db.storage.from(bucket).list(folder, { limit: 1000 });
        if (!data?.length) break;
        const removed = await db.storage
          .from(bucket)
          .remove(data.map((f) => `${folder}/${f.name}`));
        if (removed.error || !removed.data?.length) break;
      }
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

    async applyTemplate(id, template) {
      const { error } = await db.rpc('apply_template', {
        p_venue_id: id,
        p_venue_type: template.venueType,
        p_template: VenueTemplateSchema.parse(template) as unknown as Json,
      });
      if (error) throw toDataError(error);
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

    async removeLogo(id) {
      const previous = await db.from('venues').select('logo_path').eq('id', id).maybeSingle();
      const { data, error } = await db
        .from('venues')
        .update({ logo_path: null })
        .eq('id', id)
        .select(COLUMNS);
      if (error) throw toDataError(error);
      const row = data[0];
      if (!row) throw await zeroRowsError(() => isVisible(id));
      const old = previous.data?.logo_path;
      if (old) await db.storage.from(ASSETS_BUCKET).remove([old]);
      return mapVenueRow(row);
    },

    logoUrl(path) {
      return db.storage.from(ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;
    },
  };
}
