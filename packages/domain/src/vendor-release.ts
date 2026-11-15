const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VERSION = /^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface CheckinRequest {
  licenseId: string;
  instanceId: string;
  version: string | null;
}

export type CheckinCheck = { ok: true; request: CheckinRequest } | { ok: false; message: string };

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export function checkCheckinRequest(value: unknown): CheckinCheck {
  const input =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const licenseId = text(input.licenseId);
  const instanceId = text(input.instanceId).toLowerCase();
  const version = text(input.version);
  if (!licenseId || licenseId.length > 100) {
    return { ok: false, message: 'ID lisensi wajib diisi.' };
  }
  if (!UUID.test(instanceId)) return { ok: false, message: 'ID instalasi tidak valid.' };
  return {
    ok: true,
    request: { licenseId, instanceId, version: VERSION.test(version) ? version : null },
  };
}

export interface VendorCheckin {
  at: string;
  version: string | null;
  ip: string | null;
}

export interface VendorRelease {
  id: string;
  version: string;
  releasedOn: string;
  notes: string;
  downloadUrl: string;
  sha256: string;
  createdByEmail: string | null;
  createdAt: string;
}

export interface NewVendorRelease {
  version: string;
  releasedOn: string;
  notes: string;
  downloadUrl: string;
  sha256: string;
}

export type ReleaseCheck = { ok: true; release: NewVendorRelease } | { ok: false; message: string };

export function readSha256(value: string): string {
  return value.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
}

export function checkNewRelease(input: NewVendorRelease, today: string): ReleaseCheck {
  const version = input.version.trim();
  const downloadUrl = input.downloadUrl.trim();
  const sha256 = readSha256(input.sha256);
  const notes = input.notes.trim();
  if (!VERSION.test(version)) {
    return {
      ok: false,
      message: 'Versi hanya huruf, angka, titik, garis bawah, dan tanda hubung (maks. 64).',
    };
  }
  if (!DATE.test(input.releasedOn) || input.releasedOn > today) {
    return { ok: false, message: 'Tanggal rilis wajib diisi dan tidak boleh di masa depan.' };
  }
  if (!/^https:\/\/\S+$/.test(downloadUrl) || downloadUrl.length > 2000) {
    return { ok: false, message: 'Alamat unduh harus diawali https://.' };
  }
  if (!SHA256.test(sha256)) {
    return { ok: false, message: 'SHA-256 harus 64 karakter heksadesimal (isi berkas .sha256).' };
  }
  if (notes.length > 2000) return { ok: false, message: 'Catatan rilis maks. 2000 karakter.' };
  return {
    ok: true,
    release: { version, releasedOn: input.releasedOn, notes, downloadUrl, sha256 },
  };
}

export type InstallationReleaseState =
  | { kind: 'unknown' }
  | { kind: 'latest' }
  | { kind: 'outdated'; latest: string };

export function installationReleaseState(
  version: string | null,
  releases: readonly VendorRelease[],
): InstallationReleaseState {
  const [latest] = releases;
  if (!version || !latest) return { kind: 'unknown' };
  return version === latest.version
    ? { kind: 'latest' }
    : { kind: 'outdated', latest: latest.version };
}
