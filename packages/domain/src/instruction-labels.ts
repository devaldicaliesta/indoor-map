import type { InstructionAction } from './snapshot.ts';

/** Nama aksi instruksi untuk Admin (tabel instruksi, temuan validasi publish). */
export const INSTRUCTION_ACTION_LABELS: Record<InstructionAction, string> = {
  start: 'Mulai',
  straight: 'Jalan lurus',
  turn_left: 'Belok kiri',
  turn_right: 'Belok kanan',
  slight_left: 'Agak ke kiri',
  slight_right: 'Agak ke kanan',
  elevator_up: 'Naik lift',
  elevator_down: 'Turun lift',
  escalator_up: 'Naik eskalator',
  escalator_down: 'Turun eskalator',
  stairs_up: 'Naik tangga',
  stairs_down: 'Turun tangga',
  exit_building: 'Keluar gedung',
  enter_building: 'Masuk gedung',
  arrive: 'Tiba',
};
