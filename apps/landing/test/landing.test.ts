import { describe, expect, it, vi } from 'vitest';
import { COPY } from '../src/copy';

/** Semua jalur kunci teks (untuk memastikan ID dan EN lengkap dan berbentuk sama). */
function shape(value: unknown, path = ''): string[] {
  if (Array.isArray(value))
    return [`${path}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, v]) => shape(v, path ? `${path}.${key}` : key));
  }
  return [path];
}

function texts(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(texts);
  return [];
}

describe('teks landing ID/EN (TC-LND-01)', () => {
  it('kedua bahasa punya kunci dan jumlah butir yang sama, tanpa teks kosong', () => {
    expect(shape(COPY.en)).toEqual(shape(COPY.id));
    expect(texts(COPY.id).every((t) => t.trim().length > 0)).toBe(true);
    expect(texts(COPY.en).every((t) => t.trim().length > 0)).toBe(true);
  });

  it('teks EN memang diterjemahkan', () => {
    expect(COPY.en.hero.title).not.toBe(COPY.id.hero.title);
    expect(COPY.en.trial.submit).toBe('Send request');
  });
});

describe('bahasa awal', () => {
  async function initial(search: string, stored: string | null, languages: string[]) {
    vi.resetModules();
    vi.stubGlobal('window', { location: { search } });
    vi.stubGlobal('localStorage', { getItem: () => stored });
    vi.stubGlobal('navigator', { languages, language: languages[0] });
    try {
      const { initialLanguage } = await import('../src/language');
      return initialLanguage();
    } finally {
      vi.unstubAllGlobals();
    }
  }

  it('?lang= menang, lalu pilihan tersimpan, lalu bahasa peramban; bawaan Indonesia', async () => {
    expect(await initial('?lang=en', 'id', ['id-ID'])).toBe('en');
    expect(await initial('', 'en', ['id-ID'])).toBe('en');
    expect(await initial('', null, ['en-US'])).toBe('en');
    expect(await initial('', null, ['id-ID'])).toBe('id');
    expect(await initial('', null, ['fr-FR'])).toBe('id');
    expect(await initial('?lang=xx', null, ['fr-FR'])).toBe('id');
  });
});

describe('alamat form trial', () => {
  it('memakai VITE_TRIAL_ENDPOINT bila ada, selain itu fungsi trial-request Supabase', async () => {
    vi.stubEnv('VITE_TRIAL_ENDPOINT', '');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://api.vendor.test/');
    const { trialEndpoint } = await import('../src/sections/trial-form');
    expect(trialEndpoint()).toBe('https://api.vendor.test/functions/v1/trial-request');
    vi.stubEnv('VITE_TRIAL_ENDPOINT', 'https://vendor.test/trial');
    expect(trialEndpoint()).toBe('https://vendor.test/trial');
    vi.unstubAllEnvs();
  });
});
