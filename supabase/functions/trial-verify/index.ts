// Edge Function trial-verify (T-614b): halaman verifikasi landing mengirim token dari email.
// KHUSUS SERVER VENDOR — tidak ikut paket instalasi klien (lihat .dockerignore).
//
// Keputusan diambil SQL (`hosting_request_verify`, migrasi 0048): token tidak sah/kedaluwarsa,
// ditolak (blokir/duplikat), antre (kapasitas penuh), atau dibuatkan ruang kerja (activate.ts).
// Balasan hanya berisi hasil dan tautan publik — tidak ada rincian galat ke pemohon.
// Rahasia lingkungan: lihat activate.ts; TRIAL_ALLOWED_ORIGIN (bawaan *).
import { createRateLimiter } from '../../../packages/domain/src/trial-request.ts';
import { sha256Hex } from '../_shared/token.ts';
import { trialEnv } from '../_shared/trial-mail.ts';
import { activate, getRequest, logError, rpc, send } from './activate.ts';
import { queuedMail, vendorMail } from './mails.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': trialEnv('TRIAL_ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Token 256 bit tidak bisa ditebak; batas ini hanya meredam kiriman beruntun.
const allow = createRateLimiter(20, 60_000);

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { message: 'Metode tidak didukung.' });
  const ip =
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ||
    'unknown';
  if (!allow(ip)) {
    return json(429, {
      code: 'rate_limited',
      message: 'Terlalu banyak percobaan. Coba lagi nanti.',
    });
  }
  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return json(200, { outcome: 'invalid' });

  try {
    const [decision] = await rpc<{ request_id: string | null; outcome: string }[]>(
      'hosting_request_verify',
      { p_token_hash: await sha256Hex(token) },
    );
    if (!decision?.request_id || !['queued', 'provision'].includes(decision.outcome)) {
      return json(200, { outcome: decision?.outcome ?? 'invalid' });
    }
    const found = await getRequest(decision.request_id);
    if (!found) return json(200, { outcome: 'invalid' });
    if (decision.outcome === 'queued') {
      await send(queuedMail(found));
      await send(vendorMail('queued', found, 'Kapasitas trial penuh.'));
      return json(200, { outcome: 'queued' });
    }
    return json(200, await activate(found, { notifyQueued: true }));
  } catch (error) {
    logError('trial-verify', error instanceof Error ? error.message : String(error));
    return json(500, { code: 'unknown', message: 'Verifikasi belum bisa diproses. Coba lagi.' });
  }
});
