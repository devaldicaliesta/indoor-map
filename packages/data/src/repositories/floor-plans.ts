import {
  checkFloorPlanFile,
  FLOOR_PLAN_FORMATS,
  type FloorId,
  FloorIdSchema,
  type FloorPlan,
  type FloorPlanFileProblem,
  type FloorPlanFormat,
  FloorPlanIdSchema,
} from '@indoor/domain';
import type { Tables } from '../database.types';
import { DataError, toDataError } from '../errors';
import type { Db } from '../supabase';

const BUCKET = 'floor-plans';
const COLUMNS =
  'id, floor_id, source_path, source_format, raster_path, pdf_page, cad_layers, corners, opacity, is_active, uploaded_by, created_at';
/** URL bertanda cukup lama untuk satu sesi kerja, cukup singkat agar tidak jadi tautan publik. */
const SIGNED_URL_SECONDS = 60 * 60;

type FloorPlanRow = Tables<'floor_plans'>;

const isCorners = (value: unknown): value is [number, number][] =>
  Array.isArray(value) &&
  value.length === 4 &&
  value.every((p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number'));

export function mapFloorPlanRow(row: FloorPlanRow): FloorPlan {
  return {
    id: FloorPlanIdSchema.parse(row.id),
    floorId: FloorIdSchema.parse(row.floor_id),
    sourcePath: row.source_path,
    sourceFormat: (FLOOR_PLAN_FORMATS as readonly string[]).includes(row.source_format)
      ? (row.source_format as FloorPlanFormat)
      : 'png',
    rasterPath: row.raster_path,
    pdfPage: row.pdf_page,
    corners: isCorners(row.corners) ? row.corners : null,
    opacity: Number(row.opacity),
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export interface FloorPlanUpload {
  /** Berkas asli dari pengguna. */
  source: File;
  /** PNG hasil render halaman PDF; wajib untuk PDF, diabaikan untuk gambar. */
  raster?: Blob;
  pdfPage?: number;
}

export interface FloorPlansRepository {
  /** Semua versi denah lantai, terbaru dulu; yang aktif paling banyak satu. */
  list(floorId: FloorId): Promise<FloorPlan[]>;
  /** FR-VEN-07: versi baru menjadi aktif; versi lama tetap tersimpan sebagai riwayat. */
  upload(floorId: FloorId, input: FloorPlanUpload): Promise<FloorPlan>;
  /** URL bertanda untuk bucket privat, satu per path (urutan sama dengan masukan). */
  signedUrls(paths: string[]): Promise<string[]>;
}

export function createFloorPlansRepository(db: Db): FloorPlansRepository {
  async function venueOf(floorId: FloorId) {
    const { data, error } = await db
      .from('floors')
      .select('venue_id')
      .eq('id', floorId)
      .maybeSingle();
    if (error) throw toDataError(error);
    if (!data) throw new DataError('not_found', { message: 'Lantai tidak ditemukan.' });
    return data.venue_id;
  }

  async function put(path: string, body: Blob, contentType: string) {
    const { error } = await db.storage.from(BUCKET).upload(path, body, { contentType });
    if (error) throw toDataError(error);
  }

  return {
    async list(floorId) {
      const { data, error } = await db
        .from('floor_plans')
        .select(COLUMNS)
        .eq('floor_id', floorId)
        .order('created_at', { ascending: false });
      if (error) throw toDataError(error);
      return data.map(mapFloorPlanRow);
    },

    async upload(floorId, input) {
      const check = checkFloorPlanFile(input.source);
      if (!check.ok)
        throw new DataError('invalid', { message: floorPlanProblemMessage(check.problem) });
      if (check.format === 'pdf' && !input.raster) {
        throw new DataError('invalid', { message: 'Halaman PDF belum dirender.' });
      }

      const venueId = await venueOf(floorId);
      const base = `${venueId}/${floorId}/${Date.now()}`;
      const sourcePath = `${base}-source.${check.format}`;
      const rasterPath = check.format === 'pdf' ? `${base}-raster.png` : sourcePath;
      const written: string[] = [];
      try {
        await put(sourcePath, input.source, input.source.type || mimeOf(check.format));
        written.push(sourcePath);
        if (input.raster && check.format === 'pdf') {
          await put(rasterPath, input.raster, 'image/png');
          written.push(rasterPath);
        }

        // Indeks unik "satu aktif per lantai" mengharuskan yang lama dinonaktifkan dulu.
        const deactivate = await db
          .from('floor_plans')
          .update({ is_active: false })
          .eq('floor_id', floorId)
          .eq('is_active', true);
        if (deactivate.error) throw toDataError(deactivate.error);

        const { data: auth } = await db.auth.getUser();
        const { data, error } = await db
          .from('floor_plans')
          .insert({
            floor_id: floorId,
            source_path: sourcePath,
            source_format: check.format,
            raster_path: rasterPath,
            pdf_page: check.format === 'pdf' ? (input.pdfPage ?? 1) : null,
            uploaded_by: auth.user?.id ?? null,
          })
          .select(COLUMNS)
          .single();
        if (error) throw toDataError(error);
        return mapFloorPlanRow(data);
      } catch (cause) {
        if (written.length) await db.storage.from(BUCKET).remove(written);
        throw cause;
      }
    },

    async signedUrls(paths) {
      if (paths.length === 0) return [];
      const { data, error } = await db.storage
        .from(BUCKET)
        .createSignedUrls(paths, SIGNED_URL_SECONDS);
      if (error) throw toDataError(error);
      return paths.map((path) => data.find((d) => d.path === path)?.signedUrl ?? '');
    },
  };
}

const mimeOf = (format: FloorPlanFormat) =>
  format === 'pdf' ? 'application/pdf' : format === 'jpg' ? 'image/jpeg' : 'image/png';

export function floorPlanProblemMessage(problem: FloorPlanFileProblem): string {
  switch (problem) {
    case 'too_large':
      return 'Berkas terlalu besar. Denah maksimal 50 MB.';
    case 'cad_later':
      return 'DWG/DXF belum didukung. Ekspor denah ke PDF atau PNG lebih dulu.';
    case 'empty':
      return 'Berkas kosong.';
    case 'unsupported_type':
      return 'Tipe berkas tidak didukung. Unggah PNG, JPG, atau PDF.';
  }
}
