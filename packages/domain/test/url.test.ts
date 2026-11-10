import { describe, expect, it } from 'vitest';
import { trimTrailingSlashes } from '../src/url';

describe('trimTrailingSlashes', () => {
  it('membuang semua garis miring di akhir saja', () => {
    expect(trimTrailingSlashes('https://peta.contoh.test///')).toBe('https://peta.contoh.test');
    expect(trimTrailingSlashes('https://peta.contoh.test/v/')).toBe('https://peta.contoh.test/v');
    expect(trimTrailingSlashes('https://peta.contoh.test')).toBe('https://peta.contoh.test');
    expect(trimTrailingSlashes('///')).toBe('');
    expect(trimTrailingSlashes('')).toBe('');
  });

  it('tetap cepat untuk masukan sangat panjang', () => {
    const value = `${'/'.repeat(200_000)}x`;
    const started = Date.now();
    expect(trimTrailingSlashes(value)).toBe(value);
    expect(Date.now() - started).toBeLessThan(100);
  });
});
