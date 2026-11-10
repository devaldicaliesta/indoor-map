// Adegan 4: kembali ke Admin, halaman Penutupan: pilih "Lift A", isi alasan "Perbaikan",
// simpan. Potong ke tiga HP pengunjung: rute di ketiganya memutar bersamaan lewat lift B.
import { backOut, clamp, easeInOut, easeOut, span } from '../shared/anim';
import { C, paperGrid } from '../shared/draw';
import type { Pt } from '../shared/stage';
import {
  CLOSE_BUTTON,
  drawClosures,
  OPTION_LIFT_A,
  SAVE_BUTTON,
  SELECT_BOX,
} from './admin-closures';
import {
  adminScreenRect,
  coverZoom,
  cursor,
  cursorPath,
  inAdminView,
  monitorFrame,
  monitorStand,
  toast,
  type ViewKey,
  viewAt,
} from './admin-shell';
import { ENTRANCE, LIFT_A, LIFT_B } from './floor';
import { drawPhone, type PhoneState, WHOLE_FLOOR } from './phone';
import type { SceneArgs, SceneModule, Sfx } from './scene';

const PUSH = 0.6;
const K = {
  open: 1.5,
  pick: 3,
  close: 3.75,
  typeFrom: 4.6,
  typeTo: 6.2,
  save: 7,
  cut: 8,
  closed: 10,
  redrawn: 11.5,
};

/** Tiga pengunjung dengan titik asal berbeda, semuanya menuju lantai 3. */
const VISITORS: { origin: Pt; a: Pt[]; b: Pt[]; distance: [string, string] }[] = [
  {
    origin: ENTRANCE,
    a: [ENTRANCE, [13.25, 18], LIFT_A],
    b: [ENTRANCE, [49.25, 18], LIFT_B],
    distance: ['56 m', '79 m'],
  },
  {
    origin: [22.25, 15],
    a: [[22.25, 15], [22.25, 18], [13.25, 18], LIFT_A],
    b: [[22.25, 15], [22.25, 18], [49.25, 18], LIFT_B],
    distance: ['48 m', '61 m'],
  },
  {
    origin: [22, 21],
    a: [[22, 21], [22, 18], [13.25, 18], LIFT_A],
    b: [[22, 21], [22, 18], [49.25, 18], LIFT_B],
    distance: ['51 m', '64 m'],
  },
];

function viewKeys(beat: number, portrait: boolean): ViewKey[] {
  const b = (n: number) => n * beat;
  if (portrait) {
    return [
      { t: 0, fx: 420, fy: 300, zoom: 2.3 },
      { t: b(1.4), fx: 400, fy: 260, zoom: 2.6 },
      { t: b(3.6), fx: 420, fy: 260, zoom: 2.6 },
      { t: b(4.5), fx: 640, fy: 380, zoom: 2.4 },
      { t: b(7.1), fx: 640, fy: 380, zoom: 2.4 },
      { t: b(8), fx: 430, fy: 300, zoom: 2.5 },
    ];
  }
  return [
    { t: 0, fx: 640, fy: 400, zoom: 1.05 },
    { t: b(1.4), fx: 430, fy: 220, zoom: 1.5 },
    { t: b(3.6), fx: 430, fy: 220, zoom: 1.5 },
    { t: b(4.5), fx: 640, fy: 380, zoom: 1.45 },
    { t: b(7.1), fx: 640, fy: 380, zoom: 1.45 },
    { t: b(8), fx: 600, fy: 260, zoom: 1.3 },
  ];
}

function cursorKeys(beat: number) {
  const b = (n: number) => n * beat;
  const sel = { x: SELECT_BOX.x + 120, y: SELECT_BOX.y + 16 };
  const opt = { x: OPTION_LIFT_A.x + 60, y: OPTION_LIFT_A.y + 3 };
  const btn = { x: CLOSE_BUTTON.x + 64, y: CLOSE_BUTTON.y + 16 };
  const save = { x: SAVE_BUTTON.x + 70, y: SAVE_BUTTON.y + 16 };
  return [
    { t: 0, x: 900, y: 500 },
    { t: b(K.open - 0.1), ...sel },
    { t: b(K.open + 0.4), ...sel },
    { t: b(K.pick - 0.1), ...opt },
    { t: b(K.pick + 0.2), ...opt },
    { t: b(K.close - 0.1), ...btn },
    { t: b(K.close + 0.3), ...btn },
    { t: b(K.save - 0.1), ...save },
    { t: b(K.save + 1), ...save },
  ];
}

