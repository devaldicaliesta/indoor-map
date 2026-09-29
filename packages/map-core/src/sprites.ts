import type { Map as MapLibreMap } from 'maplibre-gl';

/** Sumber gambar ikon: SVG mandiri (piktogram bawaan) atau URL gambar unggahan. */
export type IconSource = { svg: string } | { url: string };

export interface FacilityIconSpec {
  /** Id jenis fasilitas; fitur merujuknya lewat properti `facilityTypeId`. */
  typeId: string;
  isSafety: boolean;
  source: IconSource | null;
}

export const FACILITY_ICON_PREFIX = 'facility-';
export const FACILITY_ICON_FALLBACK = `${FACILITY_ICON_PREFIX}unknown`;
/** Diameter lingkaran ikon di layar (px CSS); gambar dibuat 2× agar tajam di layar rapat. */
export const FACILITY_ICON_SIZE = 28;
const PIXEL_RATIO = 2;
/** Bagian lingkaran yang diisi simbol. */
const GLYPH_RATIO = 0.62;

/**
 * 05-desain-ui.md: latar lingkaran dengan simbol --ink; fasilitas keselamatan berlatar
 * merah (--danger) dengan simbol putih agar tetap kontras. Nilai hex adalah data sprite.
 */
export const FACILITY_ICON_COLORS = {
  normal: { background: '#ffffff', ring: '#111418', glyph: '#111418' },
  safety: { background: '#c8321e', ring: '#ffffff', glyph: '#ffffff' },
} as const;

export const facilityIconId = (typeId: string) => `${FACILITY_ICON_PREFIX}${typeId}`;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Posisi gambar `width`×`height` di tengah kotak persegi `box` tanpa terpotong. */
export function fitContain(width: number, height: number, box: number): Rect {
  const scale = box / Math.max(width, height, 1);
  const w = width * scale;
  const h = height * scale;
  return { x: (box - w) / 2, y: (box - h) / 2, width: w, height: h };
}

/**
 * Gambar yang punya piksel transparan diperlakukan sebagai piktogram: bentuknya dipakai
 * sebagai topeng dan diwarnai sesuai jenis, sehingga ikon unggahan seragam dengan set
 * bawaan. Gambar buram penuh (foto, logo berlatar) ditampilkan apa adanya.
 */
export function isOpaque(rgba: Uint8ClampedArray, threshold = 250): boolean {
  for (let i = 3; i < rgba.length; i += 4) if ((rgba[i] ?? 0) < threshold) return false;
  return true;
}

function iconColors(isSafety: boolean) {
  return isSafety ? FACILITY_ICON_COLORS.safety : FACILITY_ICON_COLORS.normal;
}

function canvas2d(size: number): CanvasRenderingContext2D {
  const element = document.createElement('canvas');
  element.width = size;
  element.height = size;
  const context = element.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D tidak tersedia.');
  return context;
}

function drawBadge(ctx: CanvasRenderingContext2D, size: number, isSafety: boolean) {
  const colors = iconColors(isSafety);
  const ring = 1.5 * PIXEL_RATIO;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - ring / 2, 0, Math.PI * 2);
  ctx.fillStyle = colors.background;
  ctx.fill();
  ctx.lineWidth = ring;
  ctx.strokeStyle = colors.ring;
  ctx.stroke();
}

/** Simbol pengganti untuk jenis tanpa ikon atau ikon yang gagal dimuat: titik di tengah. */
function drawPlaceholderGlyph(ctx: CanvasRenderingContext2D, size: number, isSafety: boolean) {
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = iconColors(isSafety).glyph;
  ctx.fill();
}

