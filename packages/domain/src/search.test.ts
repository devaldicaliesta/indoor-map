import { describe, expect, it } from 'vitest';
import { normalizeSearchText } from './search';

describe('normalizeSearchText', () => {
  it('huruf kecil, tanpa diakritik, spasi dirapikan', () => {
    expect(normalizeSearchText('  Kafé   Crème ')).toBe('kafe creme');
    expect(normalizeSearchText('RADIOLOGI')).toBe('radiologi');
    expect(normalizeSearchText('')).toBe('');
  });
});
