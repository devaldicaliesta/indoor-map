import type { FloorId, FloorPlanId } from './ids';

export const FLOOR_PLAN_FORMATS = ['png', 'jpg', 'pdf', 'dwg', 'dxf'] as const;
export type FloorPlanFormat = (typeof FLOOR_PLAN_FORMATS)[number];

/** Format yang bisa diunggah sekarang; DWG/DXF menunggu konversi CAD (T-313). */
export type UploadableFloorPlanFormat = Extract<FloorPlanFormat, 'png' | 'jpg' | 'pdf'>;

/** NFR-SEC-04: denah ≤ 50 MB (juga batas bucket di server). */
export const MAX_FLOOR_PLAN_BYTES = 50 * 1024 * 1024;
/** Raster hasil PDF tidak lebih lebar dari ini agar tetap bisa dimuat browser. */
export const MAX_RASTER_WIDTH_PX = 8000;

export interface FloorPlan {
  id: FloorPlanId;
  floorId: FloorId;
  sourcePath: string;
  sourceFormat: FloorPlanFormat;
  /** Gambar yang ditampilkan di peta: raster PDF, atau file asli untuk PNG/JPG. */
  rasterPath: string | null;
  pdfPage: number | null;
  /** Sudut TL, TR, BR, BL sebagai [lng, lat]; kosong sebelum georeferensi (T-106). */
  corners: [number, number][] | null;
  opacity: number;
  isActive: boolean;
  createdAt: string;
}

export type FloorPlanFileProblem = 'empty' | 'too_large' | 'cad_later' | 'unsupported_type';

const MIME_FORMATS: Record<string, UploadableFloorPlanFormat> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'application/pdf': 'pdf',
};
const EXTENSION_FORMATS: Record<string, UploadableFloorPlanFormat> = {
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
  pdf: 'pdf',
};

const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

export type FloorPlanFileCheck =
  | { ok: true; format: UploadableFloorPlanFormat }
  | { ok: false; problem: FloorPlanFileProblem };

/**
 * Tipe dan ukuran berkas denah. MIME dan ekstensi harus sepakat: browser kadang
 * mengirim MIME kosong, dan ekstensi saja mudah dipalsukan.
 */
export function checkFloorPlanFile(file: {
  name: string;
  type: string;
  size: number;
}): FloorPlanFileCheck {
  const extension = extensionOf(file.name);
  if (extension === 'dwg' || extension === 'dxf') return { ok: false, problem: 'cad_later' };
  const byExtension = EXTENSION_FORMATS[extension];
  const byMime = file.type ? MIME_FORMATS[file.type] : byExtension;
  if (!byExtension || byMime !== byExtension) return { ok: false, problem: 'unsupported_type' };
  if (file.size === 0) return { ok: false, problem: 'empty' };
  if (file.size > MAX_FLOOR_PLAN_BYTES) return { ok: false, problem: 'too_large' };
  return { ok: true, format: byExtension };
}

/**
 * Skala render halaman PDF: lebar mendekati target, tetapi tidak ada sisi yang melewati
 * batas raster (halaman potret A0 akan terlalu tinggi bila hanya lebar yang dibatasi).
 */
export function pdfRenderScale(widthPt: number, heightPt: number, targetWidthPx = 4000): number {
  if (!(widthPt > 0 && heightPt > 0)) return 1;
  const byWidth = Math.min(targetWidthPx, MAX_RASTER_WIDTH_PX) / widthPt;
  return Math.min(byWidth, MAX_RASTER_WIDTH_PX / heightPt);
}
