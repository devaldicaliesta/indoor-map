import {
  brandingJson,
  DISPLAY_MODES,
  type DisplayMode,
  type DisplaySettings,
  type DisplaySettingsPatch,
  parseBranding,
  parseCamera,
  parseColors,
  parseHeights,
  type VenueId,
  VenueIdSchema,
} from '@indoor/domain';
import type { Tables, TablesUpdate } from '../database.types';
import { DataError, toDataError } from '../errors';
import { zeroRowsError } from '../mutations';
import type { Db } from '../supabase';

const COLUMNS = 'venue_id, default_mode, heights, colors, camera, branding';

type DisplaySettingsRow = Pick<
  Tables<'display_settings'>,
  'venue_id' | 'default_mode' | 'heights' | 'colors' | 'camera' | 'branding'
>;

export function mapDisplaySettingsRow(row: DisplaySettingsRow): DisplaySettings {
  return {
    venueId: VenueIdSchema.parse(row.venue_id),
    defaultMode: (DISPLAY_MODES as readonly string[]).includes(row.default_mode)
      ? (row.default_mode as DisplayMode)
      : '2d',
    heights: parseHeights(row.heights),
    colors: parseColors(row.colors),
    camera: parseCamera(row.camera),
    branding: parseBranding(row.branding),
  };
}

export function toDisplaySettingsUpdate(
  patch: DisplaySettingsPatch,
): TablesUpdate<'display_settings'> {
  const update: TablesUpdate<'display_settings'> = {};
  if (patch.defaultMode !== undefined) update.default_mode = patch.defaultMode;
  if (patch.heights !== undefined) update.heights = patch.heights;
  if (patch.colors !== undefined) update.colors = patch.colors;
  if (patch.camera !== undefined) update.camera = patch.camera;
  if (patch.branding !== undefined) update.branding = brandingJson(patch.branding);
  return update;
}

export interface DisplaySettingsRepository {
  /** Barisnya dibuat trigger saat venue dibuat. */
  get(venueId: VenueId): Promise<DisplaySettings>;
  /** Hanya Admin dan Super Admin (RLS `app.can_manage()`). `camera: null` menghapus kamera awal. */
  update(venueId: VenueId, patch: DisplaySettingsPatch): Promise<DisplaySettings>;
}

export function createDisplaySettingsRepository(db: Db): DisplaySettingsRepository {
  async function isVisible(venueId: VenueId) {
    const { data } = await db
      .from('display_settings')
      .select('venue_id')
      .eq('venue_id', venueId)
      .maybeSingle();
    return data !== null;
  }

  return {
    async get(venueId) {
      const { data, error } = await db
        .from('display_settings')
        .select(COLUMNS)
        .eq('venue_id', venueId)
        .maybeSingle();
      if (error) throw toDataError(error);
      if (!data)
        throw new DataError('not_found', { message: 'Pengaturan tampilan tidak ditemukan.' });
      return mapDisplaySettingsRow(data);
    },

    async update(venueId, patch) {
      const { data, error } = await db
        .from('display_settings')
        .update(toDisplaySettingsUpdate(patch))
        .eq('venue_id', venueId)
        .select(COLUMNS);
      if (error) throw toDataError(error);
      const row = data[0];
      if (!row) throw await zeroRowsError(() => isVisible(venueId));
      return mapDisplaySettingsRow(row);
    },
  };
}
