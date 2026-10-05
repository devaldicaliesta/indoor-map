// Layanan utama Edge Runtime: meneruskan `/<nama-fungsi>` ke worker fungsi tersebut, seperti
// router bawaan Supabase CLI. Fungsi yang dipanggil hook, pg_net, atau tanpa sesi tidak
// memeriksa JWT (sama dengan `verify_jwt = false` di supabase/config.toml).

declare const EdgeRuntime: {
  userWorkers: {
    create(
      options: Record<string, unknown>,
    ): Promise<{ fetch(request: Request): Promise<Response> }>;
  };
};

const FUNCTIONS_DIR = '/srv/supabase/functions';
const PUBLIC_FUNCTIONS = new Set([
  'auth-email',
  'account-notice',
  'license-checkin',
  'license-service',
]);
const NAME = /^[a-z][a-z0-9-]*$/;
const jwtSecret = Deno.env.get('JWT_SECRET') ?? '';

function base64UrlDecode(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** JWT HS256 sah dan belum kedaluwarsa (anon, service_role, atau sesi pengguna). */
async function validJwt(request: Request): Promise<boolean> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(signature),
      new TextEncoder().encode(`${header}.${payload}`),
    );
    if (!ok) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    return typeof exp !== 'number' || exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function fail(status: number, message: string): Response {
  return new Response(JSON.stringify({ msg: message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

Deno.serve(async (request) => {
  const name = new URL(request.url).pathname.split('/')[1] ?? '';
  if (!NAME.test(name) || name === '_shared') return fail(404, 'Function not found');
  if (request.method !== 'OPTIONS' && !PUBLIC_FUNCTIONS.has(name) && !(await validJwt(request))) {
    return fail(401, 'Invalid JWT');
  }
  try {
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath: `${FUNCTIONS_DIR}/${name}`,
      memoryLimitMb: 256,
      workerTimeoutMs: 5 * 60 * 1000,
      noModuleCache: false,
      envVars: Object.entries(Deno.env.toObject()),
      forceCreate: false,
      netAccessDisabled: false,
      cpuTimeSoftLimitMs: 60_000,
      cpuTimeHardLimitMs: 120_000,
    });
    return await worker.fetch(request);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: log Edge Runtime satu-satunya jejak kegagalan worker.
    console.error(`fungsi ${name}:`, error);
    return fail(500, 'Function failed');
  }
});
