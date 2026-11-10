// Teks kinetik: Figtree tebal, maksimal lima kata, kata kunci (`**...**`) diberi blok kuning
// `--signal` dengan teks `--ink` di atasnya (kuning di atas latar terang tidak lolos 4.5:1).
import { easeIn, easeOut, span } from './anim';
import { C, FONT, rrect } from './draw';
import type { Stage } from './stage';

interface Word {
  text: string;
  key: boolean;
}

export function parseHeadline(source: string): Word[] {
  const words: Word[] = [];
  let key = false;
  for (const part of source.split(/(\*\*)/)) {
    if (part === '**') {
      key = !key;
      continue;
    }
    for (const w of part.split(/\s+/).filter(Boolean)) words.push({ text: w, key });
  }
  return words;
}

export interface HeadlineOpts {
  text: string;
  /** Detik sejak teks mulai muncul (boleh negatif). */
  t: number;
  /** Detik saat teks mulai keluar, dihitung dari awal yang sama. */
  exit: number;
  x: number;
  y: number;
  maxWidth: number;
  size: number;
  align?: 'left' | 'center';
  /** Jarak antarkata muncul (setengah ketukan). */
  stagger: number;
  /** Kata pertama yang sudah tampil sejak frame 0 (untuk thumbnail). */
  alreadyIn?: number;
  /** Teks terang di atas latar gelap. */
  dark?: boolean;
}

/** Gambar judul; mengembalikan tinggi blok teks agar adegan bisa menata di bawahnya. */
type Line = { word: Word; index: number; width: number }[];

function wrap(ctx: CanvasRenderingContext2D, words: Word[], size: number, maxWidth: number) {
  ctx.font = `700 ${size}px ${FONT.kinetic}`;
  const space = ctx.measureText(' ').width;
  const lines: Line[] = [[]];
  let lineWidth = 0;
  words.forEach((word, index) => {
    const width = ctx.measureText(word.text).width;
    const current = lines[lines.length - 1] as Line;
    if (current.length && lineWidth + space + width > maxWidth) {
      lines.push([{ word, index, width }]);
      lineWidth = width;
    } else {
      current.push({ word, index, width });
      lineWidth += (current.length > 1 ? space : 0) + width;
    }
  });
  return { lines, space };
}

/** Gambar judul; mengembalikan tinggi blok teks agar adegan bisa menata di bawahnya. */
export function drawHeadline(ctx: CanvasRenderingContext2D, o: HeadlineOpts): number {
  const words = parseHeadline(o.text);
  // Paling banyak dua baris: perkecil huruf sedikit demi sedikit bila perlu.
  let size = o.size;
  let { lines, space } = wrap(ctx, words, size, o.maxWidth);
  while (lines.length > 2 && size > o.size * 0.7) {
    size -= 2;
    ({ lines, space } = wrap(ctx, words, size, o.maxWidth));
  }
  const leading = size * 1.14;
  const out = easeIn(span(o.t, o.exit, o.exit + 0.3));
  const lastKey = words.reduce((last, w, i) => (w.key ? i : last), -1);
  const shownFromStart = (o.alreadyIn ?? 0) >= words.length;
  const highlight = shownFromStart
    ? 1
    : easeOut(span(o.t, (lastKey + 1) * o.stagger, (lastKey + 1) * o.stagger + 0.22));
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, row) => {
    const total = line.reduce((s, w, i) => s + w.width + (i ? space : 0), 0);
    let x = o.align === 'center' ? o.x - total / 2 : o.x;
    const baseline = o.y + size * 0.92 + row * leading;
    for (const [i, { word, index, width }] of line.entries()) {
      const appear =
        index < (o.alreadyIn ?? 0)
          ? 1
          : easeOut(span(o.t, index * o.stagger, index * o.stagger + 0.32));
      const alpha = appear * (1 - out);
      if (alpha > 0) {
        const lift = (1 - appear) * size * 0.4 + out * size * 0.25;
        if (word.key && highlight > 0) {
          // Blok kuning menyambung ke kata kunci berikutnya di baris yang sama.
          const next = line[i + 1];
          const extend = next?.word.key ? space : 0;
          const padX = size * 0.12;
          ctx.globalAlpha = 1 - out;
          rrect(
            ctx,
            x - padX,
            baseline - size * 0.86,
            (width + extend + padX * 2) * highlight,
            size * 1.08,
            4,
            C.signal,
          );
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = o.dark && !word.key ? C.surface : C.ink;
        ctx.font = `700 ${size}px ${FONT.kinetic}`;
        ctx.textAlign = 'left';
        ctx.fillText(word.text, x, baseline + lift);
      }
      x += width + space;
    }
  });
  ctx.restore();
  return lines.length * leading;
}

/** Subtitle dibakar: kotak ink di bawah area aman, tidak menimpa teks kinetik di atas. */
export function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  stage: Stage,
  value: string,
  alpha: number,
) {
  if (alpha <= 0 || !value) return;
  const size = stage.portrait ? 40 : 38;
  ctx.save();
  ctx.font = `700 ${size}px ${FONT.kinetic}`;
  const maxWidth = stage.safe.w - size;
  const words = value.split(' ');
  const rows: string[] = [''];
  for (const w of words) {
    const current = rows[rows.length - 1] as string;
    const next = current ? `${current} ${w}` : w;
    if (current && ctx.measureText(next).width > maxWidth) rows.push(w);
    else rows[rows.length - 1] = next;
  }
  const leading = size * 1.25;
  const height = rows.length * leading + size * 0.6;
  const bottom = stage.safe.y + stage.safe.h - (stage.portrait ? 8 : 20);
  const widest = Math.max(...rows.map((r) => ctx.measureText(r).width));
  const cx = stage.safe.x + stage.safe.w / 2;
  ctx.globalAlpha = alpha;
  rrect(
    ctx,
    cx - widest / 2 - size * 0.5,
    bottom - height,
    widest + size,
    height,
    8,
    'rgba(17,20,24,.88)',
  );
  ctx.fillStyle = C.surface;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  rows.forEach((row, i) => {
    ctx.fillText(row, cx, bottom - height + size * 0.3 + leading * (i + 0.5));
  });
  ctx.restore();
}
