// Kanvas video promosi: ukuran, bahasa, dan area aman dibaca dari alamat halaman
// (`?size=1080x1920&lang=en&subs`), sehingga satu halaman melayani semua rasio.
import './fonts.css';

export type Lang = 'id' | 'en';
export type Pt = [number, number];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Stage {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  portrait: boolean;
  lang: Lang;
  /** Subtitle dibakar ke gambar (`--burn-subs`). */
  subs: boolean;
  /** Semua teks penting berada di dalam area ini. */
  safe: Rect;
}

export const SIZES = ['1920x1080', '1080x1920'] as const;

export function createStage(): Stage {
  const params = new URLSearchParams(location.search);
  const size = params.get('size') ?? SIZES[0];
  const [W = 1920, H = 1080] = size.split('x').map(Number);
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  canvas.width = W;
  canvas.height = H;
  document.documentElement.style.width = `${W}px`;
  document.documentElement.style.height = `${H}px`;
  const portrait = H > W;
  // 9:16: kosongkan 8% atas, 18% bawah, dan 12% kanan untuk tombol dan teks platform.
  const safe: Rect = portrait
    ? { x: 0.05 * W, y: 0.08 * H, w: W * (1 - 0.05 - 0.12), h: H * (1 - 0.08 - 0.18) }
    : { x: 0.05 * W, y: 0.06 * H, w: 0.9 * W, h: 0.88 * H };
  return {
    ctx: canvas.getContext('2d') as CanvasRenderingContext2D,
    W,
    H,
    portrait,
    lang: params.get('lang') === 'en' ? 'en' : 'id',
    subs: params.has('subs'),
    safe,
  };
}

/** Font yang harus selesai dimuat sebelum frame pertama direkam. */
export async function loadFonts(): Promise<void> {
  await Promise.all(
    [
      '700 40px "Figtree"',
      '400 40px "Figtree"',
      '400 14px "IBM Plex Sans"',
      '700 14px "IBM Plex Sans"',
      '400 13px "IBM Plex Mono"',
      '700 13px "IBM Plex Mono"',
      '400 16px "Atkinson Hyperlegible"',
      '700 16px "Atkinson Hyperlegible"',
    ].map((font) => document.fonts.load(font)),
  );
}

export async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}