function loadImage(source: IconSource): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // URL unggahan dari Storage butuh CORS agar piksel bisa dibaca untuk topeng.
    if ('url' in source) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Ikon tidak dapat dimuat.'));
    image.src =
      'svg' in source
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source.svg)}`
        : source.url;
  });
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  size: number,
  image: CanvasImageSource & { naturalWidth: number; naturalHeight: number },
  isSafety: boolean,
) {
  const box = Math.round(size * GLYPH_RATIO);
  const glyph = canvas2d(box);
  const rect = fitContain(image.naturalWidth || box, image.naturalHeight || box, box);
  glyph.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  const pixels = glyph.getImageData(
    Math.floor(rect.x),
    Math.floor(rect.y),
    Math.max(1, Math.floor(rect.width)),
    Math.max(1, Math.floor(rect.height)),
  );
  if (!isOpaque(pixels.data)) {
    glyph.globalCompositeOperation = 'source-in';
    glyph.fillStyle = iconColors(isSafety).glyph;
    glyph.fillRect(0, 0, box, box);
  }
  const offset = (size - box) / 2;
  ctx.drawImage(glyph.canvas, offset, offset);
}

/** Satu ikon fasilitas sebagai bitmap; tidak pernah gagal (jatuh ke simbol pengganti). */
export async function renderFacilityIcon(
  source: IconSource | null,
  isSafety: boolean,
): Promise<ImageData> {
  const size = FACILITY_ICON_SIZE * PIXEL_RATIO;
  const ctx = canvas2d(size);
  drawBadge(ctx, size, isSafety);
  const image = source ? await loadImage(source).catch(() => null) : null;
  try {
    if (image) drawGlyph(ctx, size, image, isSafety);
    else drawPlaceholderGlyph(ctx, size, isSafety);
  } catch {
    // Kanvas tercemar (CORS) atau gambar rusak: tetap tampilkan lingkaran dengan titik.
    ctx.clearRect(0, 0, size, size);
    drawBadge(ctx, size, isSafety);
    drawPlaceholderGlyph(ctx, size, isSafety);
  }
  return ctx.getImageData(0, 0, size, size);
}

/** Bitmap pengganti tanpa memuat gambar apa pun. */
function renderPlaceholderIcon(): ImageData {
  const size = FACILITY_ICON_SIZE * PIXEL_RATIO;
  const ctx = canvas2d(size);
  drawBadge(ctx, size, false);
  drawPlaceholderGlyph(ctx, size, false);
  return ctx.getImageData(0, 0, size, size);
}

/**
 * Jenis fasilitas yang ikonnya belum dimuat (atau tidak ada) tampil sebagai lingkaran
 * pengganti, bukan menghilang; `setFacilityIcons` menggantinya saat ikon siap.
 */
export function handleMissingFacilityIcons(map: MapLibreMap): void {
  map.setMissingStyleImageResolver((id) => {
    if (!id.startsWith(FACILITY_ICON_PREFIX) || map.hasImage(id)) return;
    map.addImage(id, renderPlaceholderIcon(), { pixelRatio: PIXEL_RATIO });
  });
}

const versions = new WeakMap<MapLibreMap, number>();

/**
 * Membangun sprite ikon fasilitas saat memuat (tanpa berkas sprite dari server):
 * setiap jenis menjadi gambar `facility-<id>`. Pemanggilan yang lebih baru menang bila
 * dua pemuatan tumpang tindih; gambar jenis yang sudah tidak ada dilepas.
 */
export async function setFacilityIcons(
  map: MapLibreMap,
  specs: readonly FacilityIconSpec[],
): Promise<void> {
  const version = (versions.get(map) ?? 0) + 1;
  versions.set(map, version);
  const images = await Promise.all(specs.map((s) => renderFacilityIcon(s.source, s.isSafety)));
  if (versions.get(map) !== version) return;
  const wanted = new Set<string>();
  specs.forEach((spec, i) => {
    const id = facilityIconId(spec.typeId);
    const image = images[i] as ImageData;
    wanted.add(id);
    if (map.hasImage(id)) map.updateImage(id, image);
    else map.addImage(id, image, { pixelRatio: PIXEL_RATIO });
  });
  for (const id of map.listImages()) {
    if (id.startsWith(FACILITY_ICON_PREFIX) && id !== FACILITY_ICON_FALLBACK && !wanted.has(id))
      map.removeImage(id);
  }
}
