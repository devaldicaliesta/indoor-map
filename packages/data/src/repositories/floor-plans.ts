import {
  checkFloorPlanFile,
  checkFloorPlanPlacement,
  FLOOR_PLAN_FORMATS,
  type FloorId,
  FloorIdSchema,
  type FloorPlan,
  type FloorPlanFileProblem,
  type FloorPlanFormat,
  type FloorPlanId,
  FloorPlanIdSchema,
  type FloorPlanPlacement,
} from '@indoor/domain';
import type { Tables } from '../database.types';
import { DataError, toDataError } from '../errors';
import { zeroRowsError } from '../mutations';
import type { Db } from '../supabase';

const BUCKET = 'floor-plans';
const COLUMNS =
  'id, floor_id, source_path, source_format, raster_path, pdf_page, cad_layers, natural_width_m, corners, opacity, is_active, uploaded_by, created_at';
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
    cadLayers: row.cad_layers,
    naturalWidthM: row.natural_width_m === null ? null : Number(row.natural_width_m),
    corners: isCorners(row.corners) ? row.corners : null,
    opacity: Number(row.opacity),
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export interface FloorPlanUpload {
  /** Berkas asli dari pengguna. */
  source: File;
  /** PNG hasil render halaman PDF atau layer DXF; wajib untuk keduanya, diabaikan untuk gambar. */
  raster?: Blob;
  pdfPage?: number;
  /** Layer DXF yang dirender ke `raster`. */
  cadLayers?: string[];
  naturalWidthM?: number | null;
}

export interface FloorPlansRepository {
  /** Semua versi denah lantai, terbaru dulu; yang aktif paling banyak satu. */
  list(floorId: FloorId): Promise<FloorPlan[]>;
  /** Versi baru menjadi aktif; versi lama tetap tersimpan sebagai riwayat. */
  upload(floorId: FloorId, input: FloorPlanUpload): Promise<FloorPlan>;
  savePlacement(id: FloorPlanId, placement: FloorPlanPlacement): Promise<FloorPlan>;
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

  async function isVisible(id: FloorPlanId) {
    const { data } = await db.from('floor_plans').select('id').eq('id', id).maybeSingle();
    return data !== null;
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
      const rendered = check.format === 'pdf' || check.format === 'dxf';
      if (rendered && !input.raster) {
        throw new DataError('invalid', {
          message:
            check.format === 'pdf' ? 'Halaman PDF belum dirender.' : 'Layer DXF belum dirender.',
        });
      }
      if (check.format === 'dxf' && !input.cadLayers?.length) {
        throw new DataError('invalid', { message: 'Pilih minimal satu layer DXF.' });
      }

      // Batas unggah dan Storage lisensi (trial: 20 MB per berkas) dengan pesan yang jelas;
      // Storage tetap menolak lewat trigger bila pemeriksaan ini dilewati.
      const allowed = await db.rpc('license_upload_check', { p_bytes: input.source.size });
      if (allowed.error) throw toDataError(allowed.error);

      const venueId = await venueOf(floorId);
      const base = `${venueId}/${floorId}/${Date.now()}`;
      const sourcePath = `${base}-source.${check.format}`;
      const rasterPath = rendered ? `${base}-raster.png` : sourcePath;
      const written: string[] = [];
      try {
        // MIME DXF dari browser tidak seragam; bucket hanya menerima `image/vnd.dxf`.
        const sourceType =
          check.format === 'dxf' ? mimeOf('dxf') : input.source.type || mimeOf(check.format);
        // Storage memakai tipe objek Blob, bukan opsi contentType; tipe DXF diseragamkan dulu.
        await put(sourcePath, new Blob([input.source], { type: sourceType }), sourceType);
        written.push(sourcePath);
        if (input.raster && rendered) {
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
            cad_layers: check.format === 'dxf' ? (input.cadLayers ?? []) : [],
            natural_width_m: check.format === 'dxf' ? (input.naturalWidthM ?? null) : null,
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

    async savePlacement(id, placement) {
      if (checkFloorPlanPlacement(placement).length) {
        throw new DataError('invalid', { message: 'Posisi denah tidak valid.' });
      }
      const { data, error } = await db
        .from('floor_plans')
        .update({ corners: placement.corners, opacity: placement.opacity })
        .eq('id', id)
        .select(COLUMNS);
      if (error) throw toDataError(error);
      const row = data[0];
      if (!row) throw await zeroRowsError(() => isVisible(id));
      return mapFloorPlanRow(row);
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

const MIME_OF: Record<FloorPlanFormat, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  pdf: 'application/pdf',
  dxf: 'image/vnd.dxf',
  dwg: 'application/octet-stream',
};
const mimeOf = (format: FloorPlanFormat) => MIME_OF[format];

export function floorPlanProblemMessage(problem: FloorPlanFileProblem): string {
  switch (problem) {
    case 'too_large':
      return 'Berkas terlalu besar. Denah maksimal 50 MB.';
    case 'dwg_unsupported':
      return 'DWG tidak didukung. Simpan sebagai DXF atau PDF dari software CAD (atau DWG TrueView yang gratis), lalu unggah lagi.';
    case 'empty':
      return 'Berkas kosong.';
    case 'unsupported_type':
      return 'Tipe berkas tidak didukung. Unggah PNG, JPG, PDF, atau DXF.';
  }
}
