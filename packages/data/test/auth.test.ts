import { describe, expect, it } from 'vitest';
import { ACCOUNT_INACTIVE_MESSAGE, ACCOUNT_LOCKED_MESSAGE, toAuthError } from '../src/auth';

describe('toAuthError', () => {
  it('kredensial salah memakai pesan umum, tanpa membocorkan penyebab', () => {
    const error = toAuthError({
      code: 'invalid_credentials',
      status: 400,
      message: 'Invalid login credentials',
    });
    expect(error.kind).toBe('forbidden');
    expect(error.code).toBe('invalid_credentials');
    expect(error.message).toBe('Email atau password salah.');
  });

  it('pesan hook akun terkunci dikenali walau kodenya invalid_credentials', () => {
    const error = toAuthError({
      code: 'invalid_credentials',
      status: 400,
      message: ACCOUNT_LOCKED_MESSAGE,
    });
    expect(error.code).toBe('account_locked');
    expect(error.message).toBe(ACCOUNT_LOCKED_MESSAGE);
  });

  it('pesan hook akun nonaktif dikenali', () => {
    const error = toAuthError({
      code: 'invalid_credentials',
      status: 400,
      message: ACCOUNT_INACTIVE_MESSAGE,
    });
    expect(error.code).toBe('account_inactive');
  });

  it('kegagalan hook email Auth meneruskan pesan untuk pengguna', () => {
    const message =
      'Server email belum diatur. Minta Super Admin mengisi SMTP di Pengaturan → Sistem.';
    const error = toAuthError({ code: 'unexpected_failure', status: 500, message });
    expect(error).toMatchObject({ kind: 'unknown', code: 'email_unavailable', message });
    expect(
      toAuthError({ status: 500, message: 'Email tidak terkirim. Server SMTP menolak.' }).code,
    ).toBe('email_unavailable');
  });

  it('batas permintaan menjadi rate_limited', () => {
    expect(
      toAuthError({ code: 'over_email_send_rate_limit', status: 429, message: 'x' }).code,
    ).toBe('rate_limited');
    expect(toAuthError({ status: 429, message: 'Too many requests' }).code).toBe('rate_limited');
  });

  it('password lemah dan sama menjadi invalid', () => {
    expect(toAuthError({ code: 'weak_password', status: 422, message: 'x' }).kind).toBe('invalid');
    expect(toAuthError({ code: 'same_password', status: 422, message: 'x' }).code).toBe(
      'same_password',
    );
  });

  it('kegagalan jaringan tetap network', () => {
    expect(toAuthError({ message: 'Failed to fetch', status: 0 }).kind).toBe('network');
  });
});
