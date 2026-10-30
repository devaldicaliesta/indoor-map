import { EULA_VERSION } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import eula from '../../../../../docs/legal/eula.md?raw';
import { legalTextVersion, parseLegalText } from './legal-text';

describe('parseLegalText', () => {
  it('judul, subjudul, paragraf, dan daftar bernomor (termasuk baris lanjutan)', () => {
    expect(
      parseLegalText(
        '# Judul\n\nVersi 2026-10-30\n\n## 1. Bagian\n\n1. Satu\n2. Dua\nlanjutan\n\nParagraf\nbaris dua\n',
      ),
    ).toEqual([
      { kind: 'title', text: 'Judul' },
      { kind: 'paragraph', text: 'Versi 2026-10-30' },
      { kind: 'heading', text: '1. Bagian' },
      { kind: 'list', items: ['Satu', 'Dua lanjutan'] },
      { kind: 'paragraph', text: 'Paragraf baris dua' },
    ]);
  });
});

describe('naskah EULA', () => {
  it('versinya sama dengan EULA_VERSION yang ditegakkan server', () => {
    expect(legalTextVersion(eula)).toBe(EULA_VERSION);
  });

  it('memakai format yang didukung: tanpa format inline, tautan, atau tabel', () => {
    expect(eula).not.toMatch(/\*\*|`|\]\(|^\|/m);
    expect(parseLegalText(eula)[0]).toEqual({
      kind: 'title',
      text: 'Perjanjian Lisensi Pengguna Akhir PanduArah',
    });
  });
});
