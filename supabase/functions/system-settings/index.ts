// Edge Function system-settings (T-010): kirim email uji memakai SMTP dari Pengaturan Sistem.
// Password SMTP dibaca dari Vault lewat fungsi khusus service role, tidak pernah ke klien.
import {
  CORS_HEADERS,
  fail,
  reply,
  requireSuperAdmin,
  serviceHeaders,
  url,
} from '../_shared/auth.ts';
import { SmtpError, sendMail } from '../_shared/smtp.ts';

interface SmtpSettings {
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_from: string | null;
}

async function loadSmtp(): Promise<{ settings: SmtpSettings; password: string | null }> {
  const [settingsResponse, passwordResponse] = await Promise.all([
    fetch(`${url}/rest/v1/system_settings?select=smtp_host,smtp_port,smtp_username,smtp_from`, {
      headers: serviceHeaders,
    }),
    fetch(`${url}/rest/v1/rpc/smtp_password_for_sending`, {
      method: 'POST',
      headers: serviceHeaders,
    }),
  ]);
  const [settings] = (await settingsResponse.json()) as SmtpSettings[];
  const password = passwordResponse.ok ? ((await passwordResponse.json()) as string | null) : null;
  return {
    settings: settings ?? {
      smtp_host: null,
      smtp_port: null,
      smtp_username: null,
      smtp_from: null,
    },
    password,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return fail(405, 'invalid', 'Metode tidak didukung.');

  const caller = await requireSuperAdmin(request, 'mengirim email uji');
  if (caller instanceof Response) return caller;

  const { action } = ((await request.json().catch(() => ({}))) ?? {}) as { action?: string };
  if (action !== 'send_test_email') return fail(400, 'invalid', 'Aksi tidak dikenal.');

  const { settings, password } = await loadSmtp();
  if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_from) {
    return fail(
      400,
      'invalid',
      'Lengkapi host, port, dan alamat pengirim SMTP, lalu simpan sebelum mengirim email uji.',
    );
  }

  try {
    await sendMail(
      {
        host: settings.smtp_host,
        port: settings.smtp_port,
        username: settings.smtp_username,
        password,
        from: settings.smtp_from,
      },
      {
        to: caller.email,
        subject: 'Email uji Admin Indoor Map',
        text: 'Pengaturan SMTP berhasil. Email dari sistem (misalnya reset password) bisa dikirim.',
      },
    );
  } catch (error) {
    if (error instanceof SmtpError) return fail(502, `smtp_${error.reason}`, error.message);
    return fail(502, 'smtp_rejected', 'Email uji gagal dikirim karena kesalahan tak terduga.');
  }
  return reply(200, { sentTo: caller.email });
});
