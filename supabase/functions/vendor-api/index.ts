import {
  checkOnPremTrialRequest,
  type OnPremTrialSubmission,
  onPremTrialRefusal,
} from '../../../packages/domain/src/onprem-trial.ts';
import { createRateLimiter } from '../../../packages/domain/src/trial-request.ts';
import { serviceHeaders, url } from '../_shared/auth.ts';
import { logError } from '../trial-verify/activate.ts';
import { deliver, vendorQueuedMail } from '../vendor-trial/mails.ts';

const allow = createRateLimiter(5, 60_000);

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const clientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

async function trial(request: Request): Promise<Response> {
  const ip = clientIp(request);
  if (!allow(ip ?? 'unknown')) {
    return json(429, {
      message: 'Terlalu banyak permintaan trial dari alamat ini. Coba lagi nanti.',
    });
  }
  const check = checkOnPremTrialRequest(await request.json().catch(() => null));
  if (!check.ok) return json(400, { message: check.message });
  const { name, institution, email, instanceId } = check.request;

  const response = await fetch(`${url}/rest/v1/rpc/vendor_trial_submit`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({
      p_name: name,
      p_institution: institution,
      p_email: email,
      p_instance_id: instanceId,
      p_ip: ip,
    }),
  });
  if (!response.ok) {
    logError('vendor-api', `vendor_trial_submit ${response.status} ${await response.text()}`);
    return json(500, { message: 'Permintaan trial tidak bisa dicatat. Coba lagi nanti.' });
  }
  const outcome = (await response.json()) as OnPremTrialSubmission;
  const refusal = onPremTrialRefusal(outcome, email);
  if (refusal) return json(409, { message: refusal });
  if (outcome === 'queued') await deliver(vendorQueuedMail(check.request, instanceId));
  return json(202, {
    status: 'queued',
    message: `Permintaan trial diterima. Lisensi dikirim ke ${email} setelah disetujui vendor.`,
  });
}

Deno.serve(async (request) => {
  const path = new URL(request.url).pathname;
  if (request.method !== 'POST') return json(405, { message: 'Metode tidak didukung.' });
  try {
    if (path.endsWith('/v1/trial')) return await trial(request);
    return json(404, { message: 'Alamat tidak dikenal.' });
  } catch (error) {
    logError('vendor-api', error instanceof Error ? error.message : String(error));
    return json(500, { message: 'Server vendor sedang bermasalah. Coba lagi nanti.' });
  }
});
