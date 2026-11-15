import {
  ONPREM_TRIAL_DEFAULT_DAYS,
  onPremTrialIssueRequest,
  trialApprovalDaysProblem,
} from '../../../packages/domain/src/onprem-trial.ts';
import { CORS_HEADERS, fail, reply, serviceHeaders, url } from '../_shared/auth.ts';
import { logError } from '../trial-verify/activate.ts';
import {
  requireVendor,
  rpcAsCaller,
  signLicense,
  splitSignature,
  type VendorCaller,
} from '../vendor-license/signing.ts';
import { deliver, licenseMail, rejectionMail, type TrialApplicant } from './mails.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Prepared {
  installation_id: string;
  instance_id: string;
  client: string;
  name: string;
  email: string;
}

const todayInJakarta = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

async function sqlMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
  return typeof body?.message === 'string' ? body.message : fallback;
}

async function approve(caller: VendorCaller, requestId: string, days: unknown) {
  const problem = trialApprovalDaysProblem(days ?? ONPREM_TRIAL_DEFAULT_DAYS);
  if (problem) return fail(400, 'invalid', problem);
  const prepared = await rpcAsCaller(caller.authorization, 'vendor_trial_prepare', {
    p_request_id: requestId,
  });
  if (!prepared.ok) {
    return fail(409, 'conflict', await sqlMessage(prepared, 'Permintaan tidak bisa diproses.'));
  }
  const [target] = (await prepared.json()) as Prepared[];
  if (!target) return fail(404, 'not_found', 'Permintaan trial tidak ditemukan.');

  const license = await signLicense(
    onPremTrialIssueRequest(
      target.installation_id,
      todayInJakarta(),
      (days as number | undefined) ?? ONPREM_TRIAL_DEFAULT_DAYS,
    ),
    { client: target.client, instanceId: target.instance_id },
  );
  if (!license) return fail(400, 'invalid', 'Isi lisensi trial tidak valid.');

  const { payload, signature } = splitSignature(license);
  const recorded = await fetch(`${url}/rest/v1/rpc/vendor_trial_approve`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({
      p_actor: caller.id,
      p_request_id: requestId,
      p_installation_id: target.installation_id,
      p_payload: payload,
      p_signature: signature,
    }),
  });
  if (!recorded.ok) {
    const message = await sqlMessage(recorded, 'Lisensi trial tidak bisa dicatat. Coba lagi.');
    logError('vendor-trial', `gagal menyetujui ${requestId}: ${message}`);
    return fail(409, 'conflict', message);
  }
  const applicant: TrialApplicant = {
    name: target.name,
    institution: target.client,
    email: target.email,
  };
  const emailed = await deliver(licenseMail(applicant, license));
  return reply(200, { license, emailed });
}

async function reject(caller: VendorCaller, requestId: string, reason: unknown) {
  const response = await rpcAsCaller(caller.authorization, 'vendor_trial_reject', {
    p_request_id: requestId,
    p_reason: typeof reason === 'string' ? reason : '',
  });
  if (!response.ok) {
    return fail(409, 'conflict', await sqlMessage(response, 'Permintaan tidak bisa ditolak.'));
  }
  const [applicant] = (await response.json()) as TrialApplicant[];
  const emailed = applicant
    ? await deliver(rejectionMail(applicant, String(reason).trim()))
    : false;
  return reply(200, { emailed });
}

async function decide(request: Request): Promise<Response> {
  const caller = await requireVendor(request);
  if (caller instanceof Response) return caller;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const requestId = typeof body?.requestId === 'string' ? body.requestId : '';
  if (!UUID.test(requestId)) return fail(400, 'invalid', 'Permintaan trial tidak valid.');
  if (body?.decision === 'approve') return approve(caller, requestId, body.days);
  if (body?.decision === 'reject') return reject(caller, requestId, body.reason);
  return fail(400, 'invalid', 'Keputusan tidak dikenal.');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return reply(405, { message: 'Metode tidak didukung.' });
  try {
    return await decide(request);
  } catch (error) {
    logError('vendor-trial', error instanceof Error ? error.message : String(error));
    return fail(500, 'unknown', 'Keputusan trial gagal diproses. Coba lagi.');
  }
});
