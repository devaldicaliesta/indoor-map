/**
 * GoTrue mengarahkan tautan reset yang sudah dipakai atau kedaluwarsa ke
 * `#error=access_denied&error_code=otp_expired&error_description=...`.
 */
export function parseAuthRedirectError(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const code = params.get('error_code') ?? params.get('error');
  if (!code) return null;
  if (code === 'otp_expired' || code === 'access_denied') {
    return 'Tautan reset tidak berlaku: sudah dipakai atau lebih dari 1 jam. Minta tautan baru.';
  }
  return 'Tautan reset tidak bisa dipakai. Minta tautan baru.';
}
