import { COORDINATE_SYSTEM, VenueIdSchema } from '@indoor/domain';
import { describe, expect, it } from 'vitest';

// Membuktikan paket workspace dipakai langsung dari sumber TS, tanpa build terpisah.
describe('@indoor/domain dari app', () => {
  it('dapat diimpor dan dijalankan', () => {
    expect(COORDINATE_SYSTEM).toBe('EPSG:4326');
    expect(VenueIdSchema.safeParse('bukan-uuid').success).toBe(false);
  });
});
