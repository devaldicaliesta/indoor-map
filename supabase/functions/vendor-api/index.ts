import { readLicenseIssueRequest } from '../../../packages/domain/src/license-issue.ts';
import {
  type ActivationRequest,
  checkActivationRequest,
  licenseKeyIssueRequest,
} from '../../../packages/domain/src/license-key.ts';
import {
  checkOnPremTrialRequest,
  type OnPremTrialSubmission,
  onPremTrialRefusal,
} from '../../../packages/domain/src/onprem-trial.ts';
import { createRateLimiter } from '../../../packages/domain/src/trial-request.ts';
import { checkCheckinRequest } from '../../../packages/domain/src/vendor-release.ts';
import { serviceHeaders, url } from '../_shared/auth.ts';
import { logError } from '../trial-verify/activate.ts';
import { signLicense, splitSignature } from '../vendor-license/signing.ts';
import { deliver, vendorQueuedMail } from '../vendor-trial/mails.ts';

const allowTrial = createRateLimiter(5, 60_000);
const allowCheckin = createRateLimiter(30, 60_000);
const allowActivate = createRateLimiter(10, 60_000);

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

interface ClaimRow {
  outcome: 'unknown' | 'revoked' | 'other_instance' | 'other_client' | 'existing' | 'claim';
  installation_id: string | null;
  client: string | null;
  plan: string | null;
  duration_days: number | null;
  quota: unknown;
  features: unknown;
  file: Record<string, unknown> | null;
}

const CLAIM_REFUSALS: Record<string, [number, string]> = {
  unknown: [404, 'Kunci lisensi tidak dikenal.'],
  revoked: [409, 'Kunci lisensi atau lisensinya sudah dicabut. Hubungi vendor.'],
  other_instance: [409, 'Kunci lisensi sudah dipakai instalasi lain.'],
  other_client: [409, 'ID instalasi ini terdaftar untuk klien lain. Hubungi vendor.'],
};

async function claim(request: ActivationRequest): Promise<ClaimRow | undefined> {
  const [row] = (await rpc('vendor_license_key_claim', {
    p_key: request.licenseKey,
    p_instance_id: request.instanceId,
  })) as ClaimRow[];
  return row;
}

async function signFromKey(request: ActivationRequest, row: ClaimRow) {
  const issue = readLicenseIssueRequest(
    licenseKeyIssueRequest(
      {
        plan: row.plan ?? '',
        durationDays: row.duration_days ?? 0,
        quota: row.quota,
        features: row.features,
      },
      row.installation_id ?? '',
      new Date(),
    ),
  );
  if (!issue.ok) throw new Error(`templat kunci tidak valid: ${issue.message}`);
  const license = await signLicense(issue.request, {
    client: row.client ?? '',
    instanceId: request.instanceId,
  });
  if (!license) throw new Error('payload lisensi dari kunci tidak valid');
  return license;
}

async function activate(request: Request): Promise<Response> {
  if (!allowActivate(clientIp(request) ?? 'unknown')) return tooMany();
  const check = checkActivationRequest(await request.json().catch(() => null));
  if (!check.ok) return json(400, { message: check.message });
  const row = await claim(check.request);
  if (row?.outcome === 'existing' && row.file) return json(200, row.file);
  if (row?.outcome !== 'claim') {
    const [status, message] = CLAIM_REFUSALS[row?.outcome ?? 'unknown'] ?? CLAIM_REFUSALS.unknown;
    return json(status, { message });
  }
  const license = await signFromKey(check.request, row);
  const { payload, signature } = splitSignature(license);
  const recorded = await fetch(`${url}/rest/v1/rpc/vendor_license_key_record`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({
      p_key: check.request.licenseKey,
      p_payload: payload,
      p_signature: signature,
    }),
  });
  if (recorded.ok) return json(200, license);
  const retry = await claim(check.request);
  if (retry?.outcome === 'existing' && retry.file) return json(200, retry.file);
  throw new Error(`vendor_license_key_record ${recorded.status} ${await recorded.text()}`);
}

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
