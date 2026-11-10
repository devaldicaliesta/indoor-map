// Adegan 3: kamera keluar dari monitor ke gedung 3D. Stiker QR muncul di setiap lantai di
// ketukan, seorang pengunjung memindai QR di lobi L1, HP-nya menampilkan rute biru antar lantai.
import { backOut, clamp, easeInOut, easeOut, lerp, span } from '../shared/anim';
import { paperGrid } from '../shared/draw';
import { along, iso, pathLength } from '../shared/iso';
import type { Pt } from '../shared/stage';
import {
  buildingCam,
  buildingMarkers,
  buildingRoute,
  drawBuilding,
  floorZ,
  walker,
} from './building';
import { ENTRANCE, ROUTE_L1_A, ROUTE_L3_A } from './floor';
import { drawPhone, type MapView, PHONE_W, type PhoneState } from './phone';
import type { SceneArgs, SceneModule, Sfx } from './scene';

const OUT = 0.9;
/** Ketukan kunci sejak awal adegan. */
const K = { qr: [3, 4, 5], arrive: 5.5, scan: 6, scanned: 8, l1: 10, lift: 10.6, l3: 12.6 };

export function phoneLayout(a: Pick<SceneArgs, 'stage' | 'layout'>) {
  const v = a.layout.visual;
  if (a.stage.portrait) {
    const w = 340;
    return { x: v.x + v.w - w - 6, y: v.y + v.h - (w * 844) / PHONE_W - 6, w };
  }
  const w = 360;
  return { x: v.x + v.w - w - 12, y: v.y + (v.h - (w * 844) / PHONE_W) / 2, w };
}

export function sceneBuildingCam(a: Pick<SceneArgs, 'stage' | 'layout'>, t: number) {
  const v = a.layout.visual;
  const portrait = a.stage.portrait;
  const center: Pt = portrait
    ? [v.x + v.w * 0.48, v.y + v.h * 0.33]
    : [v.x + 264, v.y + v.h * 0.56];
  const scale = (portrait ? 12 : 11.6) * (1 + 0.04 * easeInOut(t / 9));
  return buildingCam(center, scale, -30 + 5 * easeInOut(t / 9));
}

const VIEW_L1: MapView = { ox: 11, oy: 20, scale: 10.5 };
const VIEW_L3: MapView = { ox: 26, oy: 15, scale: 8.6 };
function mapView(p: number): MapView {
  return {
    ox: lerp(VIEW_L1.ox, VIEW_L3.ox, p),
    oy: lerp(VIEW_L1.oy, VIEW_L3.oy, p),
    scale: lerp(VIEW_L1.scale, VIEW_L3.scale, p),
  };
}

/** Rute L1 → L3 dalam satu angka 0..3 dari waktu. */
function routeProgress(t: number, beat: number) {
  const b = (n: number) => n * beat;
  return (
    easeInOut(span(t, b(K.scanned), b(K.l1))) +
    easeInOut(span(t, b(K.l1), b(K.lift))) +
    easeInOut(span(t, b(K.lift), b(K.l3)))
  );
}

