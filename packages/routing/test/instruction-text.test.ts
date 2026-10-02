import type { InstructionAction } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import {
  type InstructionContext,
  instructionPlaceholders,
  instructionText,
  type RouteStep,
  roundStepDistance,
  unknownPlaceholders,
} from '../src';
import { DEFAULT_TEMPLATES } from './fixtures/instruction-templates';
import { BUILDINGS, FLOORS, m } from './fixtures/route-legs';

const context = (
  language: 'id' | 'en',
  templates: InstructionContext['templates'] = DEFAULT_TEMPLATES,
): InstructionContext => ({
  templates,
  language,
  floors: FLOORS,
  buildings: BUILDINGS,
  origin: 'Lobi Utama',
  destination: 'Radiologi',
});
const step = (action: InstructionAction, extra: Partial<RouteStep> = {}): RouteStep => ({
  action,
  floorId: 'a-gf',
  buildingId: 'a',
  coordinates: [m(0, 0)],
  distanceM: 0,
  ...extra,
});

describe('roundStepDistance', () => {
  it('dibulatkan ke 5 m terdekat, minimal 5 m', () => {
    expect([0, 0.4, 2.49, 7.49, 7.5, 12.5, 76.94, 1234].map(roundStepDistance)).toEqual([
      5, 5, 5, 5, 10, 15, 75, 1235,
    ]);
  });
});

describe('instructionText', () => {
  it('mengisi placeholder dari template sesuai bahasa', () => {
    const cases: [RouteStep, string, string][] = [
      [step('start'), 'Mulai dari Lobi Utama', 'Start at Lobi Utama'],
      [step('straight', { distanceM: 2 }), 'Jalan lurus 5 m', 'Go straight for 5 m'],
      [step('straight', { distanceM: 7.5 }), 'Jalan lurus 10 m', 'Go straight for 10 m'],
      [step('straight', { distanceM: 1234 }), 'Jalan lurus 1.235 m', 'Go straight for 1,235 m'],
      [step('slight_left'), 'Agak ke kiri', 'Bear left'],
      [step('elevator_up', { floorId: 'a-l2' }), 'Naik lift ke L2', 'Take the elevator up to L2'],
      [
        step('stairs_down', { floorId: 'a-gf' }),
        'Turun tangga ke GF',
        'Take the stairs down to GF',
      ],
      [step('exit_building', { floorId: 'out' }), 'Keluar dari Gedung A', 'Exit Gedung A'],
      [
        step('enter_building', { floorId: 'b-gf', buildingId: 'b' }),
        'Masuk ke Gedung B',
        'Enter Gedung B',
      ],
      [step('arrive'), 'Tiba di Radiologi', 'Arrive at Radiologi'],
    ];
    for (const [s, id, en] of cases) {
      expect(instructionText(s, context('id'))).toBe(id);
      expect(instructionText(s, context('en'))).toBe(en);
    }
  });

  it('teks kosong di satu bahasa memakai teks bahasa lain', () => {
    const templates = {
      ...DEFAULT_TEMPLATES,
      turn_left: { id: 'Belok kiri', en: '' },
      turn_right: { id: ' ', en: 'Turn right' },
    };
    expect(instructionText(step('turn_left'), context('en', templates))).toBe('Belok kiri');
    expect(instructionText(step('turn_right'), context('id', templates))).toBe('Turn right');
  });

  it('placeholder yang tidak dikenal atau tidak tersedia untuk aksinya dibiarkan apa adanya', () => {
    const templates = {
      ...DEFAULT_TEMPLATES,
      straight: { id: 'Lurus {jarak} m ({distance} m) di {building}, {floor}', en: '' },
      turn_left: { id: 'Belok kiri {distance} menuju {destination}', en: '' },
    };
    expect(
      instructionText(step('straight', { floorId: 'out', buildingId: null, distanceM: 21 }), {
        ...context('id', templates),
      }),
    ).toBe('Lurus {jarak} m (20 m) di Area Luar, Area Luar');
    expect(instructionText(step('turn_left'), context('id', templates))).toBe(
      'Belok kiri {distance} menuju Radiologi',
    );
  });

  it('`{distance}` hanya tersedia untuk jalan lurus', () => {
    expect(instructionPlaceholders('straight')).toEqual([
      'distance',
      'floor',
      'building',
      'origin',
      'destination',
    ]);
    expect(instructionPlaceholders('turn_left')).toEqual([
      'floor',
      'building',
      'origin',
      'destination',
    ]);
  });
});

describe('unknownPlaceholders', () => {
  it('menemukan placeholder yang tidak dikenal atau tidak tersedia untuk aksinya', () => {
    expect(unknownPlaceholders('straight', 'Jalan {distance} m ke {destination}')).toEqual([]);
    expect(unknownPlaceholders('turn_left', 'Belok kiri {distance} m')).toEqual(['distance']);
    expect(unknownPlaceholders('arrive', 'Tiba di {tujuan} {} {tujuan}')).toEqual(['tujuan', '']);
    expect(unknownPlaceholders('start', 'Mulai tanpa placeholder')).toEqual([]);
    // Spasi atau tanda lain di dalam kurung tidak diganti instructionText, jadi ikut ditolak.
    expect(unknownPlaceholders('elevator_up', 'Naik ke { floor } {lantai-2}')).toEqual([
      ' floor ',
      'lantai-2',
    ]);
  });
});
