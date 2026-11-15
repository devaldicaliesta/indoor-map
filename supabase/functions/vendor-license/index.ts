import { readLicenseIssueRequest } from '../../../packages/domain/src/license-issue.ts';
import { CORS_HEADERS, fail, reply, serviceHeaders, url } from '../_shared/auth.ts';
import { logError } from '../trial-verify/activate.ts';
import { requireVendor, rpcAsCaller, signLicense, splitSignature } from './signing.ts';

async function issue(request: Request): Promise<Response> {
  const caller = await requireVendor(request);
  if (caller instanceof Response) return caller;

  const check = readLicenseIssueRequest(await request.json().catch(() => null));
  if (!check.ok) return fail(400, 'invalid', check.message);

  const targetResponse = await rpcAsCaller(caller.authorization, 'vendor_license_target', {
    p_installation_id: check.request.installationId,
  });
  if (!targetResponse.ok) return fail(404, 'not_found', 'Instalasi tidak ditemukan.');
  const [target] = (await targetResponse.json()) as { instance_id: string; client: string }[];
  if (!target) return fail(404, 'not_found', 'Instalasi tidak ditemukan.');

  const license = await signLicense(check.request, {
    client: target.client,
    instanceId: target.instance_id,
  });
  if (!license) return fail(400, 'invalid', 'Isi lisensi tidak valid.');

  const { payload, signature } = splitSignature(license);
  const recorded = await fetch(`${url}/rest/v1/rpc/vendor_license_record`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({
      p_actor: caller.id,
      p_installation_id: check.request.installationId,
      p_payload: payload,
      p_signature: signature,
    }),
  });
  if (!recorded.ok) {
    logError(
      'vendor-license',
      `gagal mencatat lisensi ${recorded.status} ${await recorded.text()}`,
    );
    return fail(500, 'unknown', 'Lisensi tidak bisa dicatat. Coba lagi.');
  }
  return reply(200, { license });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return reply(405, { message: 'Metode tidak didukung.' });
  try {
    return await issue(request);
  } catch (error) {
    logError('vendor-license', error instanceof Error ? error.message : String(error));
    return fail(500, 'unknown', 'Lisensi tidak bisa diterbitkan. Coba lagi.');
  }
});
