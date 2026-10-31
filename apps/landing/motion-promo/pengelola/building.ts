// Gedung 3D tiga lantai (L1–L3) dari denah yang sama, lantai renggang agar rute antar-lantai
// terlihat. Lantai yang tidak aktif digambar pudar, seperti Visitor yang hanya menonjolkan
// lantai aktif.
import { easeOut, span } from '../shared/anim';
import type { Crowd } from '../shared/crowd';
import { type IsoCam, iso } from '../shared/iso';
import type { Pt } from '../shared/stage';
import { ENTRANCE, FLOOR_D, FLOOR_W } from './floor';
import { destinationMark, drawPlan, drawRoute, qrSticker, youAreHere } from './plan';

export const FLOOR_GAP = 9;
export const FLOORS = [1, 2, 3] as const;
export const floorZ = (floor: number) => (floor - 1) * FLOOR_GAP;

export function buildingCam(center: Pt, scale: number, angle = -30): IsoCam {
  // Pusat dunia di tengah lantai 2 agar gedung seimbang di layar.
  const cam: IsoCam = { cx: 0, cy: 0, scale, angle, tilt: 1, ox: FLOOR_W / 2, oy: FLOOR_D / 2 };
  const [mx, my] = iso(cam, [FLOOR_W / 2, FLOOR_D / 2], floorZ(2));
  return { ...cam, cx: center[0] - mx, cy: center[1] - my };
}

export interface BuildingOpts {
  /** Detik sejak lantai mulai naik; lantai k muncul `k × stagger` kemudian. */
  rise: number;
  stagger: number;
  active: number;
  closedA?: number;
}

export function drawBuilding(ctx: CanvasRenderingContext2D, cam: IsoCam, o: BuildingOpts) {
  for (const floor of FLOORS) {
    const p = easeOut(span(o.rise, (floor - 1) * o.stagger, (floor - 1) * o.stagger + 0.5));
    if (p <= 0) continue;
    ctx.save();
    ctx.globalAlpha *= p;
    drawPlan(ctx, cam, {
      z: floorZ(floor) - (1 - p) * 4,
      unitH: 2.6,
      ghost: floor === o.active ? 0 : 1,
      closedA: o.closedA ?? 0,
    });
    ctx.restore();
  }
}

/** Rute L1 → lift → L3 pada gedung 3D; `progress` 0..3 (L1, naik lift, L3). */
export function buildingRoute(
  ctx: CanvasRenderingContext2D,
  cam: IsoCam,
  l1: readonly Pt[],
  l3: readonly Pt[],
  progress: number,
  t: number,
  width: number,
) {
  const lift = l1[l1.length - 1] as Pt;
  drawRoute(ctx, cam, l1, { z: floorZ(1), progress: Math.min(1, progress), t, width });
  if (progress > 1) {
    drawRoute(ctx, cam, [lift, lift], {
      z: floorZ(1),
      zEnd: floorZ(1) + (floorZ(3) - floorZ(1)) * Math.min(1, progress - 1),
      t,
      width,
    });
  }
  if (progress > 2)
    drawRoute(ctx, cam, l3, { z: floorZ(3), progress: Math.min(1, progress - 2), t, width });
}

export function buildingMarkers(
  ctx: CanvasRenderingContext2D,
  cam: IsoCam,
  o: { t: number; qr: number[]; origin: number; destination: number; size: number },
) {
  FLOORS.forEach((floor, i) => {
    qrSticker(
      ctx,
      iso(cam, [ENTRANCE[0] + 1.5, ENTRANCE[1] - 3], floorZ(floor)),
      o.size * 1.6,
      o.qr[i] ?? 0,
    );
  });
  youAreHere(ctx, iso(cam, ENTRANCE, floorZ(1) + 0.1), o.size * 0.55, o.t, o.origin);
  destinationMark(ctx, iso(cam, [37.75, 10], floorZ(3) + 0.1), o.size * 0.55, o.destination);
}

/** Orang mini mengikuti rute (meter dari awal) di lantai tertentu. */
export function walker(
  ctx: CanvasRenderingContext2D,
  crowd: Crowd,
  cam: IsoCam,
  at: Pt,
  floor: number,
  o: { t: number; walking: boolean; facing: 'left' | 'right'; size: number },
) {
  const [x, y] = iso(cam, at, floorZ(floor));
  crowd.draw(ctx, 2, x, y, o);
}
