import { describe, expect, it } from 'vitest';
import {
  canDisableMfa,
  type MfaState,
  mfaGateStep,
  normalizeRecoveryCode,
  normalizeTotpCode,
} from '../src';

const state = (patch: Partial<MfaState>): MfaState => ({
  required: false,
  roleRequired: false,
  hasTotp: false,
  satisfied: true,
  ...patch,
});

describe('mfaGateStep', () => {
  it('sesi yang memenuhi kewajiban langsung masuk', () => {
    expect(mfaGateStep(state({}))).toBe('ok');
    expect(mfaGateStep(state({ required: true, hasTotp: true, satisfied: true }))).toBe('ok');
  });

  it('punya aplikasi autentikator tetapi belum memasukkan kode: minta kode', () => {
    expect(mfaGateStep(state({ required: true, hasTotp: true, satisfied: false }))).toBe('verify');
  });

  it('role diwajibkan tetapi belum punya aplikasi: minta pendaftaran', () => {
    expect(
      mfaGateStep(state({ required: true, roleRequired: true, hasTotp: false, satisfied: false })),
    ).toBe('enroll');
  });
});

describe('canDisableMfa', () => {
  it('hanya 2FA yang diaktifkan sendiri yang bisa dimatikan sendiri', () => {
    expect(canDisableMfa(state({ hasTotp: true }))).toBe(true);
    expect(canDisableMfa(state({ hasTotp: true, roleRequired: true }))).toBe(false);
    expect(canDisableMfa(state({ hasTotp: false }))).toBe(false);
  });
});

describe('normalizeRecoveryCode', () => {
  it('menerima tanda hubung, spasi, dan huruf kecil', () => {
    expect(normalizeRecoveryCode('abcde-fgh23')).toBe('ABCDEFGH23');
    expect(normalizeRecoveryCode(' ABCDE FGH23 ')).toBe('ABCDEFGH23');
  });

  it('menolak panjang lain dan simbol yang tidak pernah dibuat (0, O, 1, I)', () => {
    expect(normalizeRecoveryCode('ABCDE-FGH2')).toBeNull();
    expect(normalizeRecoveryCode('ABCDE-FGH20')).toBeNull();
    expect(normalizeRecoveryCode('OBCDE-FGH23')).toBeNull();
    expect(normalizeRecoveryCode('IBCDE-FGH23')).toBeNull();
  });
});

describe('normalizeTotpCode', () => {
  it('menerima 6 digit dengan spasi di tengah', () => {
    expect(normalizeTotpCode('123 456')).toBe('123456');
  });

  it('menolak selain 6 digit', () => {
    expect(normalizeTotpCode('12345')).toBeNull();
    expect(normalizeTotpCode('12345a')).toBeNull();
  });
});
