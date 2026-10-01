// Edge Function system-settings: kirim email uji memakai SMTP dari Pengaturan Sistem.
// Password SMTP dibaca dari Vault lewat fungsi khusus service role, tidak pernah ke klien.
import { CORS_HEADERS, fail, reply, requireSuperAdmin } from '../_shared/auth.ts';
import { SmtpError, sendMail } from '../_shared/smtp.ts';
import { loadSmtpConfig } from '../_shared/smtp-settings.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return fail(405, 'invalid', 'Metode tidak didukung.');

  const caller = await requireSuperAdmin(request, 'mengirim email uji');
  if (caller instanceof Response) return caller;

  const { action } = ((await request.json().catch(() => ({}))) ?? {}) as { action?: string };
  if (action !== 'send_test_email') return fail(400, 'invalid', 'Aksi tidak dikenal.');

  const smtp = await loadSmtpConfig();
  if (!smtp) {
    return fail(
      400,
      'invalid',
      'Lengkapi host, port, dan alamat pengirim SMTP, lalu simpan sebelum mengirim email uji.',
    );
  }

  try {
    await sendMail(smtp, {
      to: caller.email,
      subject: 'Email uji Admin Indoor Map',
      text: 'Pengaturan SMTP berhasil. Email dari sistem (misalnya reset password) bisa dikirim.',
    });
  } catch (error) {
    if (error instanceof SmtpError) return fail(502, `smtp_${error.reason}`, error.message);
    return fail(502, 'smtp_rejected', 'Email uji gagal dikirim karena kesalahan tak terduga.');
  }
  return reply(200, { sentTo: caller.email });
});
