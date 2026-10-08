// Format dan verifikasi lisensi. Dipakai Admin, Edge Function (Deno), dan alat vendor
// `tools/license-cli` (Node), jadi tanpa zod dan hanya impor berekstensi `.ts`. Tanda tangan
// Ed25519 lewat WebCrypto; tidak ada kriptografi buatan sendiri. Diimpor lewat
// `@indoor/domain/license`, tidak lewat indeks paket, karena butuh WebCrypto (paket tanpa lib DOM
// seperti `routing` tidak perlu ikut memeriksanya).

export interface LicenseQuota {
  venues: number;
  buildings: number;
  floors: number;
  infoPoints: number;
  // Batas tambahan (T-504, terutama paket trial). Yang tidak diisi berarti tidak dibatasi,
  // sehingga berkas lisensi lama tetap sah dan tanda tangannya tetap cocok.
  /** Fitur peta per lantai. */
  features?: number;
  locations?: number;
  originPoints?: number;
  /** Pengguna Admin aktif. */
  users?: number;
  /** Total Storage (denah, foto, ikon, snapshot) dalam MB. */
  storageMb?: number;
  /** Ukuran satu berkas unggahan dalam MB. */
  maxUploadMb?: number;
  /** Baris per impor massal. */
  importRows?: number;
  /** Publish per venue per hari (zona waktu venue). */
  publishPerDay?: number;
}

/** Batas yang boleh tidak ada di berkas lisensi; urutannya dipakai tampilan. */
export const OPTIONAL_QUOTA_KEYS = [
  'features',
  'locations',
  'originPoints',
  'users',
  'storageMb',
  'maxUploadMb',
  'importRows',
  'publishPerDay',
] as const satisfies readonly (keyof LicenseQuota)[];

/** Paket trial: 14–30 hari dengan batas data agar server tidak berat (T-504). */
export const TRIAL_PLAN = 'trial';
export const TRIAL_MIN_DAYS = 14;
export const TRIAL_MAX_DAYS = 30;

/** Batas bawaan paket trial (`21-F2-task.md` T-504); vendor bisa menyesuaikan per permintaan. */
export const TRIAL_QUOTA: Required<LicenseQuota> = {
  venues: 1,
  buildings: 2,
  floors: 6,
  infoPoints: 2,
  features: 1000,
  locations: 300,
  originPoints: 20,
  users: 5,
  storageMb: 1024,
  maxUploadMb: 20,
  importRows: 500,
  publishPerDay: 20,
};

/** Trial membuka semua fitur berbayar agar calon klien bisa mencoba semuanya. */
export const TRIAL_FEATURES = ['3d', 'info_point', 'cad_import'];

export const isTrialLicense = (license: Pick<LicensePayload, 'plan'>): boolean =>
  license.plan === TRIAL_PLAN;

/** Lama trial yang boleh diterbitkan; pesan bila di luar 14–30 hari. */
export function trialDaysProblem(days: number): string | null {
  if (!Number.isInteger(days)) return 'Lama trial harus bilangan bulat hari.';
  if (days < TRIAL_MIN_DAYS || days > TRIAL_MAX_DAYS) {
    return `Lama trial harus ${TRIAL_MIN_DAYS}–${TRIAL_MAX_DAYS} hari.`;
  }
  return null;
}

/** Isi yang ditandatangani vendor. Tanggal dalam ISO 8601 UTC. */
export interface LicensePayload {
  licenseId: string;
  client: string;
  /** Nama paket dari Vendor Portal; isi paket ada di `quota` dan `features`. */
  plan: string;
  validFrom: string;
  validUntil: string;
  quota: LicenseQuota;
  features: string[];
  /** Instalasi yang boleh memakai lisensi ini (`installation.instance_id`). */
  instanceId: string;
  issuedAt: string;
}

/** Berkas lisensi: payload ditambah `signature` (base64) atas `canonicalize(payload)`. */
export interface LicenseFile extends LicensePayload {
  signature: string;
}

export type LicenseRejection =
  | 'malformed'
  | 'bad_signature'
  | 'wrong_instance'
  | 'not_yet_valid'
  | 'expired';

export type LicenseVerification =
  | { valid: true; license: LicensePayload }
  | { valid: false; reason: LicenseRejection };

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/**
 * JSON kanonis: kunci objek diurutkan (titik kode), tanpa spasi. Payload yang sama selalu
 * menghasilkan bait yang sama, sehingga tanda tangan tidak bergantung pada urutan kunci.
 */
export function canonicalize(value: Json): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k] as Json)}`).join(',')}}`;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error('Angka tidak hingga tidak bisa dikanonisasi.');
  }
  return JSON.stringify(value);
}

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const isText = (v: unknown, max = 200): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const isDate = (v: unknown): v is string =>
  typeof v === 'string' && ISO_UTC.test(v) && !Number.isNaN(Date.parse(v));
const isCount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 1_000_000;

const PAYLOAD_KEYS = [
  'licenseId',
  'client',
  'plan',
  'validFrom',
  'validUntil',
  'quota',
  'features',
  'instanceId',
  'issuedAt',
] as const;
const QUOTA_KEYS = ['venues', 'buildings', 'floors', 'infoPoints'] as const;

