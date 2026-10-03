import type { InstructionAction, InstructionText, SnapshotLanguage } from '@indoor/domain';
import {
  instructionPlaceholders,
  instructionText,
  type RouteStep,
  unknownPlaceholders,
} from '@indoor/routing';

export { INSTRUCTION_ACTION_LABELS as ACTION_LABELS } from '@indoor/domain';

export type InstructionErrors = Partial<Record<SnapshotLanguage, string>>;

/** Teks ID wajib (EN boleh kosong dan memakai ID); placeholder harus tersedia untuk aksinya. */
export function validateInstruction(
  action: InstructionAction,
  text: InstructionText,
): InstructionErrors {
  const errors: InstructionErrors = {};
  for (const language of ['id', 'en'] as const) {
    const value = text[language];
    if (language === 'id' && !value.trim()) {
      errors.id = 'Teks Bahasa Indonesia wajib diisi.';
      continue;
    }
    const unknown = unknownPlaceholders(action, value);
    if (unknown.length > 0) {
      const allowed = instructionPlaceholders(action)
        .map((name) => `{${name}}`)
        .join(', ');
      errors[language] =
        `Placeholder tidak dikenal: ${unknown.map((name) => `{${name}}`).join(', ')}. Yang tersedia: ${allowed}.`;
    }
  }
  return errors;
}

const SAMPLE_FLOOR = { id: 'contoh-lantai', name: 'L2' };
const SAMPLE = {
  id: { building: 'Gedung Utama', origin: 'Pintu Utama', destination: 'Ruang 201' },
  en: { building: 'Main Building', origin: 'Main Entrance', destination: 'Room 201' },
};

/** Contoh kalimat aksi dengan nilai rekaan, memakai fungsi teks yang sama dengan test route. */
export function previewInstruction(
  action: InstructionAction,
  text: InstructionText,
  language: SnapshotLanguage,
): string {
  const step: RouteStep = {
    action,
    floorId: SAMPLE_FLOOR.id,
    buildingId: 'contoh-gedung',
    coordinates: [],
    distanceM: action === 'straight' ? 25 : 0,
  };
  const sample = SAMPLE[language];
  return instructionText(step, {
    templates: { [action]: text } as Record<InstructionAction, InstructionText>,
    language,
    floors: [SAMPLE_FLOOR],
    buildings: [{ id: 'contoh-gedung', name: sample.building }],
    origin: sample.origin,
    destination: sample.destination,
  });
}
