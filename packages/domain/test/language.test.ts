import { describe, expect, it } from 'vitest';
import { resolveLanguage } from '../src';

describe('resolveLanguage', () => {
  it('pilihan tersimpan menang', () => {
    expect(resolveLanguage('en', ['id-ID'], 'id')).toBe('en');
  });

  it('bahasa perangkat pertama yang didukung', () => {
    expect(resolveLanguage(null, ['ja-JP', 'en-GB', 'id-ID'], 'id')).toBe('en');
    expect(resolveLanguage(null, ['in', 'id_ID'], 'en')).toBe('id');
  });

  it('jatuh ke default bila tidak ada yang cocok atau nilai tersimpan rusak', () => {
    expect(resolveLanguage('fr', ['ja-JP'], 'id')).toBe('id');
    expect(resolveLanguage(null, [], 'en')).toBe('en');
  });
});
