import { describe, expect, it } from 'vitest';
import en from './en.json';
import id from './id.json';

function keys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null
      ? keys(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('terjemahan Visitor', () => {
  it('kunci ID dan EN sama persis', () => {
    expect(keys(en).sort()).toEqual(keys(id).sort());
  });

  it('tidak ada teks kosong', () => {
    const empty = (value: object): boolean =>
      Object.values(value).some((v) => (typeof v === 'object' ? empty(v) : v.trim() === ''));
    expect(empty(id) || empty(en)).toBe(false);
  });
});
