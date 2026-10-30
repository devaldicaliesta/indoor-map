import { LanguageCodeSchema, type SystemSettings, type SystemSettingsPatch } from '@indoor/domain';
import type { Tables, TablesUpdate } from '../database.types';
import { DataError, toDataError } from '../errors';
import { fromFunctionError } from '../functions';
import type { Db } from '../supabase';

const COLUMNS =
  'public_visitor_url, smtp_host, smtp_port, smtp_username, smtp_from, default_timezone, default_language, basemap_tile_url, basemap_attribution, audit_retention_days, updated_at';

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
    basemapTileUrl: row.basemap_tile_url,
    basemapAttribution: row.basemap_attribution,
    auditRetentionDays: row.audit_retention_days,
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
  if (patch.basemapTileUrl !== undefined) update.basemap_tile_url = patch.basemapTileUrl;
  if (patch.basemapAttribution !== undefined) update.basemap_attribution = patch.basemapAttribution;
  if (patch.auditRetentionDays !== undefined)
    update.audit_retention_days = patch.auditRetentionDays;
  return update;
}

export interface SystemSettingsRepository {
  get(): Promise<SystemSettings>;
  /** URL publik Visitor untuk QR; bisa dibaca semua staf, tidak seperti pengaturan lainnya. */
  publicVisitorUrl(): Promise<string | null>;
  update(patch: SystemSettingsPatch): Promise<SystemSettings>;
  /** Password SMTP ada di Vault; nilainya tidak pernah dikirim ke klien. */
  smtpPasswordIsSet(): Promise<boolean>;
  /** String kosong menghapus password. */
  setSmtpPassword(password: string): Promise<void>;
  /** Mengirim email uji ke Super Admin yang sedang masuk; mengembalikan alamat tujuan. */
  sendTestEmail(): Promise<string>;
}

// Baris pengaturan selalu ada (satu per instalasi), jadi baris yang tidak
// terlihat atau tidak berubah selalu berarti pengguna tidak berhak.
export function createSystemSettingsRepository(db: Db): SystemSettingsRepository {
  return {
    async publicVisitorUrl() {
      const { data, error } = await db.rpc('public_visitor_url');
      if (error) throw toDataError(error);
      return data || null;
    },
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

    async smtpPasswordIsSet() {
      const { data, error } = await db.rpc('smtp_password_is_set');
      if (error) throw toDataError(error);
      return data === true;
    },

    async setSmtpPassword(password) {
      const { error } = await db.rpc('set_smtp_password', { p_password: password });
      if (error) throw toDataError(error);
    },

    async sendTestEmail() {
      const { data, error } = await db.functions.invoke<{ sentTo: string }>('system-settings', {
        body: { action: 'send_test_email' },
      });
      if (error) throw await fromFunctionError(error);
      return data?.sentTo ?? '';
    },
  };
}
