// Verifikasi tanda tangan Standard Webhooks (dipakai Auth Hook GoTrue) tanpa dependensi:
// HMAC-SHA256 atas `${id}.${timestamp}.${body}` dengan rahasia `v1,whsec_<base64>`.

const TOLERANCE_S = 5 * 60;
const encoder = new TextEncoder();

function decodeSecret(secret: string): Uint8Array {
  const raw = secret.replace(/^v1,/, '').replace(/^whsec_/, '');
  return Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
}

function toBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

/** Perbandingan waktu-tetap agar tanda tangan tidak bisa ditebak per karakter. */
function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyWebhook(
  headers: Headers,
  body: string,
  secret: string,
): Promise<boolean> {
  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatures = headers.get('webhook-signature');
  if (!secret || !id || !timestamp || !signatures) return false;
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() / 1000 - sentAt) > TOLERANCE_S) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    decodeSecret(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = toBase64(
    await crypto.subtle.sign('HMAC', key, encoder.encode(`${id}.${timestamp}.${body}`)),
  );
  return signatures
    .split(' ')
    .some((entry) => entry.startsWith('v1,') && sameString(entry.slice(3), expected));
}
