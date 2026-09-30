/** NFR-SEC-04: gambar (logo, foto) maksimal 5 MB; batas yang sama ditegakkan bucket Storage. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageMime = 'image/png' | 'image/jpeg' | 'image/webp';
export type ImageFileProblem = 'empty' | 'too_large' | 'unsupported_type';
export type ImageFileCheck =
  | { ok: true; mime: ImageMime; extension: 'png' | 'jpg' | 'webp' }
  | { ok: false; problem: ImageFileProblem };

const MIME_BY_EXTENSION: Record<string, ImageMime> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};
const EXTENSION_BY_MIME: Record<ImageMime, 'png' | 'jpg' | 'webp'> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/** PNG, JPG, atau WebP. SVG ditolak karena bisa membawa skrip (lihat migrasi 0005). */
export function checkImageFile(file: { name: string; type: string; size: number }): ImageFileCheck {
  const mime = MIME_BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''];
  // Browser kadang tidak mengirim MIME; bila ada, harus sepakat dengan ekstensinya.
  if (!mime || (file.type && file.type !== mime)) return { ok: false, problem: 'unsupported_type' };
  if (file.size === 0) return { ok: false, problem: 'empty' };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, problem: 'too_large' };
  return { ok: true, mime, extension: EXTENSION_BY_MIME[mime] };
}
