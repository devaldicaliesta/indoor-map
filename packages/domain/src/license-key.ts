import type { LicenseQuota } from './license.ts';
import { TRIAL_PLAN } from './license.ts';
import { type LicenseIssueRequest, readFeatures, readQuota } from './license-issue.ts';

export const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const LICENSE_KEY_LENGTH = 25;
export const LICENSE_KEY_DEFAULT_DAYS = 365;
export const LICENSE_KEY_MAX_DAYS = 3650;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_MS = 86_400_000;
const LOOKALIKES: Record<string, string> = { O: '0', I: '1', L: '1' };

export function normalizeLicenseKey(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 100) return null;
  const compact = value
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[OIL]/g, (char) => LOOKALIKES[char] ?? char);
  if (compact.length !== LICENSE_KEY_LENGTH) return null;
  if (![...compact].every((char) => CROCKFORD_BASE32.includes(char))) return null;
  return compact.match(/.{5}/g)?.join('-') ?? null;
}

export interface ActivationRequest {
  licenseKey: string;
  instanceId: string;
}

export type ActivationCheck =
  | { ok: true; request: ActivationRequest }
  | { ok: false; message: string };

export function checkActivationRequest(value: unknown): ActivationCheck {
  const input =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const licenseKey = normalizeLicenseKey(input.licenseKey);
  if (!licenseKey) return { ok: false, message: 'Format kunci lisensi tidak valid.' };
  const instanceId = typeof input.instanceId === 'string' ? input.instanceId.trim() : '';
  if (!UUID.test(instanceId)) return { ok: false, message: 'ID instalasi tidak valid.' };
  return { ok: true, request: { licenseKey, instanceId: instanceId.toLowerCase() } };
}

export interface LicenseKeyRequest {
  clientId: string;
  plan: string;
  durationDays: number;
  quota: LicenseQuota;
  features: string[];
}

export type LicenseKeyCheck =
  | { ok: true; request: LicenseKeyRequest }
  | { ok: false; message: string };

const REQUEST_KEYS = ['clientId', 'plan', 'durationDays', 'quota', 'features'];

export function readLicenseKeyRequest(value: unknown): LicenseKeyCheck {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, message: 'Permintaan kunci lisensi tidak valid.' };
  }
  const input = value as Record<string, unknown>;
  if (!Object.keys(input).every((key) => REQUEST_KEYS.includes(key))) {
    return { ok: false, message: 'Permintaan kunci lisensi tidak valid.' };
  }
  if (typeof input.clientId !== 'string' || !UUID.test(input.clientId)) {
    return { ok: false, message: 'Klien tidak valid.' };
  }
  const plan = typeof input.plan === 'string' ? input.plan.trim() : '';
  if (plan.length === 0 || plan.length > 64) {
    return { ok: false, message: 'Paket wajib diisi (maks. 64 karakter).' };
  }
  if (plan === TRIAL_PLAN) {
    return {
      ok: false,
      message: 'Kunci lisensi bukan untuk trial. Trial on-premise lewat antrean permintaan.',
    };
  }
  const days = input.durationDays;
  if (
    typeof days !== 'number' ||
    !Number.isInteger(days) ||
    days < 1 ||
    days > LICENSE_KEY_MAX_DAYS
  ) {
    return { ok: false, message: `Masa berlaku harus 1–${LICENSE_KEY_MAX_DAYS} hari.` };
  }
  const quota = readQuota(input.quota);
  if (!quota) return { ok: false, message: 'Kuota harus bilangan bulat 0–1.000.000.' };
  const features = readFeatures(input.features);
  if (!features) return { ok: false, message: 'Fitur tidak dikenal.' };
  return {
    ok: true,
    request: { clientId: input.clientId.toLowerCase(), plan, durationDays: days, quota, features },
  };
}

export interface LicenseKeyTemplate {
  plan: string;
  durationDays: number;
  quota: unknown;
  features: unknown;
}

const isoDay = (time: number) => new Date(time).toISOString().slice(0, 10);

export function licenseKeyIssueRequest(
  template: LicenseKeyTemplate,
  installationId: string,
  activatedAt: Date,
): LicenseIssueRequest {
  const start = Date.parse(`${isoDay(activatedAt.getTime())}T00:00:00Z`);
  return {
    installationId,
    plan: template.plan,
    validFrom: isoDay(start),
    validUntil: isoDay(start + template.durationDays * DAY_MS),
    quota: template.quota as LicenseQuota,
    features: template.features as string[],
  };
}

export const LICENSE_KEY_STATUSES = ['available', 'activated', 'revoked'] as const;
export type LicenseKeyStatus = (typeof LICENSE_KEY_STATUSES)[number];

export const LICENSE_KEY_STATUS_LABELS: Record<LicenseKeyStatus, string> = {
  available: 'Belum dipakai',
  activated: 'Sudah diaktifkan',
  revoked: 'Dicabut',
};

export const isLicenseKeyStatus = (value: string): value is LicenseKeyStatus =>
  (LICENSE_KEY_STATUSES as readonly string[]).includes(value);

export interface VendorLicenseKey {
  id: string;
  hint: string;
  status: LicenseKeyStatus;
  plan: string;
  durationDays: number;
  quota: LicenseQuota;
  features: string[];
  instanceId: string | null;
  installationName: string | null;
  licenseId: string | null;
  createdAt: string;
  createdByEmail: string | null;
  activatedAt: string | null;
  revokedAt: string | null;
}

export const maskedLicenseKey = (hint: string) => `XXXXX-XXXXX-XXXXX-XXXXX-${hint}`;
