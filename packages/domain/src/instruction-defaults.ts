import type { InstructionAction, InstructionText } from './snapshot';

/**
 * Template bawaan venue baru, sama dengan `app.on_venue_created` di migrasi 0001 (dijaga test
 * integrasi `instruction-templates.test.ts`). Dipakai Admin untuk "Kembali ke bawaan".
 */
export const DEFAULT_INSTRUCTION_TEMPLATES: Record<InstructionAction, InstructionText> = {
  start: { id: 'Mulai dari {origin}', en: 'Start at {origin}' },
  straight: { id: 'Jalan lurus {distance} m', en: 'Go straight for {distance} m' },
  turn_left: { id: 'Belok kiri', en: 'Turn left' },
  turn_right: { id: 'Belok kanan', en: 'Turn right' },
  slight_left: { id: 'Agak ke kiri', en: 'Bear left' },
  slight_right: { id: 'Agak ke kanan', en: 'Bear right' },
  elevator_up: { id: 'Naik lift ke {floor}', en: 'Take the elevator up to {floor}' },
  elevator_down: { id: 'Turun lift ke {floor}', en: 'Take the elevator down to {floor}' },
  escalator_up: { id: 'Naik eskalator ke {floor}', en: 'Take the escalator up to {floor}' },
  escalator_down: { id: 'Turun eskalator ke {floor}', en: 'Take the escalator down to {floor}' },
  stairs_up: { id: 'Naik tangga ke {floor}', en: 'Take the stairs up to {floor}' },
  stairs_down: { id: 'Turun tangga ke {floor}', en: 'Take the stairs down to {floor}' },
  exit_building: { id: 'Keluar dari {building}', en: 'Exit {building}' },
  enter_building: { id: 'Masuk ke {building}', en: 'Enter {building}' },
  arrive: { id: 'Tiba di {destination}', en: 'Arrive at {destination}' },
};
