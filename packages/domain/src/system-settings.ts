import type { LanguageCode } from './language';

/** Pengaturan satu instalasi (FR-SYS-01). Password SMTP tidak pernah disimpan di sini. */
export interface SystemSettings {
  publicVisitorUrl: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUsername: string | null;
  smtpFrom: string | null;
  defaultTimezone: string;
  defaultLanguage: LanguageCode;
  updatedAt: string;
}

export type SystemSettingsPatch = Partial<Omit<SystemSettings, 'updatedAt'>>;
