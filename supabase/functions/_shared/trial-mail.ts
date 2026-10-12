// Email trial ter-hosting (`trial-request`, `trial-verify`): SMTP dari rahasia lingkungan server
// vendor (mis. App Password Gmail), tidak di repo. NFR-HT-05: ≤ 500 email per hari.
//   TRIAL_SMTP_HOST, TRIAL_SMTP_PORT, TRIAL_SMTP_USERNAME, TRIAL_SMTP_PASSWORD, TRIAL_SMTP_FROM,
//   TRIAL_VENDOR_EMAIL (bawaan panduarahid@gmail.com)
import { escapeHtml, VENDOR_EMAIL } from './email-layout.ts';
import type { SmtpConfig } from './smtp.ts';

export const trialEnv = (name: string) => Deno.env.get(name)?.trim() ?? '';

export const trialVendorEmail = trialEnv('TRIAL_VENDOR_EMAIL') || VENDOR_EMAIL;

export function trialSmtpConfig(): SmtpConfig | null {
  const host = trialEnv('TRIAL_SMTP_HOST');
  const from = trialEnv('TRIAL_SMTP_FROM');
  if (!host || !from) return null;
  return {
    host,
    port: Number(trialEnv('TRIAL_SMTP_PORT') || 587),
    username: trialEnv('TRIAL_SMTP_USERNAME') || null,
    password: trialEnv('TRIAL_SMTP_PASSWORD') || null,
    from,
  };
}

export const paragraph = (line: string) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`;

/** Tombol tautan email; teks dan URL di-escape. */
export const button = (label: string, href: string) =>
  `<p style="margin:20px 0"><a href="${escapeHtml(href)}" style="background:#0b6bcb;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${escapeHtml(label)}</a></p>`;

/** Tabel rincian untuk email vendor; semua isian di-escape (HTML tampil sebagai teks). */
export function detailsTable(rows: readonly (readonly [string, string])[]): string {
  return `<table style="border-collapse:collapse">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#545b64">${escapeHtml(label)}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join('')}</table>`;
}
