// Edge Function trial-request (T-505): form "Minta trial" di landing page vendor. KHUSUS SERVER
// VENDOR — tidak ikut paket instalasi klien (lihat .dockerignore). Memeriksa isian (validasi
// domain yang sama dengan landing), menolak honeypot dan kiriman beruntun (> 5 per menit per
// alamat IP), lalu mengirim rincian ke email vendor dan email konfirmasi ke pemohon lewat SMTP.
// Kredensial SMTP (mis. App Password Gmail) hanya dari rahasia lingkungan, tidak di repo.
//   TRIAL_SMTP_HOST, TRIAL_SMTP_PORT, TRIAL_SMTP_USERNAME, TRIAL_SMTP_PASSWORD, TRIAL_SMTP_FROM,
//   TRIAL_VENDOR_EMAIL (bawaan panduarahid@gmail.com), TRIAL_ALLOWED_ORIGIN (bawaan *).

import {
  type BuildingSize,
  type BuildingType,
  checkTrialRequest,
  createRateLimiter,
  type TrialRequestInput,
} from '../../../packages/domain/src/trial-request.ts';
import {
  EMAIL_LOGO,
  emailHtml,
  emailText,
  escapeHtml,
  VENDOR_EMAIL,
} from '../_shared/email-layout.ts';
import { type SmtpConfig, sendMail } from '../_shared/smtp.ts';

const env = (name: string) => Deno.env.get(name)?.trim() ?? '';
const vendorEmail = env('TRIAL_VENDOR_EMAIL') || VENDOR_EMAIL;
const corsHeaders = {
  'Access-Control-Allow-Origin': env('TRIAL_ALLOWED_ORIGIN') || '*',
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
  // biome-ignore lint/suspicious/noConsole: log Edge Runtime satu-satunya tempat rincian SMTP; balasan ke pemohon sengaja umum.
  console.error(`trial-request: ${message}`);
}

function smtpConfig(): SmtpConfig | null {
  const host = env('TRIAL_SMTP_HOST');
  const from = env('TRIAL_SMTP_FROM');
  if (!host || !from) return null;
  return {
    host,
    port: Number(env('TRIAL_SMTP_PORT') || 587),
    username: env('TRIAL_SMTP_USERNAME') || null,
    password: env('TRIAL_SMTP_PASSWORD') || null,
    from,
  };
}

const TYPE_LABELS: Record<BuildingType, string> = {
  mall: 'Mal / pusat belanja',
  hospital: 'Rumah sakit',
  campus: 'Kampus / sekolah',
  office: 'Perkantoran',
  airport: 'Bandara / terminal',
  industrial: 'Kawasan industri / pabrik',
  event: 'Event / konser / pameran',
  other: 'Lainnya',
};

const SIZE_LABELS: Record<BuildingSize, string> = {
  lt5k: '< 5.000 m²',
  '5k-20k': '5.000–20.000 m²',
  '20k-50k': '20.000–50.000 m²',
  gt50k: '> 50.000 m²',
};

/** Rincian permintaan untuk vendor; semua isian di-escape (HTML tampil sebagai teks). */
function vendorMail(input: TrialRequestInput, ip: string, at: Date) {
  const rows: [string, string][] = [
    ['Nama', input.name],
    ['Instansi', input.institution],
    ['Jabatan', input.title],
    ['Email', input.email],
    ['Telepon', input.phone],
    ['Jenis gedung', TYPE_LABELS[input.buildingType]],
    ['Luas', SIZE_LABELS[input.buildingSize]],
    ['Lama trial', `${input.durationDays} hari`],
    [
      'ID instalasi',
      input.installId || '(belum ada — kirim berkas trial setelah server terpasang)',
    ],
    ['Bahasa', input.language === 'en' ? 'English' : 'Indonesia'],
    ['Waktu', at.toISOString()],
    ['Alamat IP', ip],
  ];
  const html = emailHtml(
    `<p style="margin:0 0 16px">Permintaan trial baru dari landing page:</p><table style="border-collapse:collapse">${rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:4px 16px 4px 0;color:#545b64">${escapeHtml(label)}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
      )
      .join('')}</table>`,
  );
  const text = emailText(
    `Permintaan trial baru dari landing page:\n\n${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}`,
  );
  return {
    to: vendorEmail,
    subject: `Permintaan trial: ${input.institution} (${input.durationDays} hari)`,
    text,
    html,
    inline: [EMAIL_LOGO],
  };
}

/** Konfirmasi ke pemohon dalam bahasa yang dipilih di landing page. */
function confirmationMail(input: TrialRequestInput) {
  const en = input.language === 'en';
  const subject = en ? 'PanduArah trial request received' : 'Permintaan trial PanduArah diterima';
  const lines = en
    ? [
        `Hello ${input.name},`,
        `Thank you for your interest in PanduArah. We received your ${input.durationDays}-day trial request for ${input.institution}.`,
        input.installId
          ? `We will send a trial license file for installation ID ${input.installId} within one business day.`
          : 'Our team will contact you within one business day to help with installation. Once the server is installed, you can also start a 14-day trial directly from the activation page.',
        `Questions? Reply to ${vendorEmail}.`,
      ]
    : [
        `Halo ${input.name},`,
        `Terima kasih atas minat Anda pada PanduArah. Permintaan trial ${input.durationDays} hari untuk ${input.institution} sudah kami terima.`,
        input.installId
          ? `Berkas lisensi trial untuk ID instalasi ${input.installId} kami kirim paling lambat satu hari kerja.`
          : 'Tim kami menghubungi Anda paling lambat satu hari kerja untuk membantu instalasi. Setelah server terpasang, trial 14 hari juga bisa dimulai langsung dari halaman aktivasi.',
        `Ada pertanyaan? Hubungi ${vendorEmail}.`,
      ];
  return {
    to: input.email,
    subject,
    text: emailText(lines.join('\n\n')),
    html: emailHtml(
      lines.map((line) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`).join(''),
    ),
    inline: [EMAIL_LOGO],
  };
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
  const check = checkTrialRequest(input);
  if (!check.ok) return json(422, { code: 'invalid', problems: check.problems });

  const config = smtpConfig();
  if (!config) {
    logError('TRIAL_SMTP_HOST/TRIAL_SMTP_FROM belum diatur');
    return json(503, { code: 'unavailable', message: 'Pengiriman email belum siap.' });
  }
  try {
    await sendMail(config, vendorMail(check.value, ip, new Date()));
    await sendMail(config, confirmationMail(check.value));
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    return json(502, { code: 'mail_failed', message: 'Email tidak terkirim. Coba lagi nanti.' });
  }
  return json(200, { ok: true });
});
