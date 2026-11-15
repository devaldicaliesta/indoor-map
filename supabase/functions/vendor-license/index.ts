import { licenseSigningBytes, toBase64 } from '../../../packages/domain/src/license.ts';
import {
  licensePayloadFor,
  newLicenseId,
  readLicenseIssueRequest,
} from '../../../packages/domain/src/license-issue.ts';
import {
  CORS_HEADERS,
  callerHeaders,
  fail,
  reply,
  requireCaller,
  serviceHeaders,
  url,
} from '../_shared/auth.ts';
import { logError } from '../trial-verify/activate.ts';

type SigningKey = Awaited<ReturnType<typeof crypto.subtle.importKey>>;

let signingKey: Promise<SigningKey> | null = null;

function loadSigningKey(): Promise<SigningKey> {
  signingKey ??= (async () => {
    const text = (Deno.env.get('LICENSE_PRIVATE_KEY') ?? '').trim();
    if (!text) throw new Error('LICENSE_PRIVATE_KEY belum diatur.');
    const bytes = Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
    return crypto.subtle.importKey('pkcs8', bytes, { name: 'Ed25519' }, false, ['sign']);
  })();
  signingKey.catch(() => {
    signingKey = null;
  });
  return signingKey;
}

async function rpcAsCaller(authorization: string, name: string, body: unknown) {
  return fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: callerHeaders(authorization),
    body: JSON.stringify(body),
  });
}

async function vendorSession(authorization: string): Promise<boolean> {
  const response = await rpcAsCaller(authorization, 'vendor_access', {});
  return response.ok && (await response.json()) === 'ok';
}

async function issue(request: Request): Promise<Response> {
  const caller = await requireCaller(request);
  if (caller instanceof Response) return caller;
  const authorization = request.headers.get('Authorization') ?? '';
  if (!(await vendorSession(authorization))) {
    return fail(403, 'forbidden', 'Hanya staf vendor dengan verifikasi dua langkah.');
  }

  const check = readLicenseIssueRequest(await request.json().catch(() => null));
  if (!check.ok) return fail(400, 'invalid', check.message);

  const targetResponse = await rpcAsCaller(authorization, 'vendor_license_target', {
    p_installation_id: check.request.installationId,
  });
  if (!targetResponse.ok) return fail(404, 'not_found', 'Instalasi tidak ditemukan.');
  const [target] = (await targetResponse.json()) as { instance_id: string; client: string }[];
  if (!target) return fail(404, 'not_found', 'Instalasi tidak ditemukan.');

  const payload = licensePayloadFor(check.request, {
    licenseId: newLicenseId(crypto.randomUUID()),
    client: target.client,
    instanceId: target.instance_id,
    issuedAt: new Date(),
  });
  if (!payload) return fail(400, 'invalid', 'Isi lisensi tidak valid.');

  const key = await loadSigningKey();
  const signature = toBase64(
    new Uint8Array(
      await crypto.subtle.sign({ name: 'Ed25519' }, key, licenseSigningBytes(payload)),
    ),
  );

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
  return reply(200, { license: { ...payload, signature } });
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
