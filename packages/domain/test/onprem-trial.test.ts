import { describe, expect, it } from 'vitest';
import { TRIAL_FEATURES, TRIAL_QUOTA } from '../src/license';
import { readLicenseIssueRequest } from '../src/license-issue';
import {
  checkOnPremTrialRequest,
  ONPREM_TRIAL_DEFAULT_DAYS,
  onPremTrialIssueRequest,
  onPremTrialRefusal,
  trialApprovalDaysProblem,
} from '../src/onprem-trial';

const INSTANCE = '7F3A9C10-0000-4000-8000-000000000001';

describe('checkOnPremTrialRequest', () => {
  it('merapikan isian sah', () => {
    expect(
      checkOnPremTrialRequest({
        name: ' Rina ',
        institution: ' RS Contoh ',
        email: ' Rina@RS.co.id ',
        instanceId: INSTANCE,
      }),
    ).toEqual({
      ok: true,
      request: {
        name: 'Rina',
        institution: 'RS Contoh',
        email: 'rina@rs.co.id',
        instanceId: INSTANCE.toLowerCase(),
      },
    });
  });

  it.each([
    [{ name: '', institution: 'RS', email: 'a@b.id', instanceId: INSTANCE }, 'wajib diisi'],
    [{ name: 'A', institution: 'RS', email: 'a@b.id', instanceId: 'inst-1' }, 'ID instalasi'],
    [{ name: 'A', institution: 'RS', email: 'bukan-email', instanceId: INSTANCE }, 'email'],
    [null, 'wajib diisi'],
  ])('menolak %j', (input, message) => {
    const check = checkOnPremTrialRequest(input);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.message).toContain(message);
  });
});

describe('onPremTrialRefusal', () => {
  it('antre tidak ditolak, pemakaian ulang ditolak dengan alasannya', () => {
    expect(onPremTrialRefusal('queued', 'a@rs.id')).toBeNull();
    expect(onPremTrialRefusal('already_pending', 'a@rs.id')).toBeNull();
    expect(onPremTrialRefusal('instance_used', 'a@rs.id')).toContain('Instalasi');
    expect(onPremTrialRefusal('domain_used', 'a@rs.id')).toContain('Domain rs.id');
    expect(onPremTrialRefusal('blocked', 'a@rs.id')).toContain('Hubungi vendor');
  });
});

describe('persetujuan trial', () => {
  it('lama trial 14–30 hari', () => {
    expect(trialApprovalDaysProblem(ONPREM_TRIAL_DEFAULT_DAYS)).toBeNull();
    expect(trialApprovalDaysProblem(31)).not.toBeNull();
    expect(trialApprovalDaysProblem('14')).not.toBeNull();
  });

  it('permintaan lisensi trial lolos validasi penerbitan', () => {
    const request = onPremTrialIssueRequest(
      '0b9f3c2e-1d4a-4c6b-8e7f-123456789abc',
      '2026-11-15',
      14,
    );
    expect(request).toMatchObject({
      plan: 'trial',
      validFrom: '2026-11-15',
      validUntil: '2026-11-29',
      quota: TRIAL_QUOTA,
      features: TRIAL_FEATURES,
    });
    expect(readLicenseIssueRequest(request).ok).toBe(true);
  });
});
