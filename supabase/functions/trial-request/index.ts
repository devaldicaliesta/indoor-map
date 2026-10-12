// Edge Function trial-request: form "Minta trial" di landing page vendor. KHUSUS SERVER VENDOR —
// tidak ikut paket instalasi klien (lihat .dockerignore).
//
// Trial ter-hosting (F2-K, T-614): isian diperiksa (aturan yang sama dengan landing), honeypot
// dan kiriman beruntun (> 5 per menit per alamat IP) ditolak, lalu permintaan disimpan bersama
// HASH token verifikasi dan pemohon menerima email berisi tautan verifikasi (berlaku 24 jam,
// sekali pakai). Blokir, duplikat, dan kapasitas diputuskan saat tautan diklik (`trial-verify`),
// sehingga balasan di sini tidak membocorkan apakah sebuah email pernah trial.
//
// Rahasia lingkungan (tidak di repo): SMTP trial (`_shared/trial-mail.ts`), TRIAL_VERIFY_URL
// (halaman hasil verifikasi di landing, bawaan https://panduarah.my.id/trial/verifikasi),
// TRIAL_ALLOWED_ORIGIN (bawaan *).

import {
  checkHostedTrialRequest,
  createRateLimiter,
  HOSTED_TRIAL_DAYS,
  type HostedTrialRequestInput,
} from '../../../packages/domain/src/trial-request.ts';
import { serviceHeaders, url } from '../_shared/auth.ts';
import { EMAIL_LOGO, emailHtml, emailText, VENDOR_EMAIL } from '../_shared/email-layout.ts';
import { sendMail } from '../_shared/smtp.ts';
import { newToken, sha256Hex } from '../_shared/token.ts';
import { button, paragraph, trialEnv, trialSmtpConfig } from '../_shared/trial-mail.ts';

const verifyUrl = trialEnv('TRIAL_VERIFY_URL') || 'https://panduarah.my.id/trial/verifikasi';
const corsHeaders = {
  'Access-Control-Allow-Origin': trialEnv('TRIAL_ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Satu worker melayani banyak permintaan; batas ini menahan kiriman beruntun dari satu alamat.
const allow = createRateLimiter(5, 60_000);

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function logError(message: string) {
  // biome-ignore lint/suspicious/noConsole: log Edge Runtime satu-satunya tempat rincian galat; balasan ke pemohon sengaja umum.
  console.error(`trial-request: ${message}`);
}

/** Email verifikasi dalam bahasa yang dipilih di landing page. */
function verificationMail(input: HostedTrialRequestInput, link: string) {
  const en = input.language === 'en';
  const subject = en ? 'Confirm your PanduArah trial' : 'Konfirmasi trial PanduArah Anda';
  const before = en
    ? [
        `Hello ${input.name},`,
        `Click the button below to start your ${HOSTED_TRIAL_DAYS}-day PanduArah trial for ${input.institution}. Your workspace (Admin and Visitor) is ready within a minute.`,
      ]
    : [
        `Halo ${input.name},`,
        `Klik tombol di bawah untuk memulai trial PanduArah ${HOSTED_TRIAL_DAYS} hari untuk ${input.institution}. Ruang kerja Anda (Admin dan Visitor) siap dalam satu menit.`,
      ];
  const action = en ? 'Start trial' : 'Mulai trial';
  const after = en
    ? [
        'This link is valid for 24 hours and can be used once. If you did not request a trial, ignore this email.',
        `Questions? Reply to ${VENDOR_EMAIL}.`,
      ]
    : [
        'Tautan berlaku 24 jam dan hanya bisa dipakai sekali. Bila Anda tidak meminta trial, abaikan email ini.',
        `Ada pertanyaan? Hubungi ${VENDOR_EMAIL}.`,
      ];
  return {
    to: input.email,
    subject,
    text: emailText([...before, `${action}: ${link}`, ...after].join('\n\n')),
    html: emailHtml(
      [...before.map(paragraph), button(action, link), ...after.map(paragraph)].join(''),
    ),
    inline: [EMAIL_LOGO],
  };
}

/** Menyimpan permintaan beserta hash token; token aslinya hanya ada di email pemohon. */
async function storeRequest(input: HostedTrialRequestInput, ip: string, tokenHash: string) {
  const response = await fetch(`${url}/rest/v1/rpc/hosting_request_create`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({ p_request: input, p_ip: ip, p_token_hash: tokenHash }),
  });
  if (!response.ok) throw new Error(`permintaan gagal disimpan: ${await response.text()}`);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { message: 'Metode tidak didukung.' });
  // Alamat dari proxy (X-Real-IP, atau entri terakhir X-Forwarded-For yang ditambahkan proxy);
  // entri pertama X-Forwarded-For bisa dikarang pengirim sehingga tidak dipakai.
  const ip =
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ||
    'unknown';
  if (!allow(ip)) {
    return json(429, {
      code: 'rate_limited',
      message: 'Terlalu banyak kiriman. Coba lagi sebentar lagi.',
    });
  }
  const input = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!input || typeof input !== 'object') return json(400, { message: 'Permintaan tidak valid.' });
  // Honeypot: kolom tersembunyi yang hanya diisi bot. Ditolak tanpa mengirim email.
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return json(400, { code: 'rejected', message: 'Permintaan ditolak.' });
  }
  const check = checkHostedTrialRequest(input);
  if (!check.ok) return json(422, { code: 'invalid', problems: check.problems });

  const config = trialSmtpConfig();
  if (!config) {
    logError('TRIAL_SMTP_HOST/TRIAL_SMTP_FROM belum diatur');
    return json(503, { code: 'unavailable', message: 'Pengiriman email belum siap.' });
  }
  const token = newToken();
  try {
    await storeRequest(check.value, ip, await sha256Hex(token));
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    return json(500, { code: 'unknown', message: 'Permintaan belum tersimpan. Coba lagi.' });
  }
  const link = `${verifyUrl}?token=${encodeURIComponent(token)}`;
  try {
    await sendMail(config, verificationMail(check.value, link));
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    return json(502, { code: 'mail_failed', message: 'Email tidak terkirim. Coba lagi nanti.' });
  }
  return json(200, { ok: true });
});
