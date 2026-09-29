import { describe, expect, it } from 'vitest';
import {
  checkNewPassword,
  isSessionIdle,
  PASSWORD_MIN_LENGTH,
  SESSION_IDLE_TIMEOUT_MS,
} from '../src';

describe('isSessionIdle', () => {
  const start = Date.UTC(2026, 8, 29, 8, 0);

  it('batas default 60 menit', () => {
    expect(SESSION_IDLE_TIMEOUT_MS).toBe(3_600_000);
  });

  it('belum idle sebelum 60 menit', () => {
    expect(isSessionIdle(start, start + 59 * 60_000)).toBe(false);
  });

  it('idle tepat pada 60 menit dan sesudahnya', () => {
    expect(isSessionIdle(start, start + 60 * 60_000)).toBe(true);
    expect(isSessionIdle(start, start + 61 * 60_000)).toBe(true);
  });
});

describe('checkNewPassword', () => {
  it(`menolak password kurang dari ${PASSWORD_MIN_LENGTH} karakter`, () => {
    expect(checkNewPassword('pendek1', 'pendek1')).toBe('too_short');
  });

  it('menolak konfirmasi yang berbeda', () => {
    expect(checkNewPassword('Password-Baru-1', 'Password-Baru-2')).toBe('mismatch');
  });

  it('menerima password yang cukup panjang dan cocok', () => {
    expect(checkNewPassword('Password-Baru-1', 'Password-Baru-1')).toBeNull();
  });
});
