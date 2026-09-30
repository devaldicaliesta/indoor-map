import { describe, expect, it } from 'vitest';
import { checkImageFile, MAX_IMAGE_BYTES } from './image';

describe('checkImageFile (NFR-SEC-04)', () => {
  it('PNG, JPG, dan WebP diterima; MIME kosong mengikuti ekstensi', () => {
    expect(checkImageFile({ name: 'logo.PNG', type: 'image/png', size: 10 })).toEqual({
      ok: true,
      mime: 'image/png',
      extension: 'png',
    });
    expect(checkImageFile({ name: 'foto.jpeg', type: '', size: 10 })).toMatchObject({
      ok: true,
      mime: 'image/jpeg',
      extension: 'jpg',
    });
    expect(checkImageFile({ name: 'foto.webp', type: 'image/webp', size: 10 }).ok).toBe(true);
  });

  it('SVG, tipe yang tidak cocok dengan ekstensi, berkas kosong, dan > 5 MB ditolak', () => {
    expect(checkImageFile({ name: 'x.svg', type: 'image/svg+xml', size: 10 })).toEqual({
      ok: false,
      problem: 'unsupported_type',
    });
    expect(checkImageFile({ name: 'x.png', type: 'image/jpeg', size: 10 })).toEqual({
      ok: false,
      problem: 'unsupported_type',
    });
    expect(checkImageFile({ name: 'x.png', type: 'image/png', size: 0 })).toEqual({
      ok: false,
      problem: 'empty',
    });
    expect(checkImageFile({ name: 'x.png', type: 'image/png', size: MAX_IMAGE_BYTES + 1 })).toEqual(
      { ok: false, problem: 'too_large' },
    );
  });
});
