// Edge Function trial-verify (T-614b): halaman verifikasi landing mengirim token dari email.
// KHUSUS SERVER VENDOR — tidak ikut paket instalasi klien (lihat .dockerignore).
//
// Keputusan diambil SQL (`hosting_request_verify`, migrasi 0048): token tidak sah/kedaluwarsa,
// ditolak (blokir/duplikat), antre (kapasitas penuh), atau dibuatkan ruang kerja (provision.ts).
// Balasan hanya berisi hasil dan tautan publik — tidak ada rincian galat ke pemohon.
//
// Rahasia lingkungan (tidak di repo): SMTP trial (`_shared/trial-mail.ts`),
//   TRIAL_ADMIN_URL (bawaan https://admin.panduarah.my.id),
//   TRIAL_VISITOR_URL (bawaan https://app.panduarah.my.id),
//   TRIAL_ALLOWED_ORIGIN (bawaan *).
import { createRateLimiter } from '../../../packages/domain/src/trial-request.ts';
import { serviceHeaders, url } from '../_shared/auth.ts';
import { sendMail } from '../_shared/smtp.ts';
import { sha256Hex } from '../_shared/token.ts';
import { trialEnv, trialSmtpConfig } from '../_shared/trial-mail.ts';
import { activeMail, queuedMail, vendorMail } from './mails.ts';
import { passwordLink, provisionTrial, type TrialRequest } from './provision.ts';

const adminUrl = trialEnv('TRIAL_ADMIN_URL') || 'https://admin.panduarah.my.id';
const visitorUrl = (trialEnv('TRIAL_VISITOR_URL') || 'https://app.panduarah.my.id').replace(
  /\/+$/,
  '',
);
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

function logError(message: string) {
  // biome-ignore lint/suspicious/noConsole: log Edge Runtime satu-satunya tempat rincian galat; balasan ke pemohon sengaja umum.
  console.error(`trial-verify: ${message}`);
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error(`${fn}: ${response.status} ${await response.text()}`);
  return (await response.json()) as T;
}

/** Email dikirim sebaik mungkin: kegagalan SMTP dicatat, hasil verifikasi tetap dibalas. */
async function send(message: Parameters<typeof sendMail>[1]) {
  const config = trialSmtpConfig();
  if (!config) return logError('TRIAL_SMTP_HOST/TRIAL_SMTP_FROM belum diatur');
  await sendMail(config, message).catch((error: unknown) =>
    logError(`email ke ${message.to}: ${error instanceof Error ? error.message : String(error)}`),
  );
}

async function activate(request: TrialRequest): Promise<Response> {
  try {
    const workspace = await provisionTrial(request);
    const visitor = `${visitorUrl}/v/${workspace.slug}`;
    await send(
      activeMail(request, workspace, {
        password: await passwordLink(request.email, adminUrl),
        admin: adminUrl,
        visitor,
      }),
    );
    await send(
      vendorMail(
        'active',
        request,
        `${visitor}${workspace.published ? '' : ' (publish pertama gagal; pemohon menerbitkan sendiri)'}`,
      ),
    );
    return json(200, { outcome: 'active', adminUrl, visitorUrl: visitor });
  } catch (error) {
    // Slot dilepas ke antrean; siklus hidup (T-615) mencoba lagi. Pemohon diberi tahu antre.
    logError(error instanceof Error ? error.message : String(error));
    await rpc('hosting_request_requeue', { p_request_id: request.id }).catch(() => undefined);
    await send(queuedMail(request));
    await send(vendorMail('failed', request, error instanceof Error ? error.message : 'galat'));
    return json(200, { outcome: 'queued' });
  }
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
    const [found] = await rpc<TrialRequest[]>('hosting_request_get', {
      p_request_id: decision.request_id,
    });
    if (!found) return json(200, { outcome: 'invalid' });
    if (decision.outcome === 'queued') {
      await send(queuedMail(found));
      await send(vendorMail('queued', found, 'Kapasitas trial penuh.'));
      return json(200, { outcome: 'queued' });
    }
    return await activate(found);
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    return json(500, { code: 'unknown', message: 'Verifikasi belum bisa diproses. Coba lagi.' });
  }
});