function adminPart(a: SceneArgs) {
  const { ctx, stage, t, beat, copy, assets, layout } = a;
  const b = (n: number) => n * beat;
  const rect = adminScreenRect(stage.portrait, layout.visual);
  const state = {
    pickerOpen:
      t > b(K.open) && t < b(K.pick + 0.4) ? easeOut(span(t, b(K.open), b(K.open) + 0.2)) : 0,
    picked: t > b(K.pick),
    dialog:
      t < b(K.close)
        ? 0
        : t < b(K.save) + 0.2
          ? easeOut(span(t, b(K.close), b(K.close) + 0.3))
          : 1 - span(t, b(K.save) + 0.2, b(K.save) + 0.45),
    typed: clamp((t - b(K.typeFrom)) / (b(K.typeTo) - b(K.typeFrom))) * copy.admin.reason.length,
    savePress: t > b(K.save) && t < b(K.save) + 0.18 ? 1 : 0,
    row: easeOut(span(t, b(K.save) + 0.3, b(K.save) + 0.6)),
    t,
  };
  if (!stage.portrait) {
    monitorStand(ctx, rect);
    monitorFrame(ctx, rect);
  }
  const view = viewAt(viewKeys(beat, stage.portrait), t);
  ctx.fillStyle = C.canvas;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  inAdminView(ctx, rect, { ...view, zoom: Math.max(view.zoom, coverZoom(rect)) }, () => {
    drawClosures(ctx, copy, state, assets.logo);
    toast(ctx, copy.admin.closureSaved, easeOut(span(t, b(K.save) + 0.35, b(K.save) + 0.6)));
    const clicks =
      [K.open, K.pick, K.close, K.save]
        .map((k) => span(t, b(k), b(k) + 0.4))
        .find((c) => c > 0 && c < 1) ?? 0;
    const [cx, cy] = cursorPath(cursorKeys(beat), t);
    cursor(ctx, cx, cy, clicks);
  });
  if (stage.portrait) {
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.stroke();
  }
}

function phoneSlots(a: SceneArgs): { x: number; y: number; w: number; rot: number }[] {
  const v = a.layout.visual;
  if (a.stage.portrait) {
    const side = 290;
    const mid = 372;
    const y = v.y + 40;
    return [
      { x: v.x, y: y + 90, w: side, rot: -0.07 },
      { x: v.x + v.w - side, y: y + 90, w: side, rot: 0.07 },
      { x: v.x + (v.w - mid) / 2, y, w: mid, rot: 0 },
    ];
  }
  const w = 332;
  const gap = (v.w - 3 * w) / 4;
  const y = v.y + (v.h - (w * 844) / 390) / 2;
  return [0, 1, 2].map((i) => ({ x: v.x + gap + i * (w + gap), y, w, rot: 0 }));
}

function phonesPart(a: SceneArgs) {
  const { ctx, t, beat, copy } = a;
  const b = (n: number) => n * beat;
  const closed = easeOut(span(t, b(K.closed), b(K.closed) + 0.25));
  const redraw = easeInOut(span(t, b(K.closed) + 0.25, b(K.redrawn)));
  const slots = phoneSlots(a);
  // Di 9:16 HP tengah (indeks 0) digambar terakhir agar berada di depan.
  const order = a.stage.portrait ? [1, 2, 0] : [0, 1, 2];
  order.forEach((visitorIndex, slotIndex) => {
    const visitor = VISITORS[visitorIndex];
    const slot = slots[a.stage.portrait ? ([2, 0, 1][visitorIndex] ?? 0) : slotIndex];
    if (!visitor || !slot) return;
    const pop = backOut(
      span(t, b(K.cut) + visitorIndex * 0.08, b(K.cut) + visitorIndex * 0.08 + 0.35),
    );
    if (pop <= 0) return;
    const detour = t >= b(K.closed) + 0.25;
    const steps = detour ? copy.visitor.stepsDetour : copy.visitor.steps;
    const state: PhoneState = {
      t,
      scan: 1,
      floor: 1,
      path: detour ? visitor.b : visitor.a,
      progress: detour ? redraw : easeInOut(span(t, b(K.cut) + 0.2, b(K.cut + 1.6))),
      origin: visitor.origin,
      closedA: closed,
      steps,
      stepIcons: ['arrow-up', 'arrow-up-down', detour ? 'corner-up-left' : 'corner-up-right'],
      activeStep: 1,
      distance: visitor.distance[detour ? 1 : 0],
      sheet: 1,
      notice: closed,
      noticeText: copy.visitor.closedNotice,
      view: WHOLE_FLOOR,
      destination: copy.visitor.destinations[visitorIndex] ?? copy.visitor.destination,
    };
    ctx.save();
    const cx = slot.x + slot.w / 2;
    const cy = slot.y + (slot.w * 844) / 390 / 2;
    ctx.translate(cx, cy);
    ctx.rotate(slot.rot);
    ctx.scale(pop, pop);
    ctx.translate(-cx, -cy);
    drawPhone(ctx, copy, state, slot.x, slot.y, slot.w);
    ctx.restore();
  });
}

export const scene4: SceneModule = {
  draw(a) {
    const { ctx, stage, t, beat } = a;
    const b = (n: number) => n * beat;
    paperGrid(ctx, stage.W, stage.H, t);
    const push = easeInOut(span(t, 0, PUSH));
    if (t < PUSH) {
      ctx.save();
      ctx.translate(-stage.W * push, 0);
      a.drawPrev(a.prevDur + t);
      ctx.restore();
    }
    if (t < b(K.cut)) {
      ctx.save();
      ctx.translate(stage.W * (1 - push), 0);
      adminPart(a);
      ctx.restore();
    } else phonesPart(a);
  },
  sfx(_dur, beat) {
    const b = (n: number) => n * beat;
    const out: Sfx[] = [
      { t: 0, kind: 'whoosh' },
      ...[K.open, K.pick, K.close, K.save].map((k) => ({ t: b(k), kind: 'click' as const })),
      { t: b(K.save) + 0.35, kind: 'ding' },
      { t: b(K.cut), kind: 'pop' },
      { t: b(K.closed), kind: 'hit' },
    ];
    for (let i = 0; i < 9; i++)
      out.push({
        t: b(K.typeFrom) + ((b(K.typeTo) - b(K.typeFrom)) * (i + 0.5)) / 9,
        kind: 'type',
      });
    return out;
  },
};
