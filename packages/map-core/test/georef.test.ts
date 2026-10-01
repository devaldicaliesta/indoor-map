import { describe, expect, it } from 'vitest';
import {
  type Corners,
  calibratePlacement,
  carryPoint,
  distanceM,
  dragCorner,
  initialPlacement,
  type LngLat,
  MIN_PLAN_SIDE_M,
  movePlacement,
  normalizeDeg,
  type Placement,
  placementCorners,
  placementFromCorners,
  rotatePlacement,
  scalePlacement,
  toLocal,
} from '../src/georef';

const JAKARTA: LngLat = [106.8272, -6.1754];
const base: Placement = { center: JAKARTA, widthM: 80, heightM: 50, rotationDeg: 0 };

const close = (a: LngLat, b: LngLat, toleranceM = 0.001) =>
  expect(distanceM(a, b)).toBeLessThan(toleranceM);

describe('distanceM', () => {
  it('satu derajat lintang ≈ 111,2 km', () => {
    expect(distanceM([0, 0], [0, 1]) / 1000).toBeCloseTo(111.195, 2);
  });

  it('proyeksi lokal sepakat dengan haversine hingga < 0,01% pada skala gedung', () => {
    const b: LngLat = [JAKARTA[0] + 0.004, JAKARTA[1] + 0.003];
    const [x, y] = toLocal(JAKARTA, b);
    expect(Math.abs(Math.hypot(x, y) / distanceM(JAKARTA, b) - 1)).toBeLessThan(1e-4);
  });
});

describe('placementCorners', () => {
  it('rotasi 0: sisi atas menghadap utara, ukuran sesuai meter', () => {
    const [tl, tr, br, bl] = placementCorners(base);
    expect(distanceM(tl, tr)).toBeCloseTo(80, 3);
    expect(distanceM(tl, bl)).toBeCloseTo(50, 3);
    expect(tl[1]).toBeGreaterThan(bl[1]);
    expect(tr[0]).toBeGreaterThan(tl[0]);
    expect(br[1]).toBeCloseTo(bl[1], 9);
  });

  it('rotasi 90°: sisi atas gambar menghadap timur', () => {
    const [tl, tr] = placementCorners({ ...base, rotationDeg: 90 });
    const [dx, dy] = toLocal(tl, tr);
    expect(dx).toBeCloseTo(0, 6);
    expect(dy).toBeCloseTo(-80, 3);
  });

  it('pulang-pergi lewat sudut tersimpan', () => {
    for (const rotationDeg of [0, 17.5, -120, 180]) {
      const p = { ...base, rotationDeg };
      const back = placementFromCorners(placementCorners(p));
      close(back.center, p.center);
      expect(back.widthM).toBeCloseTo(80, 4);
      expect(back.heightM).toBeCloseTo(50, 4);
      expect(back.rotationDeg).toBeCloseTo(rotationDeg, 6);
    }
  });
});

describe('dragCorner', () => {
  it('sudut seberang tetap; sudut yang ditarik tepat di pointer (proporsi bebas)', () => {
    const p = { ...base, rotationDeg: 30 };
    const corners = placementCorners(p);
    const target: LngLat = [corners[1][0] + 0.0001, corners[1][1] + 0.00005];
    const next = dragCorner(p, 1, target, false);
    const after = placementCorners(next);
    close(after[3], corners[3]);
    close(after[1], target);
    expect(next.rotationDeg).toBe(30);
  });

  it('kunci proporsi menjaga rasio lebar/tinggi', () => {
    const corners = placementCorners(base);
    const next = dragCorner(base, 2, [corners[2][0] + 0.0002, corners[2][1] - 0.00001], true);
    expect(next.widthM / next.heightM).toBeCloseTo(80 / 50, 9);
    expect(next.widthM).toBeGreaterThan(80);
    close(placementCorners(next)[0], corners[0]);
  });

  it('tidak bisa dibalik melewati sudut seberang', () => {
    const corners = placementCorners(base);
    const next = dragCorner(base, 0, corners[2], false);
    expect(next.widthM).toBe(MIN_PLAN_SIDE_M);
    expect(next.heightM).toBe(MIN_PLAN_SIDE_M);
  });
});

describe('geser, skala, rotasi', () => {
  it('geser mengikuti pointer', () => {
    const to: LngLat = [JAKARTA[0] + 0.001, JAKARTA[1]];
    close(movePlacement(base, JAKARTA, to).center, to);
  });

  it('skala terhadap titik jangkar menjaga titik itu', () => {
    const anchor = placementCorners(base)[0];
    const next = scalePlacement(base, 2, anchor);
    close(placementCorners(next)[0], anchor);
    expect(next.widthM).toBe(160);
    expect(scalePlacement(base, 0)).toBe(base);
  });

  it('rotasi dinormalkan ke (−180, 180]', () => {
    expect(rotatePlacement(base, 370).rotationDeg).toBeCloseTo(10);
    expect(normalizeDeg(-180)).toBe(180);
    expect(normalizeDeg(-190)).toBeCloseTo(170);
  });

  it('titik di gambar ikut berpindah bersama denah', () => {
    const tl = placementCorners(base)[0];
    const after = { ...scalePlacement(base, 1.5), rotationDeg: 40 };
    close(carryPoint(base, after, tl), placementCorners(after)[0]);
  });
});

describe('calibratePlacement', () => {
  it('setelah kalibrasi, jarak dua titik sama dengan ukuran nyata (selisih ≪ 2%)', () => {
    // Denah terlalu kecil 17%: dua titik di tepi atas yang seharusnya 96 m.
    const p = { ...base, rotationDeg: 23 };
    const [tl, tr] = placementCorners(p);
    const { placement, a, b } = calibratePlacement(p, tl, tr, 96);
    expect(Math.abs(distanceM(a, b) / 96 - 1)).toBeLessThan(0.001);
    close(a, tl);
    // Titik kedua tetap di sudut kanan-atas gambar yang sama.
    close(b, placementCorners(placement)[1]);
    expect(placement.widthM).toBeCloseTo(96, 2);
    expect(placement.heightM).toBeCloseTo(60, 2);
  });

  it('masukan tidak valid tidak mengubah apa pun', () => {
    expect(calibratePlacement(base, JAKARTA, JAKARTA, 10).placement).toBe(base);
    const [tl, tr] = placementCorners(base);
    expect(calibratePlacement(base, tl, tr, 0).placement).toBe(base);
  });
});

describe('initialPlacement', () => {
  it('tinggi mengikuti rasio gambar', () => {
    const p = initialPlacement(JAKARTA, 60, 4000, 5657);
    expect(p.heightM).toBeCloseTo(84.855, 3);
    expect(initialPlacement(JAKARTA, 60, 0, 0).heightM).toBe(60);
  });

  it('tipe sudut sesuai kolom corners', () => {
    const corners: Corners = placementCorners(initialPlacement(JAKARTA, 60, 1, 1));
    expect(corners).toHaveLength(4);
  });
});
