import { BUILDING_SIZES, BUILDING_TYPES } from '@indoor/domain/trial-request';
import { describe, expect, it } from 'vitest';
import { TRIAL_COPY } from '../src/trial/copy';

function shape(value: unknown, path = ''): string[] {
  if (Array.isArray(value))
    return [`${path}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, v]) => shape(v, path ? `${path}.${key}` : key));
  }
  return [path];
}

describe('teks trial landing (T-616)', () => {
  it('ID dan EN berbentuk sama', () => {
    expect(shape(TRIAL_COPY.en)).toEqual(shape(TRIAL_COPY.id));
  });

  it('setiap jenis dan luas gedung form punya label di kedua bahasa', () => {
    for (const language of ['id', 'en'] as const) {
      expect(Object.keys(TRIAL_COPY[language].buildingTypes).sort()).toEqual(
        [...BUILDING_TYPES].sort(),
      );
      expect(Object.keys(TRIAL_COPY[language].buildingSizes).sort()).toEqual(
        [...BUILDING_SIZES].sort(),
      );
    }
  });

  it('teks pesan "cek email" menyebut alamat pemohon', () => {
    expect(TRIAL_COPY.id.form.sentBody).toContain('{email}');
    expect(TRIAL_COPY.en.form.sentBody).toContain('{email}');
  });
});
