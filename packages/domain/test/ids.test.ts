import { describe, expect, it } from 'vitest';
import { VenueIdSchema } from '../src';

describe('VenueIdSchema', () => {
  it('menerima UUID', () => {
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e';
    expect(VenueIdSchema.parse(id)).toBe(id);
  });

  it('menolak teks yang bukan UUID', () => {
    expect(VenueIdSchema.safeParse('venue-1').success).toBe(false);
  });
});
