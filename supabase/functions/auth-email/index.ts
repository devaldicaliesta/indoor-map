// Edge Function auth-email (T-010, FR-SYS-01): Auth Hook "send email" GoTrue. Email Auth
// (reset password, undangan) dikirim memakai SMTP dari Pengaturan Sistem, sehingga server
// email cukup diatur Super Admin di Admin tanpa mengubah konfigurasi server atau restart.
import { SmtpError, sendMail } from '../_shared/smtp.ts';
import { loadSmtpConfig } from '../_shared/smtp-settings.ts';
import { verifyWebhook } from '../_shared/webhook.ts';
import { renderAuthEmail } from './templates.ts';

const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '';

interface HookPayload {
  user: { email: string; new_email?: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

/** GoTrue meneruskan `message` ke klien bila hook membalas objek `error`. */
function hookError(httpCode: number, message: string): Response {
  return new Response(JSON.stringify({ error: { http_code: httpCode, message } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Tautan verifikasi GoTrue, sama dengan `{{ .ConfirmationURL }}` di template bawaan.
 * `site_url` berisi URL eksternal API Auth (`…/auth/v1`); bila tanpa path, path ditambahkan.
 */
function verifyLink(data: HookPayload['email_data'], tokenHash: string): string {
  const query = new URLSearchParams({
    token: tokenHash,
    type: data.email_action_type,
    redirect_to: data.redirect_to,
  });
  const base = data.site_url.replace(/\/+$/, '');
  const api = base.endsWith('/auth/v1') ? base : `${base}/auth/v1`;
  return `${api}/verify?${query}`;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Metode tidak didukung.', { status: 405 });
  const body = await request.text();
  if (!(await verifyWebhook(request.headers, body, hookSecret))) {
    return new Response('Tanda tangan hook tidak sah.', { status: 401 });
  }
  const { user, email_data: data } = JSON.parse(body) as HookPayload;

  const smtp = await loadSmtpConfig();
  if (!smtp) {
    return hookError(
      500,
      'Server email belum diatur. Minta Super Admin mengisi SMTP di Pengaturan → Sistem.',
    );
  }

  // Perubahan email dengan konfirmasi ganda: satu email ke alamat lama, satu ke alamat baru.
  const messages = [{ to: user.email, tokenHash: data.token_hash, code: data.token }];
  if (data.email_action_type === 'email_change' && user.new_email && data.token_hash_new) {
    messages.push({
      to: user.new_email,
      tokenHash: data.token_hash_new,
      code: data.token_new ?? '',
    });
  }

  try {
    for (const message of messages) {
      const email = renderAuthEmail(data.email_action_type, {
        email: message.to,
        link: verifyLink(data, message.tokenHash),
        code: message.code,
      });
      await sendMail(smtp, { to: message.to, ...email });
    }
  } catch (error) {
    const reason = error instanceof SmtpError ? error.message : 'Kesalahan tak terduga.';
    return hookError(500, `Email tidak terkirim. ${reason} Hubungi Super Admin.`);
  }
  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
});
