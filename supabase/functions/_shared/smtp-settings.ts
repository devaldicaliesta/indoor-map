// SMTP dari Pengaturan Sistem: kolom di system_settings, password dari Vault
// lewat fungsi khusus service role. Dipakai email uji dan email Auth (reset, undangan).
import { serviceHeaders, url } from './auth.ts';
import type { SmtpConfig } from './smtp.ts';

interface SmtpRow {
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_from: string | null;
}

/** `null` bila host, port, atau pengirim belum diisi di Pengaturan → Sistem. */
export async function loadSmtpConfig(): Promise<SmtpConfig | null> {
  const [settingsResponse, passwordResponse] = await Promise.all([
    fetch(`${url}/rest/v1/system_settings?select=smtp_host,smtp_port,smtp_username,smtp_from`, {
      headers: serviceHeaders,
    }),
    fetch(`${url}/rest/v1/rpc/smtp_password_for_sending`, {
      method: 'POST',
      headers: serviceHeaders,
    }),
  ]);
  const [row] = settingsResponse.ok ? ((await settingsResponse.json()) as SmtpRow[]) : [];
  const password = passwordResponse.ok ? ((await passwordResponse.json()) as string | null) : null;
  if (!row?.smtp_host || !row.smtp_port || !row.smtp_from) return null;
  return {
    host: row.smtp_host,
    port: row.smtp_port,
    username: row.smtp_username,
    password,
    from: row.smtp_from,
  };
}
