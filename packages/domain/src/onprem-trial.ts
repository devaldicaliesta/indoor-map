import {
  TRIAL_FEATURES,
  TRIAL_MIN_DAYS,
  TRIAL_PLAN,
  TRIAL_QUOTA,
  trialDaysProblem,
} from './license.ts';
import type { LicenseIssueRequest } from './license-issue.ts';

export const ONPREM_TRIAL_DEFAULT_DAYS = TRIAL_MIN_DAYS;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DAY_MS = 86_400_000;

export interface OnPremTrialRequest {
  name: string;
  institution: string;
  email: string;
  instanceId: string;
}

export type OnPremTrialCheck =
  | { ok: true; request: OnPremTrialRequest }
  | { ok: false; message: string };

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export function checkOnPremTrialRequest(value: unknown): OnPremTrialCheck {
  const input =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const name = text(input.name);
  const institution = text(input.institution);
  const email = text(input.email).toLowerCase();
  const instanceId = text(input.instanceId).toLowerCase();
  if (!name || !institution || name.length > 200 || institution.length > 200) {
    return { ok: false, message: 'Nama, instansi, dan ID instalasi wajib diisi.' };
  }
  if (!UUID.test(instanceId)) return { ok: false, message: 'ID instalasi tidak valid.' };
  if (!EMAIL.test(email) || email.length > 200) {
    return { ok: false, message: 'Alamat email tidak valid.' };
  }
  return { ok: true, request: { name, institution, email, instanceId } };
}

export type OnPremTrialSubmission =
  | 'queued'
  | 'already_pending'
  | 'instance_used'
  | 'email_used'
  | 'domain_used'
  | 'blocked';

export function onPremTrialRefusal(outcome: OnPremTrialSubmission, email: string): string | null {
  switch (outcome) {
    case 'queued':
    case 'already_pending':
      return null;
    case 'instance_used':
      return 'Instalasi ini sudah pernah mendapat trial.';
    case 'email_used':
      return 'Email ini sudah pernah dipakai untuk trial.';
    case 'domain_used':
      return `Domain ${email.split('@')[1] ?? ''} sudah pernah mendapat trial. Hubungi vendor.`;
    case 'blocked':
      return 'Permintaan trial ditolak. Hubungi vendor.';
  }
}

export function trialApprovalDaysProblem(days: unknown): string | null {
  return typeof days === 'number'
    ? trialDaysProblem(days)
    : 'Lama trial harus bilangan bulat hari.';
}

export function onPremTrialIssueRequest(
  installationId: string,
  today: string,
  days: number,
): LicenseIssueRequest {
  return {
    installationId,
    plan: TRIAL_PLAN,
    validFrom: today,
    validUntil: new Date(Date.parse(`${today}T00:00:00Z`) + days * DAY_MS)
      .toISOString()
      .slice(0, 10),
    quota: { ...TRIAL_QUOTA },
    features: [...TRIAL_FEATURES],
  };
}

export const ONPREM_TRIAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type OnPremTrialStatus = (typeof ONPREM_TRIAL_STATUSES)[number];

export interface VendorTrialRequest {
  id: string;
  name: string;
  institution: string;
  email: string;
  instanceId: string;
  status: OnPremTrialStatus;
  rejectReason: string | null;
  createdAt: string;
  decidedAt: string | null;
  decidedByEmail: string | null;
  licenseId: string | null;
}

export const isOnPremTrialStatus = (value: string): value is OnPremTrialStatus =>
  (ONPREM_TRIAL_STATUSES as readonly string[]).includes(value);
