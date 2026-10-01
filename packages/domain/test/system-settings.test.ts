import { describe, expect, it } from 'vitest';
import { checkPublicVisitorUrl, isValidPort, isValidTimezone } from '../src';

describe('checkPublicVisitorUrl', () => {
  it('menerima https tanpa garis miring akhir, termasuk dengan path', () => {
    expect(checkPublicVisitorUrl('https://peta.rs-harapan.id')).toBeNull();
    expect(checkPublicVisitorUrl('https://rs-harapan.id/peta')).toBeNull();
  });

  it('menolak http kecuali localhost', () => {
    expect(checkPublicVisitorUrl('http://peta.rs-harapan.id')).toBe('not_https');
    expect(checkPublicVisitorUrl('http://localhost:5174')).toBeNull();
    expect(checkPublicVisitorUrl('http://127.0.0.1:5174')).toBeNull();
  });

  it('menolak garis miring di akhir', () => {
    expect(checkPublicVisitorUrl('https://peta.rs-harapan.id/')).toBe('trailing_slash');
  });

  it('menolak query atau hash, dan teks yang bukan URL', () => {
    expect(checkPublicVisitorUrl('https://peta.id?x=1')).toBe('has_query');
    expect(checkPublicVisitorUrl('peta.rs-harapan.id')).toBe('invalid');
    expect(checkPublicVisitorUrl('ftp://peta.id')).toBe('invalid');
  });
});

describe('isValidPort dan isValidTimezone', () => {
  it('port 1–65535', () => {
    expect(isValidPort(587)).toBe(true);
    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(70000)).toBe(false);
    expect(isValidPort(25.5)).toBe(false);
  });

  it('zona waktu IANA', () => {
    expect(isValidTimezone('Asia/Makassar')).toBe(true);
    expect(isValidTimezone('WITA')).toBe(false);
  });
});
