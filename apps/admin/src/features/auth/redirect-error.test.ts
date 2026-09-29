import { describe, expect, it } from 'vitest';
import { parseAuthRedirectError } from './redirect-error';

describe('parseAuthRedirectError', () => {
  it('tautan yang sudah dipakai atau kedaluwarsa', () => {
    expect(
      parseAuthRedirectError(
        '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      ),
    ).toContain('sudah dipakai');
  });

  it('error lain tetap menghasilkan pesan', () => {
    expect(parseAuthRedirectError('#error=server_error')).toContain('Minta tautan baru');
  });

  it('hash token yang valid bukan error', () => {
    expect(parseAuthRedirectError('#access_token=abc&type=recovery')).toBeNull();
    expect(parseAuthRedirectError('')).toBeNull();
  });
});
