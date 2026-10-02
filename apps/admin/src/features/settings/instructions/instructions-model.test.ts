import { INSTRUCTION_ACTIONS } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { ACTION_LABELS, previewInstruction, validateInstruction } from './instructions-model';

describe('template instruksi', () => {
  it('setiap aksi punya label', () => {
    expect(Object.keys(ACTION_LABELS).sort()).toEqual([...INSTRUCTION_ACTIONS].sort());
  });

  it('teks ID wajib; EN boleh kosong', () => {
    expect(validateInstruction('turn_left', { id: 'Belok kiri', en: '' })).toEqual({});
    expect(validateInstruction('turn_left', { id: '  ', en: 'Turn left' })).toHaveProperty('id');
  });

  it('placeholder tidak dikenal atau tidak tersedia untuk aksinya ditolak', () => {
    expect(
      validateInstruction('straight', { id: 'Jalan {distance} m', en: 'Go {jarak} m' }),
    ).toEqual({
      en: 'Placeholder tidak dikenal: {jarak}. Yang tersedia: {distance}, {floor}, {building}, {origin}, {destination}.',
    });
    expect(validateInstruction('arrive', { id: 'Tiba {distance}', en: '' })).toHaveProperty('id');
  });

  it('pratinjau mengisi placeholder dengan contoh; EN kosong memakai ID', () => {
    expect(previewInstruction('straight', { id: 'Jalan lurus {distance} m', en: '' }, 'id')).toBe(
      'Jalan lurus 25 m',
    );
    expect(previewInstruction('elevator_up', { id: 'Naik lift ke {floor}', en: '' }, 'en')).toBe(
      'Naik lift ke L2',
    );
    expect(previewInstruction('exit_building', { id: 'x', en: 'Exit {building}' }, 'en')).toBe(
      'Exit Main Building',
    );
  });
});
