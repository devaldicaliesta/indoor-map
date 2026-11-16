import { describe, expect, it } from 'vitest';
import { eventCollection } from '../src/layers/events';

describe('penanda event', () => {
  it('satu titik per penanda dengan jenis dan status berlangsung', () => {
    const collection = eventCollection([
      { id: 'a', position: [106.8, -6.2], kind: 'event', live: true, onLocation: true },
      { id: 'b', position: [106.9, -6.3], kind: 'promotion', live: false, onLocation: false },
    ]);
    expect(collection.features).toHaveLength(2);
    expect(collection.features[1]?.properties).toEqual({
      id: 'b',
      kind: 'promotion',
      live: false,
      onLocation: false,
    });
    expect(collection.features[0]?.geometry).toEqual({ type: 'Point', coordinates: [106.8, -6.2] });
  });
});
