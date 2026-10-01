import { describe, expect, it } from 'vitest';
import { FOCUS_MIN_ZOOM, focusZoom, geometryBounds } from '../src/camera';

describe('kamera fokus fitur', () => {
  it('zoom sekarang dipertahankan bila fitur muat di layar', () => {
    expect(focusZoom(20, 21.5)).toBe(20);
  });

  it('dinaikkan ke zoom minimum bila peta terlalu jauh; titik tidak dizoom tak terhingga', () => {
    expect(focusZoom(16, 22)).toBe(FOCUS_MIN_ZOOM);
    expect(focusZoom(16, Number.POSITIVE_INFINITY)).toBe(FOCUS_MIN_ZOOM);
    expect(focusZoom(21, Number.POSITIVE_INFINITY)).toBe(21);
  });

  it('diturunkan agar fitur besar muat seluruhnya', () => {
    expect(focusZoom(20, 17.2)).toBe(17.2);
    expect(focusZoom(16, 17.2)).toBe(17.2);
  });

  it('kotak batas geometri', () => {
    expect(
      geometryBounds({
        type: 'Polygon',
        coordinates: [
          [
            [106.1, -6.2],
            [106.3, -6.2],
            [106.3, -6.1],
            [106.1, -6.2],
          ],
        ],
      }),
    ).toEqual([
      [106.1, -6.2],
      [106.3, -6.1],
    ]);
    expect(geometryBounds({ type: 'Point', coordinates: [1, 2] })).toEqual([
      [1, 2],
      [1, 2],
    ]);
  });
});
