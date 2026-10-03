import {
  checkBasemapTileUrl,
  checkPublicVisitorUrl,
  isValidPort,
  isValidTimezone,
  type LanguageCode,
  type SystemSettings,
  type SystemSettingsPatch,
} from '@indoor/domain';

export interface SystemFormValues {
  publicVisitorUrl: string;
  defaultTimezone: string;
  defaultLanguage: LanguageCode;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpFrom: string;
  basemapTileUrl: string;
  basemapAttribution: string;
}

export type SystemFormErrors = Partial<Record<keyof SystemFormValues, string>>;

export function toFormValues(settings: SystemSettings): SystemFormValues {
  return {
    publicVisitorUrl: settings.publicVisitorUrl ?? '',
    defaultTimezone: settings.defaultTimezone,
    defaultLanguage: settings.defaultLanguage,
    smtpHost: settings.smtpHost ?? '',
    smtpPort: settings.smtpPort?.toString() ?? '',
    smtpUsername: settings.smtpUsername ?? '',
    smtpPassword: '',
    smtpFrom: settings.smtpFrom ?? '',
    basemapTileUrl: settings.basemapTileUrl ?? '',
    basemapAttribution: settings.basemapAttribution ?? '',
  };
}

const URL_MESSAGES = {
  invalid: 'Isi alamat lengkap, misalnya https://peta.rs-harapan.id.',
  not_https: 'Gunakan https agar QR dan tautan bagikan aman.',
  trailing_slash: 'Hapus garis miring (/) di akhir alamat.',
  has_query: 'Alamat tidak boleh berisi ? atau #.',
} as const;

const BASEMAP_MESSAGES = {
  invalid: 'Isi URL tile lengkap, misalnya https://tile.openstreetmap.org/{z}/{x}/{y}.png.',
  not_https: 'Gunakan https; http hanya untuk server tile di localhost.',
  missing_placeholders: 'URL tile harus memuat {z}, {x}, dan {y}.',
} as const;

const EMAIL_IN_FROM = /^(?:[^<>]*<)?[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>?$/;

export function validate(values: SystemFormValues): SystemFormErrors {
  const errors: SystemFormErrors = {};
  const url = values.publicVisitorUrl.trim();
  const problem = url ? checkPublicVisitorUrl(url) : null;
  if (problem) errors.publicVisitorUrl = URL_MESSAGES[problem];
  if (!isValidTimezone(values.defaultTimezone))
    errors.defaultTimezone = 'Pilih zona waktu dari daftar.';
  if (values.smtpPort.trim() && !isValidPort(Number(values.smtpPort))) {
    errors.smtpPort = 'Port antara 1 dan 65535, biasanya 587 atau 465.';
  }
  if (values.smtpFrom.trim() && !EMAIL_IN_FROM.test(values.smtpFrom.trim())) {
    errors.smtpFrom = 'Contoh: Peta RS Harapan <noreply@rs-harapan.id>';
  }
  const tiles = values.basemapTileUrl.trim();
  const tileProblem = tiles ? checkBasemapTileUrl(tiles) : null;
  if (tileProblem) errors.basemapTileUrl = BASEMAP_MESSAGES[tileProblem];
  if (tiles && !values.basemapAttribution.trim()) {
    errors.basemapAttribution =
      'Tulis atribusi penyedia tile, misalnya © OpenStreetMap contributors.';
  }
  return errors;
}

const orNull = (value: string) => (value.trim() ? value.trim() : null);

export function toPatch(values: SystemFormValues): SystemSettingsPatch {
  return {
    publicVisitorUrl: orNull(values.publicVisitorUrl),
    defaultTimezone: values.defaultTimezone,
    defaultLanguage: values.defaultLanguage,
    smtpHost: orNull(values.smtpHost),
    smtpPort: values.smtpPort.trim() ? Number(values.smtpPort) : null,
    smtpUsername: orNull(values.smtpUsername),
    smtpFrom: orNull(values.smtpFrom),
    basemapTileUrl: orNull(values.basemapTileUrl),
    basemapAttribution: orNull(values.basemapAttribution),
  };
}
