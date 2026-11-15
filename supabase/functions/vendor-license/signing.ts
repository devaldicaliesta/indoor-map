import {
  type LicenseFile,
  type LicensePayload,
  licenseSigningBytes,
  toBase64,
} from '../../../packages/domain/src/license.ts';
import {
  type LicenseIssueRequest,
  licensePayloadFor,
  newLicenseId,
} from '../../../packages/domain/src/license-issue.ts';
import { type Caller, callerHeaders, fail, requireCaller, url } from '../_shared/auth.ts';

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

export function rpcAsCaller(authorization: string, name: string, body: unknown) {
  return fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: callerHeaders(authorization),
    body: JSON.stringify(body),
  });
}

export interface VendorCaller extends Caller {
  authorization: string;
}

export async function requireVendor(request: Request): Promise<VendorCaller | Response> {
  const caller = await requireCaller(request);
  if (caller instanceof Response) return caller;
  const authorization = request.headers.get('Authorization') ?? '';
  const access = await rpcAsCaller(authorization, 'vendor_access', {});
  if (!access.ok || (await access.json()) !== 'ok') {
    return fail(403, 'forbidden', 'Hanya staf vendor dengan verifikasi dua langkah.');
  }
  return { ...caller, authorization };
}

export async function signLicense(
  request: LicenseIssueRequest,
  target: { client: string; instanceId: string },
): Promise<LicenseFile | null> {
  const payload: LicensePayload | null = licensePayloadFor(request, {
    licenseId: newLicenseId(crypto.randomUUID()),
    client: target.client,
    instanceId: target.instanceId,
    issuedAt: new Date(),
  });
  if (!payload) return null;
  const key = await loadSigningKey();
  const signature = await crypto.subtle.sign(
    { name: 'Ed25519' },
    key,
    licenseSigningBytes(payload),
  );
  return { ...payload, signature: toBase64(new Uint8Array(signature)) };
}

export function splitSignature(file: LicenseFile) {
  const { signature, ...payload } = file;
  return { payload, signature };
}
