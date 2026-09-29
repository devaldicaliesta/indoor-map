import { LanguageCodeSchema, type SystemSettings, type SystemSettingsPatch } from '@indoor/domain';
import type { Tables, TablesUpdate } from '../database.types';
import { DataError, toDataError } from '../errors';
import type { Db } from '../supabase';

const COLUMNS =
  'public_visitor_url, smtp_host, smtp_port, smtp_username, smtp_from, default_timezone, default_language, updated_at';

export type SystemSettingsRow = Omit<Tables<'system_settings'>, 'id'>;

export function mapSystemSettingsRow(row: SystemSettingsRow): SystemSettings {
  return {
    publicVisitorUrl: row.public_visitor_url,
    smtpHost: row.smtp_host,
    smtpPort: row.smtp_port,
    smtpUsername: row.smtp_username,
    smtpFrom: row.smtp_from,
    defaultTimezone: row.default_timezone,
    defaultLanguage: LanguageCodeSchema.parse(row.default_language),
    updatedAt: row.updated_at,
  };
}

export function toSystemSettingsUpdate(
  patch: SystemSettingsPatch,
): TablesUpdate<'system_settings'> {
  const update: TablesUpdate<'system_settings'> = {};
  if (patch.publicVisitorUrl !== undefined) update.public_visitor_url = patch.publicVisitorUrl;
  if (patch.smtpHost !== undefined) update.smtp_host = patch.smtpHost;
  if (patch.smtpPort !== undefined) update.smtp_port = patch.smtpPort;
  if (patch.smtpUsername !== undefined) update.smtp_username = patch.smtpUsername;
  if (patch.smtpFrom !== undefined) update.smtp_from = patch.smtpFrom;
  if (patch.defaultTimezone !== undefined) update.default_timezone = patch.defaultTimezone;
  if (patch.defaultLanguage !== undefined) update.default_language = patch.defaultLanguage;
  return update;
}

export interface SystemSettingsRepository {
  get(): Promise<SystemSettings>;
  update(patch: SystemSettingsPatch): Promise<SystemSettings>;
}

// Baris pengaturan selalu ada (satu per instalasi), jadi baris yang tidak
// terlihat atau tidak berubah selalu berarti pengguna tidak berhak.
export function createSystemSettingsRepository(db: Db): SystemSettingsRepository {
  return {
    async get() {
      const { data, error } = await db
        .from('system_settings')
        .select(COLUMNS)
        .eq('id', true)
        .maybeSingle();
      if (error) throw toDataError(error);
      if (!data) throw new DataError('forbidden');
      return mapSystemSettingsRow(data);
    },

    async update(patch) {
      const { data, error } = await db
        .from('system_settings')
        .update(toSystemSettingsUpdate(patch))
        .eq('id', true)
        .select(COLUMNS);
      if (error) throw toDataError(error);
      const row = data[0];
      if (!row) throw new DataError('forbidden');
      return mapSystemSettingsRow(row);
    },
  };
}
