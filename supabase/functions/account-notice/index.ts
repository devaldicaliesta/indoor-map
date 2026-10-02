// Edge Function account-notice: mengirim pemberitahuan akun (saat ini: akun terkunci) yang
// dicatat Auth Hook penguncian di tabel account_notices. Dipanggil database lewat pg_net
// dengan id pemberitahuan saja; fungsi hanya mengirim baris yang ada dan belum terkirim,
// sehingga pemanggil tanpa akses database tidak bisa memicu email ke alamat pilihannya.
import { serviceHeaders, url } from '../_shared/auth.ts';
import { sendMail } from '../_shared/smtp.ts';
import { loadSmtpConfig } from '../_shared/smtp-settings.ts';
import { renderAccountNotice } from './template.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface NoticeRow {
  id: string;
  kind: string;
  profiles: { email: string; full_name: string } | null;
}

function text(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain' } });
}

function logError(message: string) {
  // biome-ignore lint/suspicious/noConsole: log Edge Runtime satu-satunya tempat rincian SMTP; balasan ke pemanggil sengaja umum.
  console.error(`account-notice: ${message}`);
}

// Balasan seragam: pemanggil tanpa JWT tidak perlu tahu keadaan baris atau server email.
const accepted = () => text(202, 'Diterima.');

async function claim(id: string): Promise<NoticeRow | null> {
  // Menandai terkirim lebih dulu secara atomik agar dua panggilan serentak tidak mengirim dua kali.
  const query = new URLSearchParams({
    id: `eq.${id}`,
    sent_at: 'is.null',
    select: 'id,kind,profiles(email,full_name)',
  });
  const response = await fetch(`${url}/rest/v1/account_notices?${query}`, {
    method: 'PATCH',
    headers: { ...serviceHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({ sent_at: new Date().toISOString() }),
  });
  if (!response.ok) {
    logError(`klaim ${id} gagal (${response.status})`);
    return null;
  }
  const [row] = (await response.json()) as NoticeRow[];
  return row ?? null;
}

async function release(id: string) {
  const response = await fetch(`${url}/rest/v1/account_notices?id=eq.${id}`, {
    method: 'PATCH',
    headers: serviceHeaders,
    body: JSON.stringify({ sent_at: null }),
  });
  if (!response.ok) logError(`gagal mengembalikan ${id} ke antrean`);
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return text(405, 'Metode tidak didukung.');
  const { id } = (await request.json().catch(() => ({}))) as { id?: unknown };
  if (typeof id !== 'string' || !UUID.test(id)) return text(400, 'id tidak sah.');

  const notice = await claim(id);
  if (!notice?.profiles) return accepted();

  try {
    const smtp = await loadSmtpConfig();
    if (!smtp) throw new Error('server email belum diatur');
    await sendMail(smtp, {
      to: notice.profiles.email,
      ...renderAccountNotice(notice.kind, notice.profiles.full_name),
    });
  } catch (error) {
    // Rincian SMTP hanya ke log server; pemberitahuan kembali ke antrean untuk dikirim ulang.
    logError(`${id} tidak terkirim: ${error instanceof Error ? error.message : error}`);
    await release(id);
  }
  return accepted();
});
