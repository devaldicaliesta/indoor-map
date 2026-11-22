import {
  type ApiScope,
  parseClosureInput,
  parseLocationUpsert,
} from '../../../packages/domain/src/integrations.ts';
import { createRateLimiter } from '../../../packages/domain/src/trial-request.ts';
import { serviceHeaders, url } from '../_shared/auth.ts';
import { logError } from '../_shared/log.ts';
import { OPENAPI } from './openapi.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
};

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const allowKey = createRateLimiter(Number(Deno.env.get('API_RATE_PER_MINUTE') || 120), 60_000);
const allowIp = createRateLimiter(300, 60_000);
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const ROUTE = new RegExp(`^/v1/venues/(${UUID})/(locations|categories|closures)(?:/(${UUID}))?$`);

const STATUS_BY_CODE: Record<string, number> = {
  '28000': 401,
  '42501': 403,
  IM404: 404,
  IM409: 409,
  IM422: 422,
  '22P02': 400,
  '22007': 400,
  '22008': 400,
};

interface ApiKeyInfo {
  id: string;
  name: string;
  scopes: ApiScope[];
}

class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors?: string[],
  ) {
    super(message);
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify(args),
  });
  const text = await response.text();
  if (response.ok) return (text ? JSON.parse(text) : null) as T;
  const error = (() => {
    try {
      return JSON.parse(text) as { code?: string; message?: string };
    } catch {
      return {};
    }
  })();
  const status = STATUS_BY_CODE[error.code ?? ''];
  if (status) throw new ApiError(status, error.message ?? 'Permintaan ditolak.');
  logError(`api ${name}`, `${response.status} ${text}`);
  throw new ApiError(500, 'Terjadi kesalahan di server. Coba lagi.');
}

function bearer(request: Request): string {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match?.[1] ?? request.headers.get('x-api-key') ?? '';
}

async function readJson(request: Request): Promise<unknown> {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES)
    throw new ApiError(413, 'Badan permintaan terlalu besar (maks. 2 MB).');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES)
    throw new ApiError(413, 'Badan permintaan terlalu besar (maks. 2 MB).');
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, 'Badan permintaan bukan JSON yang sah.');
  }
}

async function route(request: Request, path: string): Promise<Response> {
  const method = request.method;
  if (path === '/v1/openapi.json' && method === 'GET') return json(200, OPENAPI);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!allowIp(ip)) throw new ApiError(429, 'Terlalu banyak permintaan. Coba lagi nanti.');
  const secret = bearer(request);
  if (!secret) throw new ApiError(401, 'Kirim kunci API di header Authorization: Bearer <kunci>.');
  const key = await rpc<ApiKeyInfo | null>('api_authenticate', { p_key: secret });
  if (!key) throw new ApiError(401, 'Kunci API tidak berlaku atau sudah dicabut.');
  if (!allowKey(key.id)) throw new ApiError(429, 'Batas 120 permintaan per menit untuk kunci ini.');

  if (path === '/v1/venues' && method === 'GET') {
    return json(200, { venues: await rpc('api_venues', { p_key_id: key.id }) });
  }
  const match = ROUTE.exec(path);
  if (!match) throw new ApiError(404, 'Alamat API tidak dikenal. Lihat /v1/openapi.json.');
  const [, venueId, resource, itemId] = match;
  const base = { p_key_id: key.id, p_venue_id: venueId };

  if (resource === 'locations' && !itemId) {
    if (method === 'GET') {
      const code = new URL(request.url).searchParams.get('code');
      return json(200, { locations: await rpc('api_locations', { ...base, p_code: code }) });
    }
    if (method === 'PUT') {
      const parsed = parseLocationUpsert(await readJson(request));
      if (!parsed.ok) throw new ApiError(422, 'Isian lokasi tidak sah.', parsed.errors);
      return json(200, await rpc('api_upsert_locations', { ...base, p_rows: parsed.value }));
    }
  }
  if (resource === 'categories' && !itemId && method === 'GET') {
    return json(200, { types: await rpc('api_categories', base) });
  }
  if (resource === 'closures') {
    if (!itemId && method === 'GET') {
      return json(200, { closures: await rpc('api_closures', base) });
    }
    if (!itemId && method === 'POST') {
      const parsed = parseClosureInput(await readJson(request));
      if (!parsed.ok) throw new ApiError(422, 'Isian penutupan tidak sah.', parsed.errors);
      return json(201, {
        closures: await rpc('api_create_closures', { ...base, p_input: parsed.value }),
      });
    }
    if (itemId && method === 'DELETE') {
      return json(200, await rpc('api_end_closure', { ...base, p_closure_id: itemId }));
    }
  }
  throw new ApiError(405, `Metode ${method} tidak didukung untuk alamat ini.`);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const path = new URL(request.url).pathname.replace(/^.*?\/api(?=\/|$)/, '') || '/';
  try {
    return await route(request, path);
  } catch (error) {
    if (error instanceof ApiError) {
      return json(error.status, {
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      });
    }
    logError('api', String(error));
    return json(500, { message: 'Terjadi kesalahan di server. Coba lagi.' });
  }
});
