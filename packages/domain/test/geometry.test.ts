import { describe, expect, it } from 'vitest';
import { GeometrySchema } from '../src';

const square = [
  [106.8268, -6.1751],
  [106.8276, -6.1751],
  [106.8276, -6.1757],
  [106.8268, -6.1751],
];

describe('GeometrySchema', () => {
  it('menerima titik, garis, poligon, dan multipoligon WGS84', () => {
    expect(GeometrySchema.safeParse({ type: 'Point', coordinates: [106.8, -6.1] }).success).toBe(
      true,
    );
    expect(
      GeometrySchema.safeParse({
        type: 'LineString',
        coordinates: [
          [106.8, -6.1],
          [106.9, -6.2],
        ],
      }).success,
    ).toBe(true);
    expect(GeometrySchema.safeParse({ type: 'Polygon', coordinates: [square] }).success).toBe(true);
    expect(
      GeometrySchema.safeParse({ type: 'MultiPolygon', coordinates: [[square]] }).success,
    ).toBe(true);
  });

  it('menolak koordinat di luar rentang WGS84', () => {
    expect(GeometrySchema.safeParse({ type: 'Point', coordinates: [181, 0] }).success).toBe(false);
    expect(GeometrySchema.safeParse({ type: 'Point', coordinates: [0, -91] }).success).toBe(false);
  });

  it('menolak poligon yang tidak tertutup', () => {
    const open = square.slice(0, 3).concat([[106.8268, -6.1757]]);
    expect(GeometrySchema.safeParse({ type: 'Polygon', coordinates: [open] }).success).toBe(false);
  });

  it('menolak jenis geometri yang tidak didukung', () => {
    expect(GeometrySchema.safeParse({ type: 'GeometryCollection', geometries: [] }).success).toBe(
      false,
    );
  });
});
