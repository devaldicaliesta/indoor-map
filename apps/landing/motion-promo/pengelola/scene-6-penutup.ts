// Adegan 6: deretan jenis gedung muncul di ketukan lalu menyatu ke logo PanduArah, garis rute
// biru di bawahnya, tombol kuning "Coba gratis 17 hari", dan alamat situs. Ditahan sampai akhir.
import { backOut, easeIn, easeInOut, easeOut, lerp, span } from '../shared/anim';
import { C, FONT, floating, icon, noShadow, paperGrid, rrect, text } from '../shared/draw';
import type { IconName } from '../shared/icon-paths';
import type { Pt } from '../shared/stage';
import { strokeRoute } from './plan';
import type { SceneArgs, SceneModule, Sfx } from './scene';

const IN = 0.7;
const ICONS: IconName[] = [
  'hospital',
  'graduation-cap',
  'building-complex',
  'plane',
  'factory',
  'shopping-bag',
];
const K = { tiles: 0.25, step: 0.25 };

/** Logo tepat saat dubber menyebut "PanduArah", tombol saat ajakan coba gratis dimulai. */
function moments(beat: number, cue: SceneArgs['cue']) {
  const start = cue?.start ?? beat * 4;
  const end = cue?.end ?? start + 3;
  const cta = start + (end - start) * 0.27;
  return { merge: start - 0.5, logo: start, cta, url: cta + 0.5 };
}

function tileSlots(a: SceneArgs): { x: number; y: number; w: number }[] {
  const { safe } = a.stage;
  if (a.stage.portrait) {
    const w = 272;
    const gap = (safe.w - 3 * w) / 2;
    return ICONS.map((_, i) => ({
      x: safe.x + (i % 3) * (w + gap),
      y: safe.y + 380 + Math.floor(i / 3) * (w * 0.92 + 26),
      w,
    }));
  }
  const w = 238;
  const gap = (safe.w - 6 * w) / 5;
  return ICONS.map((_, i) => ({ x: safe.x + i * (w + gap), y: safe.y + 300, w }));
}

function logoCenter(a: SceneArgs): Pt {
  const { safe } = a.stage;
  return [safe.x + safe.w / 2, safe.y + safe.h * (a.stage.portrait ? 0.4 : 0.36)];
}

export const scene6: SceneModule = {
  draw(a) {
    const { ctx, stage, t, beat, copy, assets } = a;
    const b = (n: number) => n * beat;
    paperGrid(ctx, stage.W, stage.H, t);
    const [lx, ly] = logoCenter(a);
    const m = moments(beat, a.cue);
    const merge = easeInOut(span(t, m.merge, m.merge + 0.5));
    tileSlots(a).forEach((slot, i) => {
      const pop = backOut(span(t, b(K.tiles + i * K.step), b(K.tiles + i * K.step) + 0.35));
      if (pop <= 0 || merge >= 1) return;
      const h = slot.w * 0.92;
      const cx = lerp(slot.x + slot.w / 2, lx, merge);
      const cy = lerp(slot.y + h / 2, ly, merge);
      const k = pop * lerp(1, 0.2, merge);
      ctx.save();
      ctx.globalAlpha = 1 - easeIn(span(merge, 0.55, 1));
      ctx.translate(cx, cy);
      ctx.scale(k, k);
      floating(ctx);
      rrect(ctx, -slot.w / 2, -h / 2, slot.w, h, 8, C.surface);
      noShadow(ctx);
      ctx.fillStyle = i % 2 ? C.signalSoft : '#dce7fb';
      ctx.beginPath();
      ctx.arc(0, -h * 0.13, slot.w * 0.2, 0, Math.PI * 2);
      ctx.fill();
      icon(ctx, ICONS[i] ?? 'building', 0, -h * 0.13, slot.w * 0.22, C.ink, 2);
      text(ctx, copy.buildingTypes[i] ?? '', 0, h * 0.3, {
        size: slot.w * 0.13,
        weight: 700,
        family: FONT.kinetic,
        align: 'center',
      });
      ctx.restore();
    });
    const logo = backOut(span(t, m.logo - 0.12, m.logo + 0.33));
    const logoW = stage.portrait ? 720 : 760;
    if (logo > 0) {
      const w = logoW * logo;
      const h = (w * 404) / 1538;
      ctx.drawImage(assets.logo, lx - w / 2, ly - h / 2, w, h);
      ctx.save();
      ctx.globalAlpha = Math.min(1, logo);
      text(ctx, 'Indoor Navigation', lx, ly + logoW * 0.19, {
        size: stage.portrait ? 40 : 38,
        family: FONT.kinetic,
        color: C.muted,
        align: 'center',
      });
      ctx.restore();
      // Garis rute biru mengalir di bawah logo, satu-satunya gerak saat kartu ditahan.
      const draw = easeOut(span(t, m.logo + 0.2, m.logo + 1));
      const y = ly + logoW * 0.27;
      const x0 = lx - logoW * 0.42;
      const x1 = lerp(x0, lx + logoW * 0.42, draw);
      strokeRoute(
        ctx,
        [
          [x0, y],
          [x1, y],
        ],
        8,
        t,
      );
      ctx.fillStyle = C.signal;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x0, y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    const cta = backOut(span(t, m.cta, m.cta + 0.4));
    if (cta > 0) {
      const size = stage.portrait ? 46 : 42;
      ctx.font = `700 ${size}px ${FONT.kinetic}`;
      const w = ctx.measureText(copy.cta).width + size * 2.2;
      const h = size * 2;
      const y = ly + logoW * (stage.portrait ? 0.48 : 0.44);
      ctx.save();
      ctx.translate(lx, y);
      ctx.scale(cta, cta);
      floating(ctx, 1.5);
      rrect(ctx, -w / 2, -h / 2, w, h, 4, C.signal);
      noShadow(ctx);
      text(ctx, copy.cta, 0, 2, { size, weight: 700, family: FONT.kinetic, align: 'center' });
      ctx.restore();
      const url = easeOut(span(t, m.url, m.url + 0.3));
      ctx.save();
      ctx.globalAlpha = url;
      text(ctx, copy.url, lx, y + h / 2 + size * 1.3 + (1 - url) * 12, {
        size: stage.portrait ? 38 : 34,
        weight: 700,
        family: FONT.kinetic,
        align: 'center',
      });
      ctx.restore();
    }
    if (t < IN) {
      const p = easeInOut(span(t, 0, IN));
      ctx.save();
      ctx.globalAlpha = 1 - p;
      const k = lerp(1, 0.8, p);
      ctx.translate(stage.W / 2, stage.H / 2);
      ctx.scale(k, k);
      ctx.translate(-stage.W / 2, -stage.H / 2);
      a.drawPrev(a.prevDur + t);
      ctx.restore();
    }
  },
  sfx(_dur, beat, cue) {
    const b = (n: number) => n * beat;
    const m = moments(beat, cue);
    const out: Sfx[] = ICONS.map((_, i) => ({ t: b(K.tiles + i * K.step), kind: 'pop' as const }));
    out.push(
      { t: m.merge, kind: 'whoosh' },
      { t: m.logo, kind: 'hit' },
      { t: m.cta, kind: 'ding' },
    );
    return out;
  },
};
