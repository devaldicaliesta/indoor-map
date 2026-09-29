import { COORDINATE_SYSTEM, DISTANCE_UNIT } from '@indoor/domain';
import { describe, expect, it } from 'vitest';

describe('routing → domain', () => {
  it('memakai satuan dan sistem koordinat dari domain', () => {
    expect(COORDINATE_SYSTEM).toBe('EPSG:4326');
    expect(DISTANCE_UNIT).toBe('m');
  });
});
