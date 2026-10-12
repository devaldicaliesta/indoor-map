// Token acak untuk tautan email (verifikasi trial, T-614). Yang disimpan hanya hash-nya (§3.7):
// kebocoran isi database tidak memberi tautan yang bisa dipakai.

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** 32 bita acak (256 bit) dalam base64url, aman dipakai di URL. */
export function newToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

/** SHA-256 heksadesimal; sama dengan `encode(sha256(...), 'hex')` di Postgres. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
