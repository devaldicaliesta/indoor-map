// Kontrak adegan dan tata letak per rasio. 16:9: teks kinetik di kolom kiri, visual di kanan.
// 9:16: teks di atas (di bawah 8% area aman atas), visual di bawahnya, 18% bawah dan 12% kanan
// dikosongkan.
import type { Crowd } from '../shared/crowd';
import type { Rect, Stage } from '../shared/stage';
import type { Copy } from './copy';

export interface Assets {
  crowd: Crowd;
  logo: HTMLImageElement;
}

export interface SceneArgs {
  stage: Stage;
  ctx: CanvasRenderingContext2D;
  /** Detik sejak adegan mulai; bisa melewati `dur` saat adegan berikutnya masuk. */
  t: number;
  dur: number;
  beat: number;
  copy: Copy;
  assets: Assets;
  layout: Layout;
  /** Gambar adegan sebelumnya pada detik lokalnya sendiri (untuk transisi masuk). */
  drawPrev: (t: number) => void;
  /** Lama adegan sebelumnya. */
  prevDur: number;
  /** Kalimat dubber adegan ini (detik lokal). */
  cue: { start: number; end: number } | null;
}

export interface Sfx {
  t: number;
  kind: 'click' | 'pop' | 'type' | 'whoosh' | 'ding' | 'hit' | 'tick';
}

export interface SceneModule {
  draw(a: SceneArgs): void;
  /** Efek suara pada detik lokal adegan (untuk dicampur ke musik). */
  sfx?(dur: number, beat: number, cue: { start: number; end: number } | null): Sfx[];
}

export interface Layout {
  text: { x: number; y: number; w: number; size: number; align: 'left' | 'center' };
  visual: Rect;
}

export function layoutFor(stage: Stage): Layout {
  const { safe } = stage;
  if (stage.portrait) {
    const top = safe.y + 30;
    const bottom = safe.y + safe.h - (stage.subs ? 150 : 10);
    return {
      text: { x: safe.x, y: top, w: safe.w, size: 96, align: 'left' },
      visual: { x: safe.x, y: top + 250, w: safe.w, h: bottom - top - 250 },
    };
  }
  const bottom = safe.y + safe.h - (stage.subs ? 110 : 0);
  return {
    text: { x: safe.x, y: safe.y + 90, w: 600, size: 74, align: 'left' },
    visual: { x: safe.x + 640, y: safe.y, w: safe.w - 640, h: bottom - safe.y },
  };
}

/** Persegi terbesar beraspek `ratio` (lebar/tinggi) di tengah `r`. */
export function fit(r: Rect, ratio: number, scale = 1): Rect {
  let w = r.w * scale;
  let h = w / ratio;
  if (h > r.h * scale) {
    h = r.h * scale;
    w = h * ratio;
  }
  return { x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2, w, h };
}
