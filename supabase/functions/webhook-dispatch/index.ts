import { serviceHeaders, url } from '../_shared/auth.ts';
import { logError } from '../_shared/log.ts';

const TIMEOUT_MS = 10_000;
const BATCH = 20;
const ROUNDS = 5;
const PARALLEL = 5;
const encoder = new TextEncoder();

interface Claimed {
  id: string;
  event: string;
  payload: Record<string, unknown>;
  attempt: number;
  url: string;
  secret: string;
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error(`${name} ${response.status} ${await response.text()}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

function base64(bytes: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Standard Webhooks: `v1,` + base64(HMAC-SHA256(`${id}.${timestamp}.${body}`)). */
export async function sign(secret: string, id: string, timestamp: number, body: string) {
  const raw = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`${id}.${timestamp}.${body}`));
  return `v1,${base64(mac)}`;
}

async function deliver(item: Claimed): Promise<void> {
  const body = JSON.stringify(item.payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const started = performance.now();
  let status = 0;
  let error: string | null = null;
  try {
    const response = await fetch(item.url, {
      method: 'POST',
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PanduArah-Webhook/1',
        'webhook-id': item.id,
        'webhook-timestamp': String(timestamp),
        'webhook-signature': await sign(item.secret, item.id, timestamp, body),
      },
      body,
    });
    status = response.status;
    if (status < 200 || status > 299) {
      error = `Penerima membalas ${status}: ${(await response.text()).slice(0, 200)}`;
    } else {
      await response.body?.cancel();
    }
  } catch (cause) {
    error =
      cause instanceof DOMException && cause.name === 'TimeoutError'
        ? `Penerima tidak membalas dalam ${TIMEOUT_MS / 1000} detik.`
        : `Tidak bisa menghubungi penerima: ${String(cause).slice(0, 200)}`;
  }
  await rpc('webhook_record', {
    p_id: item.id,
    p_status: status,
    p_error: error,
    p_ms: Math.round(performance.now() - started),
  });
}

async function dispatch(): Promise<number> {
  let sent = 0;
  for (let round = 0; round < ROUNDS; round++) {
    const batch = await rpc<Claimed[]>('webhook_claim', { p_limit: BATCH });
    if (batch.length === 0) break;
    for (let i = 0; i < batch.length; i += PARALLEL) {
      await Promise.all(batch.slice(i, i + PARALLEL).map(deliver));
    }
    sent += batch.length;
  }
  return sent;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const authorized = await rpc<boolean>('webhook_dispatch_authorized', {
    p_secret: request.headers.get('x-webhook-dispatch-secret') ?? '',
  }).catch(() => false);
  if (!authorized) return new Response('Forbidden', { status: 403 });
  try {
    const sent = await dispatch();
    return Response.json({ sent });
  } catch (error) {
    logError('webhook-dispatch', String(error));
    return Response.json({ message: 'Pengiriman webhook gagal.' }, { status: 500 });
  }
});
