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
   * tanpa baris berisi teks kosong).
   */
  get(venueId: VenueId): Promise<Record<InstructionAction, InstructionText>>;
  /** Simpan teks satu aksi. Tidak ada penghapusan: setiap aksi selalu punya teks. */
  update(venueId: VenueId, action: InstructionAction, text: InstructionText): Promise<void>;
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
    async update(venueId, action, text) {
      // Upsert, karena venue lama bisa belum punya baris untuk aksi ini.
      const { error } = await db
        .from('instruction_templates')
        .upsert({ venue_id: venueId, action, text_id: text.id, text_en: text.en });
      if (error) throw toDataError(error);
    },
  };
}
