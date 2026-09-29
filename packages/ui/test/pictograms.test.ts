import { PICTOGRAM_KEYS } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { pictogramSvg } from '../src/pictograms/pictogram';
import { PICTOGRAM_SHAPES } from '../src/pictograms/shapes';

describe('piktogram bawaan', () => {
  it('setiap kunci di domain punya gambar', () => {
    for (const key of PICTOGRAM_KEYS) expect(PICTOGRAM_SHAPES[key].length).toBeGreaterThan(0);
  });

  it('SVG mandiri hanya berisi path berwarna tetap, tanpa skrip atau rujukan luar', () => {
    for (const key of PICTOGRAM_KEYS) {
      const svg = pictogramSvg(key, 48, '#111418');
      expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24"/);
      expect(svg).toContain('width="48"');
      expect(svg).not.toMatch(/<script|href=|url\(/i);
      expect(svg.match(/<path /g)?.length).toBe(PICTOGRAM_SHAPES[key].length);
    }
  });

  it('path hanya memakai perintah path SVG dan angka', () => {
    for (const key of PICTOGRAM_KEYS) {
      for (const part of PICTOGRAM_SHAPES[key]) expect(part.d).toMatch(/^[MmHhVvLlAaZz0-9 .-]+$/);
    }
  });
});
