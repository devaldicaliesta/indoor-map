import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import id from '../src/i18n/id.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const entries = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'string') entries.set(`${prefix}${key}`, value);
    else for (const [k, v] of flatten(value, `${prefix}${key}.`)) entries.set(k, v);
  }
  return entries;
}

const languages = { id: flatten(id), en: flatten(en) };
const PLURAL = /_(zero|one|two|few|many|other)$/;
const baseKey = (key: string) => key.replace(PLURAL, '');
const variables = (text: string) =>
  [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

// Kode sumber Visitor tanpa test dan pratinjau pengembangan, dibaca sebagai teks oleh Vite.
const sources = Object.entries(
  import.meta.glob<string>('../src/**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
).filter(([path]) => !/\.test\.tsx?$/.test(path) && !path.includes('/dev/'));

/** Kunci statis `t('…')`; kunci dengan bagian dinamis ditangani `DYNAMIC_PREFIXES`. */
const usedKeys = new Set(
  sources.flatMap(([, text]) =>
    [...text.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)].flatMap((m) => m[1] ?? []),
  ),
);
// `t(`language.${code}`)` di pemilih bahasa.
const DYNAMIC_PREFIXES = ['language.'];

describe('terjemahan Visitor', () => {
  it('kunci ID dan EN sama persis', () => {
    expect([...languages.en.keys()].sort()).toEqual([...languages.id.keys()].sort());
  });

  it('tidak ada teks kosong', () => {
    for (const map of Object.values(languages)) {
      for (const [key, text] of map) expect(text.trim(), key).not.toBe('');
    }
  });

  it('variabel interpolasi sama di kedua bahasa', () => {
    for (const [key, text] of languages.id) {
      expect(variables(languages.en.get(key) ?? ''), key).toEqual(variables(text));
    }
  });

  it('kunci jamak punya bentuk "one" dan "other" (aturan jamak bahasa Inggris)', () => {
    const plurals = [...languages.en.keys()].filter((key) => PLURAL.test(key)).map(baseKey);
    for (const key of new Set(plurals)) {
      expect(languages.en.has(`${key}_one`) && languages.en.has(`${key}_other`), key).toBe(true);
    }
  });

  it('setiap kunci yang dipakai kode ada di terjemahan', () => {
    expect(usedKeys.size).toBeGreaterThan(20);
    const known = new Set([...languages.id.keys()].map(baseKey));
    expect([...usedKeys].filter((key) => !known.has(key))).toEqual([]);
  });

  it('tidak ada kunci terjemahan yang tidak dipakai', () => {
    const unused = [...languages.id.keys()].filter(
      (key) =>
        !usedKeys.has(baseKey(key)) && !DYNAMIC_PREFIXES.some((prefix) => key.startsWith(prefix)),
    );
    expect(unused).toEqual([]);
  });
});
