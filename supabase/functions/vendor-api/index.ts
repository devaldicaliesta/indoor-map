import {
  checkOnPremTrialRequest,
  type OnPremTrialSubmission,
  onPremTrialRefusal,
} from '../../../packages/domain/src/onprem-trial.ts';
import { createRateLimiter } from '../../../packages/domain/src/trial-request.ts';
import { checkCheckinRequest } from '../../../packages/domain/src/vendor-release.ts';
import { serviceHeaders, url } from '../_shared/auth.ts';
import { logError } from '../trial-verify/activate.ts';
import { deliver, vendorQueuedMail } from '../vendor-trial/mails.ts';

const allowTrial = createRateLimiter(5, 60_000);
const allowCheckin = createRateLimiter(30, 60_000);

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const clientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

const tooMany = () =>
  json(429, { message: 'Terlalu banyak permintaan dari alamat ini. Coba lagi nanti.' });

async function rpc(name: string, args: Record<string, unknown>) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error(`${name} ${response.status} ${await response.text()}`);
  return response.json();
}

async function trial(request: Request): Promise<Response> {
  const ip = clientIp(request);
  if (!allowTrial(ip ?? 'unknown')) return tooMany();
  const check = checkOnPremTrialRequest(await request.json().catch(() => null));
  if (!check.ok) return json(400, { message: check.message });
  const { name, institution, email, instanceId } = check.request;
  const outcome = (await rpc('vendor_trial_submit', {
    p_name: name,
    p_institution: institution,
    p_email: email,
    p_instance_id: instanceId,
    p_ip: ip,
  })) as OnPremTrialSubmission;
  const refusal = onPremTrialRefusal(outcome, email);
  if (refusal) return json(409, { message: refusal });
  if (outcome === 'queued') await deliver(vendorQueuedMail(check.request, instanceId));
  return json(202, {
    status: 'queued',
    message: `Permintaan trial diterima. Lisensi dikirim ke ${email} setelah disetujui vendor.`,
  });
}

interface CheckinRow {
  outcome: 'unknown' | 'wrong_instance' | 'revoked' | 'active';
  file: Record<string, unknown> | null;
}

async function checkin(request: Request): Promise<Response> {
  const ip = clientIp(request);
  if (!allowCheckin(ip ?? 'unknown')) return tooMany();
  const check = checkCheckinRequest(await request.json().catch(() => null));
  if (!check.ok) return json(400, { message: check.message });
  const [row] = (await rpc('vendor_checkin', {
    p_license_id: check.request.licenseId,
    p_instance_id: check.request.instanceId,
    p_version: check.request.version,
    p_ip: ip,
  })) as CheckinRow[];
  const serverTime = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  switch (row?.outcome) {
    case 'active':
      return json(200, { status: 'active', serverTime, license: row.file });
    case 'revoked':
      return json(200, { status: 'revoked', serverTime });
    case 'wrong_instance':
      return json(409, { message: 'Lisensi ini untuk instalasi lain.' });
    default:
      return json(404, { message: 'Lisensi tidak dikenal.' });
  }
}

const activate = () =>
  json(404, {
    message:
      'Aktivasi dengan kunci lisensi belum tersedia. Minta berkas lisensi ke vendor lalu pasang di tab Unggah berkas.',
  });

const ROUTES: [string, (request: Request) => Response | Promise<Response>][] = [
  ['/v1/trial', trial],
  ['/v1/checkin', checkin],
  ['/v1/activate', activate],
];

Deno.serve(async (request) => {
  const path = new URL(request.url).pathname;
  if (request.method !== 'POST') return json(405, { message: 'Metode tidak didukung.' });
  const route = ROUTES.find(([suffix]) => path.endsWith(suffix))?.[1];
  if (!route) return json(404, { message: 'Alamat tidak dikenal.' });
  try {
    return await route(request);
  } catch (error) {
    logError('vendor-api', error instanceof Error ? error.message : String(error));
    return json(500, { message: 'Server vendor sedang bermasalah. Coba lagi nanti.' });
  }
});