const sameKeys = (value: object, keys: readonly string[]) => {
  const own = Object.keys(value);
  return own.length === keys.length && keys.every((k) => own.includes(k));
};

/** Kunci wajib semuanya ada, kunci pilihan boleh ada, selain itu ditolak. */
const knownKeys = (value: object, required: readonly string[], optional: readonly string[]) => {
  const own = Object.keys(value);
  return (
    required.every((k) => own.includes(k)) &&
    own.every((k) => required.includes(k) || optional.includes(k))
  );
};

/** Payload dari objek apa pun; `null` bila bentuknya tidak persis sesuai format. */
export function readLicensePayload(value: unknown): LicensePayload | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  // Kunci tambahan ditolak: semua yang ada di berkas harus ikut ditandatangani.
  if (!sameKeys(value, PAYLOAD_KEYS)) return null;
  const v = value as Record<(typeof PAYLOAD_KEYS)[number], unknown>;
  const quota = v.quota;
  if (typeof quota !== 'object' || quota === null || Array.isArray(quota)) return null;
  if (!knownKeys(quota, QUOTA_KEYS, OPTIONAL_QUOTA_KEYS)) return null;
  const q = quota as Record<keyof LicenseQuota, unknown>;
  if (!QUOTA_KEYS.every((k) => isCount(q[k]))) return null;
  if (!OPTIONAL_QUOTA_KEYS.every((k) => q[k] === undefined || isCount(q[k]))) return null;
  // Hanya kunci yang ada di berkas yang ikut, agar bait yang diperiksa sama dengan yang ditandatangani.
  const optional: Partial<LicenseQuota> = {};
  for (const k of OPTIONAL_QUOTA_KEYS) {
    if (q[k] !== undefined) optional[k] = q[k] as number;
  }
  if (!Array.isArray(v.features) || !v.features.every((f) => isText(f, 64))) return null;
  if (
    !isText(v.plan, 64) ||
    !isText(v.licenseId, 64) ||
    !isText(v.client) ||
    !isText(v.instanceId, 128)
  )
    return null;
  if (!isDate(v.validFrom) || !isDate(v.validUntil) || !isDate(v.issuedAt)) return null;
  if (Date.parse(v.validUntil) <= Date.parse(v.validFrom)) return null;
  return {
    licenseId: v.licenseId,
    client: v.client,
    plan: v.plan,
    validFrom: v.validFrom,
    validUntil: v.validUntil,
    quota: {
      venues: q.venues as number,
      buildings: q.buildings as number,
      floors: q.floors as number,
      infoPoints: q.infoPoints as number,
      ...optional,
    },
    features: [...(v.features as string[])],
    instanceId: v.instanceId,
    issuedAt: v.issuedAt,
  };
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(text)) return null;
  try {
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Bait yang ditandatangani: JSON kanonis payload dalam UTF-8. */
export function licenseSigningBytes(payload: LicensePayload): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(canonicalize(payload as unknown as Json));
}

/** Kunci WebCrypto; diturunkan dari `importKey` agar sama di browser, Deno, dan Node. */
export type LicenseVerifyKey = Awaited<ReturnType<typeof crypto.subtle.importKey>>;

/** Kunci publik vendor: 32 bait Ed25519 mentah dalam base64. */
export async function importLicensePublicKey(base64: string): Promise<LicenseVerifyKey> {
  const raw = fromBase64(base64);
  if (!raw || raw.length !== 32) throw new Error('Kunci publik lisensi tidak valid.');
  return crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, false, ['verify']);
}

/**
 * Memeriksa berkas lisensi: bentuk, tanda tangan vendor, instalasi, lalu masa berlaku.
 * Urutannya membuat berkas yang diubah selalu ditolak sebagai `bad_signature`, apa pun isinya.
 */
export async function verifyLicense(
  file: unknown,
  publicKey: LicenseVerifyKey,
  instanceId: string,
  now: Date,
): Promise<LicenseVerification> {
  if (typeof file !== 'object' || file === null || Array.isArray(file)) {
    return { valid: false, reason: 'malformed' };
  }
  const { signature, ...rest } = file as Record<string, unknown>;
  const payload = readLicensePayload(rest);
  const signatureBytes = typeof signature === 'string' ? fromBase64(signature) : null;
  if (!payload || !signatureBytes || signatureBytes.length !== 64) {
    return { valid: false, reason: 'malformed' };
  }
  const signed = await crypto.subtle.verify(
    { name: 'Ed25519' },
    publicKey,
    signatureBytes,
    licenseSigningBytes(payload),
  );
  if (!signed) return { valid: false, reason: 'bad_signature' };
  if (payload.instanceId !== instanceId) return { valid: false, reason: 'wrong_instance' };
  if (now.getTime() < Date.parse(payload.validFrom))
    return { valid: false, reason: 'not_yet_valid' };
  if (now.getTime() >= Date.parse(payload.validUntil)) return { valid: false, reason: 'expired' };
  return { valid: true, license: payload };
}
