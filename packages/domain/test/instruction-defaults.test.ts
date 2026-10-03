import { describe, expect, it } from 'vitest';
import { DEFAULT_INSTRUCTION_TEMPLATES, INSTRUCTION_ACTIONS } from '../src';

describe('template instruksi bawaan', () => {
  it('ada untuk setiap aksi, dengan teks ID dan EN terisi', () => {
    expect(Object.keys(DEFAULT_INSTRUCTION_TEMPLATES).sort()).toEqual(
      [...INSTRUCTION_ACTIONS].sort(),
    );
    for (const text of Object.values(DEFAULT_INSTRUCTION_TEMPLATES)) {
      expect(text.id.trim()).not.toBe('');
      expect(text.en.trim()).not.toBe('');
    }
  });

  it('jarak hanya di aksi lurus', () => {
    expect(DEFAULT_INSTRUCTION_TEMPLATES.straight.id).toContain('{distance}');
    expect(DEFAULT_INSTRUCTION_TEMPLATES.turn_left.id).not.toContain('{distance}');
  });
});
