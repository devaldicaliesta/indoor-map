import { describe, expect, it } from 'vitest';
import {
  confidenceLevel,
  pixelToLngLat,
  readScanResult,
  type ScanResult,
  scanCandidates,
} from '../src/scan-import';
import { validateFloorGeometry } from '../src/validation/geometry';
import { projector } from '../src/validation/planar';
import simple from './fixtures/scan-simple.json';

const ORIGIN: [number, number] = [106.8, -6.2];
const M_PER_DEG_LAT = 111_195.08;
const M_PER_DEG_LNG = M_PER_DEG_LAT * Math.cos((ORIGIN[1] * Math.PI) / 180);
const PX_PER_M = 40;

function cornersFor(widthPx: number, heightPx: number): [number, number][] {
  const w = widthPx / PX_PER_M / M_PER_DEG_LNG;
  const h = heightPx / PX_PER_M / M_PER_DEG_LAT;
  const [x, y] = ORIGIN;
  return [
    [x, y + h],
    [x + w, y + h],
    [x + w, y],
    [x, y],
  ];
}

const meters = (p: [number, number]) => projector(ORIGIN)(p);

describe('pixelToLngLat', () => {
  const corners = cornersFor(1200, 800);

  it('sudut gambar jatuh tepat di sudut georeferensi', () => {
    const near = (a: [number, number], b: [number, number] | undefined) => {
      expect(a[0]).toBeCloseTo(b?.[0] ?? Number.NaN, 7);
      expect(a[1]).toBeCloseTo(b?.[1] ?? Number.NaN, 7);
    };
    near(pixelToLngLat(corners, 1200, 800, [0, 0]), corners[0]);
    near(pixelToLngLat(corners, 1200, 800, [1200, 800]), corners[2]);
  });

  it('jarak piksel menjadi meter sesuai skala denah', () => {
    const [x, y] = meters(pixelToLngLat(corners, 1200, 800, [400, 400]));
    expect(x).toBeCloseTo(10, 2);
    expect(y).toBeCloseTo(10, 2);
  });

  it('denah yang diputar ikut diputar', () => {
    const rotated: [number, number][] = [corners[1], corners[2], corners[3], corners[0]] as [
      number,
      number,
    ][];
    const [x, y] = meters(pixelToLngLat(rotated, 1200, 800, [0, 0]));
    expect(x).toBeCloseTo(30, 2);
    expect(y).toBeCloseTo(20, 2);
  });
});

describe('scanCandidates', () => {
  const result = readScanResult(simple) as ScanResult;
  const corners = cornersFor(result.widthPx, result.heightPx);

  it('ruang dan dinding fixture sederhana menjadi unit dan garis', () => {
    const { candidates, rejected } = scanCandidates(result, corners);
    expect(rejected).toBe(0);
    expect(candidates.filter((c) => c.kind === 'unit')).toHaveLength(4);
    expect(candidates.filter((c) => c.kind === 'wall')).toHaveLength(result.walls.length);
  });

  it('posisi ruang sesuai gambar dalam 0,5 m', () => {
    const { candidates } = scanCandidates(result, corners);
    const room = candidates.find((c) => c.id === 'scan-room-0');
    expect(room?.geometry.type).toBe('Polygon');
    const ring = (room?.geometry.coordinates[0] ?? []) as [number, number][];
    const xs = ring.map((p) => meters(p)[0]);
    const ys = ring.map((p) => meters(p)[1]);
    expect(Math.abs(Math.min(...xs) - 2.5)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(Math.max(...xs) - 15)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(Math.max(...ys) - 17.5)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(Math.min(...ys) - 10)).toBeLessThanOrEqual(0.5);
  });

  it('poligon tertutup, berlawanan jarum jam, dan lolos validasi lantai', () => {
    const { candidates } = scanCandidates(result, corners);
    const features = candidates.map((c, i) => ({
      geometry: c.geometry,
      properties: { id: c.id, kind: c.kind, unitCode: c.kind === 'unit' ? `L1-${i}` : null },
    }));
    expect(validateFloorGeometry(features, { boundary: null })).toEqual([]);
    for (const c of candidates.filter((item) => item.kind === 'unit')) {
      const ring = c.geometry.coordinates[0] as [number, number][];
      expect(ring[0]).toEqual(ring.at(-1));
      const pts = ring.map(meters);
      let area = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const [a, b] = [pts[i] as [number, number], pts[i + 1] as [number, number]];
        area += a[0] * b[1] - b[0] * a[1];
      }
      expect(area).toBeGreaterThan(0);
    }
  });

  it('ruang terlalu kecil, memotong diri, dan dinding pendek dibuang', () => {
    const { candidates, rejected } = scanCandidates(
      {
        widthPx: 1000,
        heightPx: 1000,
        rooms: [
          {
            points: [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
            ],
            confidence: 1,
          },
          {
            points: [
              [0, 0],
              [400, 400],
              [400, 0],
              [0, 400],
            ],
            confidence: 1,
          },
        ],
        walls: [
          {
            points: [
              [0, 0],
              [5, 0],
            ],
            confidence: 1,
          },
        ],
      },
      cornersFor(1000, 1000),
    );
    expect(candidates).toEqual([]);
    expect(rejected).toBe(3);
  });

  it('tanpa georeferensi tidak ada kandidat', () => {
    expect(scanCandidates(result, []).candidates).toEqual([]);
  });
});

describe('readScanResult dan tingkat keyakinan', () => {
  it('menolak balasan yang rusak', () => {
    expect(readScanResult(null)).toBeNull();
    expect(readScanResult({ widthPx: 0, heightPx: 10, rooms: [], walls: [] })).toBeNull();
    expect(
      readScanResult({
        widthPx: 10,
        heightPx: 10,
        rooms: [{ points: [[0, 0]], confidence: 1 }],
        walls: [],
      }),
    ).toBeNull();
    expect(
      readScanResult({
        widthPx: 10,
        heightPx: 10,
        rooms: [],
        walls: [
          {
            points: [
              [0, 0],
              [1, 1],
            ],
            confidence: 2,
          },
        ],
      }),
    ).toBeNull();
  });

  it('keyakinan dibagi tiga tingkat', () => {
    expect(confidenceLevel(0.9)).toBe('high');
    expect(confidenceLevel(0.7)).toBe('medium');
    expect(confidenceLevel(0.3)).toBe('low');
  });
});
