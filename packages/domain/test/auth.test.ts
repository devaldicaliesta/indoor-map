import { describe, expect, it } from 'vitest';
import {
  checkNewPassword,
  isSessionIdle,
  PASSWORD_MIN_LENGTH,
  passwordProblem,
  SESSION_IDLE_TIMEOUT_MS,
} from '../src';

describe('isSessionIdle', () => {
  const start = Date.UTC(2026, 8, 29, 8, 0);

  it('batas default 30 menit (ASVS 3.3.2 L2)', () => {
    expect(SESSION_IDLE_TIMEOUT_MS).toBe(1_800_000);
  });

  it('belum idle sebelum 30 menit', () => {
    expect(isSessionIdle(start, start + 29 * 60_000)).toBe(false);
  });

  it('idle tepat pada 30 menit dan sesudahnya', () => {
    expect(isSessionIdle(start, start + 30 * 60_000)).toBe(true);
    expect(isSessionIdle(start, start + 31 * 60_000)).toBe(true);
  });
});

describe('passwordProblem', () => {
  it('minimal 12 karakter (ASVS 2.1.1)', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12);
    expect(passwordProblem('Kopi-Pagi-7')).toBe('too_short');
    expect(passwordProblem('Kopi-Pagi-78')).toBeNull();
  });

  it.each([
    'password1234',
    'Password2026!',
    'P@ssw0rd-2026',
    'qwerty123456',
    'Qwertyuiop12',
    'iloveyou2026',
    'bismillah123',
    'Indonesia1945',
    'Admin12345678',
    'superadmin2026',
    'PanduArah2026!',
    'katasandi1234',
    'rahasia123456',
  ])('menolak kata umum yang hanya ditambah angka/simbol: %s', (password) => {
    expect(passwordProblem(password)).toBe('too_common');
  });

  it.each(['123456789012', '000000000000', 'aaaaaaaaaaaa', 'abcdefghijkl', '987654321098'])(
    'menolak deret atau karakter berulang: %s',
    (password) => {
      expect(passwordProblem(password)).toBe('too_common');
    },
  );

  it('menolak password yang hanya berupa email atau nama pengguna ditambah angka', () => {
    expect(passwordProblem('budisantoso2026', { email: 'budisantoso@rs.example' })).toBe(
      'too_common',
    );
    expect(passwordProblem('Sari.Dewi.1990', { name: 'Sari Dewi' })).toBe('too_common');
  });

  it.each([
    'kopi-pagi-di-lobi-timur',
    'Bus 7 berangkat jam 06.15',
    '8264-9157-3302',
    'Lantai3-Ruang-Rapat-B',
    'password manager saya aman sekali',
  ])('menerima password panjang yang tidak umum: %s', (password) => {
    expect(passwordProblem(password, { email: 'budi@rs.example', name: 'Budi' })).toBeNull();
  });
});

describe('checkNewPassword', () => {
  it(`menolak password kurang dari ${PASSWORD_MIN_LENGTH} karakter`, () => {
    expect(checkNewPassword('pendek1', 'pendek1')).toBe('too_short');
  });

  it('menolak password umum', () => {
    expect(checkNewPassword('Password2026!', 'Password2026!')).toBe('too_common');
  });

  it('menolak konfirmasi yang berbeda', () => {
    expect(checkNewPassword('Kopi-Pagi-Baru-1', 'Kopi-Pagi-Baru-2')).toBe('mismatch');
  });

  it('menerima password yang cukup panjang, tidak umum, dan cocok', () => {
    expect(checkNewPassword('Kopi-Pagi-Baru-1', 'Kopi-Pagi-Baru-1')).toBeNull();
  });

  it('memakai email dan nama pengguna sebagai konteks', () => {
    expect(
      checkNewPassword('budisantoso2026', 'budisantoso2026', { email: 'budisantoso@x.id' }),
    ).toBe('too_common');
  });
});
