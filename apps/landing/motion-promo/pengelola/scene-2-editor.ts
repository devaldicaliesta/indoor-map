// Adegan 2: masuk ke monitor Admin. Denah PDF diletakkan, ruang digambar dan terisi warna,
// graf jalur digambar, validasi hijau satu per satu, "Terbitkan" ditekan, "Versi 4" muncul.
import { clamp, easeInOut, easeOut, span } from '../shared/anim';
import { C, paperGrid } from '../shared/draw';
import { iso } from '../shared/iso';
import {
  drawEditor,
  EDITOR_CAM,
  PUBLISH_BUTTON,
  unitCorner,
  VALIDATE_BUTTON,
} from './admin-editor';
import {
  adminScreenRect,
  coverZoom,
  cursor,
  cursorPath,
  inAdminView,
  lerpRect,
  monitorFrame,
  monitorStand,
  toast,
  type ViewKey,
  viewAt,
} from './admin-shell';
import { NAV_NODES, UNITS } from './floor';
import type { SceneModule, Sfx } from './scene';
import { monitorScreen } from './scene-1-resepsionis';

const IN = 0.9;

/** Waktu kunci dalam ketukan sejak awal adegan. */
const K = {
  plan: 1.75,
  polygon: 3,
  unitsFrom: 3.5,
  unitsTo: 8,
  path: 8,
  graphTo: 10.5,
  validate: 11,
  checksTo: 13,
  publish: 14,
};

function keys(beat: number, portrait: boolean): ViewKey[] {
  const b = (n: number) => n * beat;
  if (portrait) {
    return [
      { t: 0, fx: 640, fy: 420, zoom: 2.05 },
      { t: b(2.5), fx: 640, fy: 420, zoom: 2.3 },
      { t: b(8), fx: 740, fy: 420, zoom: 2.3 },
      { t: b(10.5), fx: 740, fy: 420, zoom: 2.3 },
      { t: b(11.3), fx: 1100, fy: 220, zoom: 2.6 },
      { t: b(13.3), fx: 1100, fy: 200, zoom: 2.7 },
      { t: b(15), fx: 1060, fy: 560, zoom: 2.4 },
    ];
  }
  return [
    { t: 0, fx: 640, fy: 400, zoom: 1 },
    { t: b(2.5), fx: 720, fy: 420, zoom: 1.18 },
    { t: b(8), fx: 740, fy: 410, zoom: 1.24 },
    { t: b(10.5), fx: 720, fy: 420, zoom: 1.28 },
    { t: b(11.3), fx: 1000, fy: 260, zoom: 1.45 },
    { t: b(13.3), fx: 1060, fy: 200, zoom: 1.62 },
    { t: b(16), fx: 860, fy: 330, zoom: 1.2 },
  ];
}

function cursorKeys(beat: number) {
  const b = (n: number) => n * beat;
  const units = UNITS.map((_, i) => {
    const [x, y] = unitCorner(i);
    return { t: b(K.unitsFrom) + ((b(K.unitsTo) - b(K.unitsFrom)) * (i + 1)) / UNITS.length, x, y };
  });
  const spine = [0, 9].map((n, i) => {
    const [x, y] = iso(EDITOR_CAM, NAV_NODES[n] ?? [0, 0]);
    return { t: b(K.path + 0.4 + i * 2), x, y };
  });
  return [
    { t: 0, x: 760, y: 560 },
    { t: b(K.polygon - 0.1), x: 174, y: 118 },
    { t: b(K.unitsFrom), x: 174, y: 118 },
    ...units,
    { t: b(K.path - 0.1), x: 174, y: 196 },
    { t: b(K.path + 0.2), x: 174, y: 196 },
    ...spine,
    { t: b(K.validate - 0.1), x: VALIDATE_BUTTON.x + 36, y: VALIDATE_BUTTON.y + 14 },
    { t: b(K.validate + 0.6), x: VALIDATE_BUTTON.x + 36, y: VALIDATE_BUTTON.y + 14 },
    { t: b(K.publish - 0.1), x: PUBLISH_BUTTON.x + 46, y: PUBLISH_BUTTON.y + 14 },
    { t: b(K.publish + 0.6), x: PUBLISH_BUTTON.x + 46, y: PUBLISH_BUTTON.y + 14 },
    { t: b(17), x: 1150, y: 330 },
  ];
}

