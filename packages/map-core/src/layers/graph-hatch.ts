import type { Map as MapLibreMap } from 'maplibre-gl';

/** Gambar mentah RGBA (tidak premultiplied) untuk `map.addImage`. */
export interface PixelImage {
  width: number;
  height: number;
  data: Uint8Array;
}

/** Gambar dibuat 2× agar tajam di layar rapat. */
export const HATCH_PIXEL_RATIO = 2;
export const HATCH_IMAGE_IDS = {
  line: 'nav-graph-hatch-line',
  node: 'nav-graph-hatch-node',
} as const;

/** Penutupan: arsir --danger 40% (05-desain-ui.md, tabel warna peta). Nilai ini data gambar. */
const RED = [0xc8, 0x32, 0x1e] as const;
const HATCH_ALPHA = Math.round(0.4 * 255);
/** Jarak dan tebal garis arsir dalam piksel gambar; ukuran ubin harus kelipatan jaraknya. */
const PERIOD = 12;
const THICKNESS = 4;

const onStripe = (x: number, y: number) => (x + y) % PERIOD < THICKNESS;

function put(data: Uint8Array, i: number, rgb: readonly number[], alpha: number) {
  data[i] = rgb[0] ?? 0;
  data[i + 1] = rgb[1] ?? 0;
  data[i + 2] = rgb[2] ?? 0;
  data[i + 3] = alpha;
}

/**
 * Ubin arsir diagonal untuk `line-pattern`: MapLibre menskalakan tinggi ubin ke lebar garis dan
 * mengulangnya sepanjang garis, jadi lebar ubin kelipatan `PERIOD` agar sambungannya tidak terlihat.
 */
export function hatchTile(): PixelImage {
  const size = PERIOD * 2;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (onStripe(x, y)) put(data, (y * size + x) * 4, RED, HATCH_ALPHA);
    }
  }
  return { width: size, height: size, data };
}

/** Arsir merah 40% di atas putih, dicampur lebih dulu agar lingkaran menutup garis di bawahnya. */
const STRIPE_ON_WHITE = RED.map((c) => Math.round(c * 0.4 + 255 * 0.6));

/** Lingkaran berarsir bercincin merah untuk node tertutup; diameter dalam px layar. */
export function hatchDisc(diameter: number): PixelImage {
  const size = diameter * HATCH_PIXEL_RATIO;
  const radius = size / 2;
  const ring = 1.5 * HATCH_PIXEL_RATIO;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - radius, y + 0.5 - radius);
      // Tepi luar dihaluskan satu piksel.
      const coverage = Math.min(1, Math.max(0, radius - d));
      if (coverage === 0) continue;
      const alpha = Math.round(255 * coverage);
      const i = (y * size + x) * 4;
      if (d >= radius - ring) put(data, i, RED, alpha);
      else put(data, i, onStripe(x, y) ? STRIPE_ON_WHITE : [255, 255, 255], alpha);
    }
  }
  return { width: size, height: size, data };
}

export const CLOSED_NODE_DIAMETER = 18;

/** Gambar arsir dibuat sekali per peta, sebelum layer yang memakainya. */
export function ensureHatchImages(map: MapLibreMap): void {
  const options = { pixelRatio: HATCH_PIXEL_RATIO };
  if (!map.hasImage(HATCH_IMAGE_IDS.line)) map.addImage(HATCH_IMAGE_IDS.line, hatchTile(), options);
  if (!map.hasImage(HATCH_IMAGE_IDS.node)) {
    map.addImage(HATCH_IMAGE_IDS.node, hatchDisc(CLOSED_NODE_DIAMETER), options);
  }
}