export const scene3: SceneModule = {
  draw(a) {
    const { ctx, stage, t, beat, copy, assets } = a;
    const b = (n: number) => n * beat;
    paperGrid(ctx, stage.W, stage.H, t);
    const cam = sceneBuildingCam(a, t);
    const progress = routeProgress(t, beat);
    const active = progress >= 1.6 ? 3 : 1;
    drawBuilding(ctx, cam, { rise: t - 0.15, stagger: beat * 0.7, active });
    const size = cam.scale;
    buildingRoute(ctx, cam, ROUTE_L1_A, ROUTE_L3_A, progress, t, Math.max(4, size * 0.55));
    buildingMarkers(ctx, cam, {
      t,
      qr: K.qr.map((k) => backOut(span(t, b(k), b(k) + 0.35))),
      origin: easeOut(span(t, b(K.scanned), b(K.scanned) + 0.3)),
      destination: progress >= 2.95 ? 1 : 0,
      size,
    });
    // Pengunjung: masuk lobi, memindai, lalu mengikuti rute ke lantai 3.
    const crowd = assets.crowd;
    const spriteSize = size / 9;
    const entry: Pt = [ENTRANCE[0] - 7, ENTRANCE[1]];
    if (progress < 1) {
      const walkIn = easeOut(span(t, b(1), b(K.arrive)));
      const scanned = progress > 0;
      const pos: Pt = scanned
        ? along(ROUTE_L1_A, pathLength(ROUTE_L1_A) * progress).at
        : [lerp(entry[0], ENTRANCE[0], walkIn), ENTRANCE[1]];
      walker(ctx, crowd, cam, pos, 1, {
        t,
        walking: walkIn < 1 || scanned,
        facing: 'right',
        size: spriteSize,
      });
    } else if (progress >= 2) {
      const p = clamp(progress - 2);
      const pos = along(ROUTE_L3_A, pathLength(ROUTE_L3_A) * p).at;
      walker(ctx, crowd, cam, pos, 3, { t, walking: p < 1, facing: 'right', size: spriteSize });
    }
    // HP: muncul dari tangan pengunjung lalu menetap di sisi kanan/bawah.
    const phone = phoneLayout(a);
    const grow = easeInOut(span(t, b(K.scan), b(K.scan) + 0.55));
    if (grow > 0) {
      const [hx, hy] = iso(cam, ENTRANCE, floorZ(1) + 1.5);
      const w = lerp(24, phone.w, grow);
      const x = lerp(hx, phone.x, grow);
      const y = lerp(hy - w, phone.y, grow);
      const steps = copy.visitor.steps;
      const state: PhoneState = {
        t,
        scan: easeInOut(span(t, b(K.scan + 0.6), b(K.scanned))),
        floor: active === 3 ? 3 : 1,
        path: active === 3 ? ROUTE_L3_A : ROUTE_L1_A,
        progress: active === 3 ? clamp(progress - 2) : clamp(progress),
        origin: ENTRANCE,
        closedA: 0,
        steps,
        stepIcons: ['arrow-up', 'arrow-up-down', 'corner-up-right'],
        activeStep: progress < 0.95 ? 0 : progress < 2.2 ? 1 : 2,
        distance: '56 m',
        sheet: easeOut(span(t, b(K.scanned), b(K.scanned) + 0.45)),
        notice: 0,
        noticeText: '',
        view: mapView(easeInOut(span(progress, 1.2, 2.2))),
      };
      drawPhone(ctx, copy, state, x, y, w);
    }
    // Transisi masuk: layar Admin mengecil dan memudar, gedung tampak di belakangnya.
    if (t < OUT) {
      const p = easeInOut(span(t, 0, OUT));
      ctx.save();
      ctx.globalAlpha = 1 - p;
      const k = lerp(1, 0.35, p);
      const [cx, cy] = iso(cam, [30, 18], floorZ(2));
      ctx.translate(lerp(stage.W / 2, cx, p), lerp(stage.H / 2, cy, p));
      ctx.scale(k, k);
      ctx.translate(-stage.W / 2, -stage.H / 2);
      ctx.beginPath();
      ctx.roundRect(0, 0, stage.W, stage.H, 24 / k);
      ctx.clip();
      a.drawPrev(a.prevDur + t);
      ctx.restore();
    }
  },
  sfx(_dur, beat) {
    const b = (n: number) => n * beat;
    const out: Sfx[] = [
      { t: 0, kind: 'whoosh' },
      ...K.qr.map((k) => ({ t: b(k), kind: 'pop' as const })),
    ];
    out.push(
      { t: b(K.scan), kind: 'whoosh' },
      { t: b(K.scanned), kind: 'ding' },
      { t: b(K.lift), kind: 'tick' },
    );
    return out;
  },
};