export const scene2: SceneModule = {
  draw(a) {
    const { ctx, stage, t, beat, copy, assets, layout } = a;
    const b = (n: number) => n * beat;
    const target = adminScreenRect(stage.portrait, layout.visual);
    const enter = easeInOut(span(t, 0, IN));
    if (t < IN) {
      a.drawPrev(a.prevDur + t);
      ctx.fillStyle = C.canvas;
      ctx.globalAlpha = enter;
      ctx.fillRect(0, 0, stage.W, stage.H);
      ctx.globalAlpha = 1;
    } else paperGrid(ctx, stage.W, stage.H, t + a.prevDur);
    const from = monitorScreen(layout, stage.portrait, a.prevDur, a.prevDur);
    const rect = lerpRect(from, target, enter);
    const click = (k: number) => span(t, b(k), b(k) + 0.4);
    const state = {
      planIn: easeOut(span(t, b(K.plan), b(K.plan) + 0.45)),
      tool: t < b(K.polygon) ? 0 : t < b(K.path) ? 1 : t < b(K.validate) ? 4 : 0,
      filled: clamp((t - b(K.unitsFrom)) / (b(K.unitsTo) - b(K.unitsFrom))) * UNITS.length,
      graph: easeInOut(span(t, b(K.path + 0.25), b(K.graphTo))),
      checks:
        t < b(K.validate)
          ? -1
          : clamp((t - b(K.validate + 0.25)) / (b(K.checksTo) - b(K.validate + 0.25))) * 4,
      publishPress: t > b(K.publish) && t < b(K.publish) + 0.18 ? 1 : 0,
      live: t > b(K.publish) + 0.1,
    };
    ctx.save();
    ctx.globalAlpha = easeOut(span(t, 0, 0.3));
    if (!stage.portrait) {
      monitorStand(ctx, rect, enter);
      monitorFrame(ctx, rect, enter);
    }
    const view = viewAt(keys(beat, stage.portrait), t);
    const zoom = Math.max(view.zoom, coverZoom(rect));
    ctx.fillStyle = C.canvas;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    inAdminView(ctx, rect, { ...view, zoom }, () => {
      drawEditor(ctx, copy, state, assets.logo, t);
      toast(ctx, copy.admin.published, easeOut(span(t, b(K.publish) + 0.1, b(K.publish) + 0.45)));
      const [cx, cy] = cursorPath(cursorKeys(beat), t);
      const clicks =
        [K.polygon, K.path, K.validate, K.publish].map(click).find((c) => c > 0 && c < 1) ?? 0;
      if (t > IN * 0.6) cursor(ctx, cx, cy, clicks);
    });
    if (stage.portrait) {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
      ctx.stroke();
    }
    ctx.restore();
  },
  sfx(_dur, beat) {
    const b = (n: number) => n * beat;
    const out: Sfx[] = [
      { t: 0, kind: 'whoosh' },
      { t: b(K.plan), kind: 'pop' },
      { t: b(K.polygon), kind: 'click' },
      { t: b(K.path), kind: 'click' },
      { t: b(K.validate), kind: 'click' },
      { t: b(K.publish), kind: 'click' },
      { t: b(K.publish) + 0.12, kind: 'ding' },
    ];
    UNITS.forEach((_, i) => {
      out.push({
        t: b(K.unitsFrom) + ((b(K.unitsTo) - b(K.unitsFrom)) * (i + 1)) / UNITS.length,
        kind: 'tick',
      });
    });
    for (let i = 0; i < 4; i++) {
      out.push({
        t: b(K.validate + 0.25) + ((b(K.checksTo) - b(K.validate + 0.25)) * (i + 1)) / 4,
        kind: 'tick',
      });
    }
    return out;
  },
};
