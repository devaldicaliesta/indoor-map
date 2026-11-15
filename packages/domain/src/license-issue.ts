import { PAID_FEATURES } from './entitlements.ts';
import {
  type LicenseFile,
  type LicensePayload,
  type LicenseQuota,
  OPTIONAL_QUOTA_KEYS,
  readLicensePayload,
  TRIAL_FEATURES,
  TRIAL_PLAN,
  TRIAL_QUOTA,
  trialDaysProblem,
} from './license.ts';

export const PAID_DEFAULT_QUOTA: LicenseQuota = {
  venues: 1,
  buildings: 1,
  floors: 10,
  infoPoints: 0,
};

const REQUIRED_QUOTA_KEYS = ['venues', 'buildings', 'floors', 'infoPoints'] as const;
const REQUEST_KEYS = ['installationId', 'plan', 'validFrom', 'validUntil', 'quota', 'features'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const MAX_COUNT = 1_000_000;

export interface LicenseIssueRequest {
  installationId: string;
  plan: string;
  validFrom: string;
  validUntil: string;
  quota: LicenseQuota;
  features: string[];
}

export type LicenseIssueCheck =
  | { ok: true; request: LicenseIssueRequest }
  | { ok: false; message: string };

const fail = (message: string): LicenseIssueCheck => ({ ok: false, message });

const dayStart = (value: unknown): number | null => {
  if (typeof value !== 'string' || !DAY.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== value ? null : time;
};

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_COUNT;

export function readQuota(value: unknown): LicenseQuota | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const entries = value as Record<string, unknown>;
  const allowed: readonly string[] = [...REQUIRED_QUOTA_KEYS, ...OPTIONAL_QUOTA_KEYS];
  if (!Object.keys(entries).every((key) => allowed.includes(key))) return null;
  if (!REQUIRED_QUOTA_KEYS.every((key) => isCount(entries[key]))) return null;
  const quota: LicenseQuota = {
    venues: entries.venues as number,
    buildings: entries.buildings as number,
    floors: entries.floors as number,
    infoPoints: entries.infoPoints as number,
  };
  for (const key of OPTIONAL_QUOTA_KEYS) {
    const count = entries[key];
    if (count === undefined || count === null) continue;
    if (!isCount(count)) return null;
    quota[key] = count;
  }
  return quota;
}

export function readFeatures(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const known: readonly string[] = PAID_FEATURES;
  if (!value.every((feature) => typeof feature === 'string' && known.includes(feature))) {
    return null;
  }
  return PAID_FEATURES.filter((feature) => value.includes(feature));
}

export function readLicenseIssueRequest(value: unknown): LicenseIssueCheck {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fail('Permintaan lisensi tidak valid.');
  }
  const input = value as Record<string, unknown>;
  if (!Object.keys(input).every((key) => REQUEST_KEYS.includes(key))) {
    return fail('Permintaan lisensi tidak valid.');
  }
  if (typeof input.installationId !== 'string' || !UUID.test(input.installationId)) {
    return fail('Instalasi tidak valid.');
  }
  const plan = typeof input.plan === 'string' ? input.plan.trim() : '';
  if (plan.length === 0 || plan.length > 64) return fail('Paket wajib diisi (maks. 64 karakter).');
  const from = dayStart(input.validFrom);
  const until = dayStart(input.validUntil);
  if (from === null || until === null) return fail('Tanggal harus berformat YYYY-MM-DD.');
  if (until <= from) return fail('Tanggal berakhir harus setelah tanggal mulai.');
  if (plan === TRIAL_PLAN) {
    const problem = trialDaysProblem((until - from) / DAY_MS);
    if (problem) return fail(problem);
  }
  const quota = readQuota(input.quota);
  if (!quota) return fail(`Kuota harus bilangan bulat 0–${MAX_COUNT.toLocaleString('id-ID')}.`);
  const features = readFeatures(input.features);
  if (!features) return fail('Fitur tidak dikenal.');
  return {
    ok: true,
    request: {
      installationId: input.installationId.toLowerCase(),
      plan,
      validFrom: input.validFrom as string,
      validUntil: input.validUntil as string,
      quota,
      features,
    },
  };
}

export interface LicenseIssueContext {
  licenseId: string;
  client: string;
  instanceId: string;
  issuedAt: Date;
}

const isoSeconds = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

const JAKARTA_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' });

export const jakartaDay = (date: Date) => JAKARTA_DAY.format(date);

const jakartaDayStart = (day: string) => isoSeconds(new Date(`${day}T00:00:00+07:00`));

export function licensePayloadFor(
  request: LicenseIssueRequest,
  context: LicenseIssueContext,
): LicensePayload | null {
  return readLicensePayload({
    licenseId: context.licenseId,
    client: context.client,
    plan: request.plan,
    validFrom: jakartaDayStart(request.validFrom),
    validUntil: jakartaDayStart(request.validUntil),
    quota: request.quota,
    features: request.features,
    instanceId: context.instanceId,
    issuedAt: isoSeconds(context.issuedAt),
  });
}

export const newLicenseId = (uuid: string) =>
  `LIC-${uuid.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

export type LicenseIssueDefaults = Omit<LicenseIssueRequest, 'installationId'>;

const addDays = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

const addYear = (day: string) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
};

export function trialIssueDefaults(today: string): LicenseIssueDefaults {
  return {
    plan: TRIAL_PLAN,
    validFrom: today,
    validUntil: addDays(today, 30),
    quota: { ...TRIAL_QUOTA },
    features: [...TRIAL_FEATURES],
  };
}

export function licenseIssueDefaults(
  current: LicensePayload | null,
  today: string,
): LicenseIssueDefaults {
  if (!current) {
    return {
      plan: '',
      validFrom: today,
      validUntil: addYear(today),
      quota: { ...PAID_DEFAULT_QUOTA },
      features: [],
    };
  }
  if (current.plan === TRIAL_PLAN) return trialIssueDefaults(today);
  const currentEnd = jakartaDay(new Date(current.validUntil));
  return {
    plan: current.plan,
    validFrom: today,
    validUntil: addYear(currentEnd > today ? currentEnd : today),
    quota: { ...current.quota },
    features: [...current.features],
  };
}

export const VENDOR_LICENSE_STATUSES = ['active', 'superseded', 'revoked', 'expired'] as const;
export type VendorLicenseStatus = (typeof VENDOR_LICENSE_STATUSES)[number];

export interface VendorLicense {
  id: string;
  licenseId: string;
  status: VendorLicenseStatus;
  plan: string;
  validFrom: string;
  validUntil: string;
  issuedAt: string;
  issuedByEmail: string | null;
  revokedAt: string | null;
  file: LicenseFile;
}

export function vendorLicenseStatus(
  stored: string,
  validUntil: string,
  now: Date,
): VendorLicenseStatus | null {
  if (stored === 'active') return Date.parse(validUntil) <= now.getTime() ? 'expired' : 'active';
  return stored === 'superseded' || stored === 'revoked' ? stored : null;
}

export const licenseFileName = (license: Pick<LicenseFile, 'licenseId'>) =>
  `lisensi-${license.licenseId}.json`;
