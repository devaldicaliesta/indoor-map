import {
  type InstructionAction,
  type InstructionText,
  snapshotInstructionTemplates,
  type VenueId,
} from '@indoor/domain';
import { toDataError } from '../errors';
import type { Db } from '../supabase';

export interface InstructionTemplatesRepository {
  /**
   * Teks instruksi ID/EN venue untuk ke-15 aksi, dengan aturan yang sama dengan snapshot (aksi
   * tanpa baris berisi teks kosong). Pengubahannya dibuat di T-210.
   */
  get(venueId: VenueId): Promise<Record<InstructionAction, InstructionText>>;
}

export function createInstructionTemplatesRepository(db: Db): InstructionTemplatesRepository {
  return {
    async get(venueId) {
      const { data, error } = await db
        .from('instruction_templates')
        .select('action, text_id, text_en')
        .eq('venue_id', venueId);
      if (error) throw toDataError(error);
      return snapshotInstructionTemplates(
        (data ?? []).map((row) => ({ action: row.action, id: row.text_id, en: row.text_en })),
      );
    },
  };
}
