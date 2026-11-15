import {
  ANALYTICS_BATCH_MAX,
  sanitizeAnalyticsEvents,
} from '../../../packages/domain/src/analytics.ts';
import { createRateLimiter } from '../../../packages/domain/src/trial-request.ts';
import { serviceHeaders, url } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const MAX_BODY_BYTES = 32 * 1024;
const allow = createRateLimiter(Number(Deno.env.get('ANALYTICS_RATE_PER_MINUTE') || 600), 60_000);
const VENUE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function rpc(name: string, body: Record<string, unknown>): Promise<Response> {
  return await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify(body),
  });
}

function clientAddress(request: Request): string {
  return (
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ||
    'unknown'
  );
}

async function config(): Promise<Response> {
  const response = await rpc('analytics_config', {});
  if (!response.ok) return json(503, { enabled: false });
  return json(200, await response.json());
}

async function ingest(request: Request): Promise<Response> {
  if (!allow(clientAddress(request))) {
    return json(429, { code: 'rate_limited', message: 'Terlalu banyak kiriman analitik.' });
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json(413, { message: 'Kiriman terlalu besar.' });
  let body: { venueId?: unknown; events?: unknown } | null = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  const venueId = typeof body?.venueId === 'string' ? body.venueId : '';
  if (!VENUE.test(venueId) || !Array.isArray(body?.events)) {
    return json(400, { message: 'Kiriman analitik tidak valid.' });
  }
  if (body.events.length > ANALYTICS_BATCH_MAX) {
    return json(413, { message: `Paling banyak ${ANALYTICS_BATCH_MAX} event per kiriman.` });
  }
  const events = sanitizeAnalyticsEvents(body.events);
  if (!events.length) return json(202, { accepted: 0 });
  const response = await rpc('analytics_ingest', { p_venue: venueId, p_events: events });
  if (!response.ok) return json(response.status === 404 ? 404 : 400, { accepted: 0 });
  return json(202, { accepted: await response.json() });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method === 'GET') return await config();
  if (request.method === 'POST') return await ingest(request);
  return json(405, { message: 'Metode tidak didukung.' });
});
