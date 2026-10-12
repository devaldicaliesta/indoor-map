// Form permintaan trial di landing page (T-505). Dipakai landing (validasi di browser) dan
// Edge Function `trial-request` di server vendor (Deno), jadi tanpa zod dan tanpa impor lain.

import { TRIAL_MAX_DAYS, TRIAL_MIN_DAYS } from './license.ts';

export const BUILDING_TYPES = [
  'mall',
  'hospital',
  'campus',
  'office',
  'airport',
  'industrial',
  'event',
  'other',
] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

/** Perkiraan luas lantai total. */
export const BUILDING_SIZES = ['lt5k', '5k-20k', '20k-50k', 'gt50k'] as const;
export type BuildingSize = (typeof BUILDING_SIZES)[number];

export interface TrialRequestInput {
  name: string;
  institution: string;
  title: string;
  email: string;
  phone: string;
  buildingType: BuildingType;
  buildingSize: BuildingSize;
  durationDays: number;
  /** ID instalasi bila server sudah terpasang; kosong bila belum. */
  installId: string;
  consent: boolean;
  /** Bahasa email konfirmasi. */
  language: 'id' | 'en';
}

export type TrialRequestField = Exclude<keyof TrialRequestInput, 'language'>;
export type TrialRequestProblem = 'required' | 'too_long' | 'invalid' | 'out_of_range';

export type TrialRequestCheck =
  | { ok: true; value: TrialRequestInput }
  | { ok: false; problems: Partial<Record<TrialRequestField, TrialRequestProblem>> };

const LIMITS = { name: 100, institution: 150, title: 100, email: 200, phone: 20 } as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9][0-9 ()-]{6,18}[0-9]$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Baris baru di isian satu baris bisa menyisipkan header email (mis. "\r\nBcc:").
const hasControl = (value: string) =>
  [...value].some((c) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f);

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/**
 * Memeriksa isian form trial. Semua isian satu baris; karakter kontrol ditolak agar tidak bisa
 * menyisipkan header email. HTML tidak ditolak tetapi selalu ditampilkan sebagai teks.
 */
export function checkTrialRequest(input: Record<string, unknown>): TrialRequestCheck {
  const problems: Partial<Record<TrialRequestField, TrialRequestProblem>> = {};
  const line = (field: keyof typeof LIMITS, required: boolean) => {
    const raw = typeof input[field] === 'string' ? (input[field] as string) : '';
    const value = text(raw);
    if (!value) {
      if (required) problems[field] = 'required';
    } else if (value.length > LIMITS[field]) problems[field] = 'too_long';
    else if (hasControl(raw)) problems[field] = 'invalid';
    return value;
  };
  const name = line('name', true);
  const institution = line('institution', true);
  const title = line('title', true);
  const email = line('email', true).toLowerCase();
  if (email && !problems.email && !EMAIL.test(email)) problems.email = 'invalid';
  const phone = line('phone', true);
  if (phone && !problems.phone && !PHONE.test(phone)) problems.phone = 'invalid';

  const buildingType = text(input.buildingType);
  if (!buildingType) problems.buildingType = 'required';
  else if (!(BUILDING_TYPES as readonly string[]).includes(buildingType)) {
    problems.buildingType = 'invalid';
  }
  const buildingSize = text(input.buildingSize);
  if (!buildingSize) problems.buildingSize = 'required';
  else if (!(BUILDING_SIZES as readonly string[]).includes(buildingSize)) {
    problems.buildingSize = 'invalid';
  }

  const durationDays =
    typeof input.durationDays === 'number' ? input.durationDays : Number(text(input.durationDays));
  if (!Number.isInteger(durationDays)) problems.durationDays = 'invalid';
  else if (durationDays < TRIAL_MIN_DAYS || durationDays > TRIAL_MAX_DAYS) {
    problems.durationDays = 'out_of_range';
  }

  const installId = text(input.installId);
  if (installId && !UUID.test(installId)) problems.installId = 'invalid';
  if (input.consent !== true) problems.consent = 'required';

  if (Object.keys(problems).length > 0) return { ok: false, problems };
  return {
    ok: true,
    value: {
      name,
      institution,
      title,
      email,
      phone,
      buildingType: buildingType as BuildingType,
      buildingSize: buildingSize as BuildingSize,
      durationDays,
      installId: installId.toLowerCase(),
      consent: true,
      language: input.language === 'en' ? 'en' : 'id',
    },
  };
}

/**
 * Batas laju sederhana per kunci (alamat IP): paling banyak `max` permintaan dalam `windowMs`.
 * Disimpan di memori proses; cukup untuk menahan kiriman beruntun dari satu alamat.
 */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()): boolean => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    // Kunci lama dibuang agar peta tidak tumbuh tanpa batas.
    if (hits.size > 10_000) {
      for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
    return true;
  };
}

/** Lama trial ter-hosting (F2-K, `23-trial-hosting.md` §1): tetap, pemohon tidak memilih. */
export const HOSTED_TRIAL_DAYS = 17;

/** Isian form trial ter-hosting: tanpa lama trial dan tanpa ID instalasi. */
export type HostedTrialRequestInput = Omit<TrialRequestInput, 'durationDays' | 'installId'>;

export type HostedTrialRequestCheck =
  | { ok: true; value: HostedTrialRequestInput }
  | { ok: false; problems: Partial<Record<TrialRequestField, TrialRequestProblem>> };

/**
 * Memeriksa isian form trial ter-hosting dengan aturan yang sama dengan `checkTrialRequest`;
 * `durationDays` dan `installId` dari form lama diabaikan.
 */
export function checkHostedTrialRequest(input: Record<string, unknown>): HostedTrialRequestCheck {
  const check = checkTrialRequest({ ...input, durationDays: TRIAL_MIN_DAYS, installId: '' });
  if (!check.ok) return check;
  const { name, institution, title, email, phone, buildingType, buildingSize, consent, language } =
    check.value;
  return {
    ok: true,
    value: {
      name,
      institution,
      title,
      email,
      phone,
      buildingType,
      buildingSize,
      consent,
      language,
    },
  };
}
