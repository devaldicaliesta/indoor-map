#!/usr/bin/env node
// Alat vendor untuk kunci dan berkas lisensi. Dijalankan langsung dengan Node 22 (type
// stripping), memakai format dan verifikasi yang sama dengan aplikasi.
import { execFileSync } from 'node:child_process';
import { randomUUID, type webcrypto } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { LICENSE_PUBLIC_KEY } from '../../../packages/domain/src/license.publicKey.ts';
import {
  importLicensePublicKey,
  type LicenseFile,
  type LicensePayload,
  type LicenseQuota,
  licenseSigningBytes,
  readLicensePayload,
  TRIAL_FEATURES,
  TRIAL_PLAN,
  TRIAL_QUOTA,
  toBase64,
  trialDaysProblem,
  verifyLicense,
} from '../../../packages/domain/src/license.ts';

const PRIVATE_KEY_FILE = 'license-private.pkcs8.b64';
const PUBLIC_KEY_FILE = 'license-public.b64';

const USAGE = `Pemakaian:
  license-cli keygen --out <folder di luar repo>
  license-cli issue --key <kunci privat> --client <nama> --plan <paket> --instance <instance_id>
                    (--until <YYYY-MM-DD> | --days n) [--from <YYYY-MM-DD>] [--venues n]
                    [--buildings n] [--floors n] [--info-points n] [--features-per-floor n]
                    [--locations n] [--origin-points n] [--users n] [--storage-mb n]
                    [--max-upload-mb n] [--import-rows n] [--publish-per-day n]
                    [--features 3d,info_point] [--id <licenseId>] --out <berkas.json>
  Paket trial (--plan trial): --days 14..30, batas trial bawaan (bisa ditimpa per opsi) dan
  semua fitur.
  license-cli inspect <berkas.json> [--public-key <base64>] [--instance <instance_id>]`;

class CliError extends Error {}

/** Folder repo git tempat `path` berada; `null` bila di luar repo mana pun. */
function gitRoot(path: string): string | null {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: path,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function existingParent(path: string): string {
  let current = resolve(path);
  while (!existsSync(current)) current = dirname(current);
  return current;
}

async function keygen(outDir: string): Promise<string> {
  const target = resolve(outDir);
  // Kunci privat di dalam repo mudah ikut ter-commit dan membuka pembajakan lisensi.
  const repo = gitRoot(existingParent(target));
  if (repo && !relative(repo, target).startsWith('..')) {
    throw new CliError(
      `Folder ${target} ada di dalam repo git ${repo}. Simpan kunci di luar repo.`,
    );
  }
  const privatePath = join(target, PRIVATE_KEY_FILE);
  if (existsSync(privatePath)) {
    throw new CliError(`${privatePath} sudah ada; kunci lama tidak ditimpa.`);
  }
  const keys = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as webcrypto.CryptoKeyPair;
  const privateKey = toBase64(
    new Uint8Array(await crypto.subtle.exportKey('pkcs8', keys.privateKey)),
  );
  const publicKey = toBase64(new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey)));
  mkdirSync(target, { recursive: true, mode: 0o700 });
  writeFileSync(privatePath, `${privateKey}\n`, { mode: 0o600 });
  chmodSync(privatePath, 0o600);
  writeFileSync(join(target, PUBLIC_KEY_FILE), `${publicKey}\n`);
  return publicKey;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
function startOfDay(value: string, flag: string): string {
  if (!DATE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new CliError(`--${flag} harus berformat YYYY-MM-DD.`);
  }
  return `${value}T00:00:00Z`;
}

function count(value: string | undefined, flag: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new CliError(`--${flag} harus bilangan bulat ≥ 0.`);
  return n;
}

/** Opsi baris perintah per kunci kuota. */
const QUOTA_FLAGS: [keyof LicenseQuota, string][] = [
  ['venues', 'venues'],
  ['buildings', 'buildings'],
  ['floors', 'floors'],
  ['infoPoints', 'info-points'],
  ['features', 'features-per-floor'],
  ['locations', 'locations'],
  ['originPoints', 'origin-points'],
  ['users', 'users'],
  ['storageMb', 'storage-mb'],
  ['maxUploadMb', 'max-upload-mb'],
  ['importRows', 'import-rows'],
  ['publishPerDay', 'publish-per-day'],
];

/** Paket berbayar tanpa opsi kuota: satu venue dan gedung, 10 lantai, tanpa Info Point. */
const PAID_DEFAULT: LicenseQuota = { venues: 1, buildings: 1, floors: 10, infoPoints: 0 };
const DAY_MS = 86_400_000;

function quotaFrom(options: Record<string, string | undefined>, trial: boolean): LicenseQuota {
  const quota: LicenseQuota = { ...(trial ? TRIAL_QUOTA : PAID_DEFAULT) };
  for (const [key, flag] of QUOTA_FLAGS) {
    const value = count(options[flag], flag);
    if (value !== undefined) quota[key] = value;
  }
  return quota;
}

/** Tanggal berakhir dari --until atau --days; trial wajib 14–30 hari. */
function validUntilFrom(
  options: Record<string, string | undefined>,
  validFrom: string,
  trial: boolean,
) {
  if (options.until && options.days)
    throw new CliError('Pakai --until atau --days, bukan keduanya.');
  let validUntil: string;
  if (options.days) {
    const days = Number(options.days);
    if (!Number.isInteger(days) || days < 1) throw new CliError('--days harus bilangan bulat ≥ 1.');
    validUntil = new Date(Date.parse(validFrom) + days * DAY_MS)
      .toISOString()
      .replace(/\.\d{3}Z$/, 'Z');
  } else if (options.until) {
    validUntil = startOfDay(options.until, 'until');
  } else {
    throw new CliError(`--until atau --days wajib diisi.

${USAGE}`);
  }
  if (trial) {
    const problem = trialDaysProblem((Date.parse(validUntil) - Date.parse(validFrom)) / DAY_MS);
    if (problem) throw new CliError(problem);
  }
  return validUntil;
}

async function issue(options: Record<string, string | undefined>, now: Date): Promise<LicenseFile> {
  for (const flag of ['key', 'client', 'plan', 'instance', 'out']) {
    if (!options[flag]) throw new CliError(`--${flag} wajib diisi.\n\n${USAGE}`);
  }
  const keyText = readFileSync(options.key as string, 'utf8').trim();
  const privateKey = await crypto.subtle
    .importKey('pkcs8', Buffer.from(keyText, 'base64'), { name: 'Ed25519' }, false, ['sign'])
    .catch(() => {
      throw new CliError('Kunci privat tidak bisa dibaca (harus keluaran `license-cli keygen`).');
    });
  const today = now.toISOString().slice(0, 10);
  const trial = (options.plan as string).trim() === TRIAL_PLAN;
  const validFrom = startOfDay(options.from ?? today, 'from');
  const validUntil = validUntilFrom(options, validFrom, trial);
  const candidate = {
    licenseId: options.id ?? `LIC-${randomUUID().slice(0, 8).toUpperCase()}`,
    client: (options.client as string).trim(),
    plan: (options.plan as string).trim(),
    validFrom,
    validUntil,
    quota: quotaFrom(options, trial),
    features: (options.features ?? (trial ? TRIAL_FEATURES.join(',') : ''))
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean),
    instanceId: (options.instance as string).trim(),
    issuedAt: now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
  };
  const payload: LicensePayload | null = readLicensePayload(candidate);
  if (!payload) {
    throw new CliError('Isi lisensi tidak valid (periksa tanggal: --until harus setelah --from).');
  }
  const signature = await crypto.subtle.sign(
    { name: 'Ed25519' },
    privateKey,
    licenseSigningBytes(payload),
  );
  const file: LicenseFile = { ...payload, signature: toBase64(new Uint8Array(signature)) };
  writeFileSync(options.out as string, `${JSON.stringify(file, null, 2)}\n`);
  return file;
}

const REASONS: Record<string, string> = {
  malformed: 'format berkas tidak valid',
  bad_signature: 'tanda tangan tidak cocok (berkas diubah atau kunci lain)',
  wrong_instance: 'untuk instalasi lain',
  not_yet_valid: 'belum berlaku',
  expired: 'kedaluwarsa',
};

async function inspect(path: string, options: Record<string, string | undefined>, now: Date) {
  let content: unknown;
  try {
    content = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new CliError(`${path} bukan berkas JSON.`);
  }
  const publicKey = await importLicensePublicKey(options['public-key'] ?? LICENSE_PUBLIC_KEY);
  const payload = readLicensePayload(
    typeof content === 'object' && content !== null
      ? Object.fromEntries(Object.entries(content).filter(([k]) => k !== 'signature'))
      : null,
  );
  // Tanpa --instance, instance di berkas dianggap benar agar tanda tangan dan tanggal tetap diperiksa.
  const instance = options.instance ?? payload?.instanceId ?? '';
  const result = await verifyLicense(content, publicKey, instance, now);
  return { payload, result };
}

export async function run(
  argv: string[],
  now = new Date(),
): Promise<{ code: number; out: string }> {
  const [command, ...rest] = argv;
  try {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: Object.fromEntries(
        [
          'out',
          'key',
          'client',
          'plan',
          'instance',
          'from',
          'until',
          'days',
          ...QUOTA_FLAGS.map(([, flag]) => flag),
          'features',
          'id',
          'public-key',
        ].map((name) => [name, { type: 'string' as const }]),
      ),
    });
    if (command === 'keygen') {
      if (!values.out) throw new CliError(`--out wajib diisi.\n\n${USAGE}`);
      const publicKey = await keygen(values.out);
      return {
        code: 0,
        out: `Kunci dibuat di ${resolve(values.out)} (privat: ${PRIVATE_KEY_FILE}, izin 600).\nKunci publik untuk packages/domain/src/license.publicKey.ts:\n${publicKey}`,
      };
    }
    if (command === 'issue') {
      const file = await issue(values, now);
      return {
        code: 0,
        out: `Lisensi ${file.licenseId} untuk ${file.client} (${file.plan}) ditulis ke ${values.out}; berlaku ${file.validFrom.slice(0, 10)} s.d. ${file.validUntil.slice(0, 10)}.`,
      };
    }
    if (command === 'inspect') {
      const [path] = positionals;
      if (!path) throw new CliError(`Berkas lisensi wajib disebut.\n\n${USAGE}`);
      const { payload, result } = await inspect(path, values, now);
      const details = payload ? JSON.stringify(payload, null, 2) : '(isi tidak terbaca)';
      const status = result.valid ? 'SAH' : `DITOLAK: ${REASONS[result.reason]}`;
      return { code: result.valid ? 0 : 2, out: `${details}\n\nStatus: ${status}` };
    }
    return { code: command ? 1 : 0, out: USAGE };
  } catch (error) {
    if (error instanceof CliError) return { code: 1, out: error.message };
    if (error instanceof TypeError && 'code' in error)
      return { code: 1, out: `${error.message}\n\n${USAGE}` };
    throw error;
  }
}

// Dijalankan langsung (bukan diimpor test).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { code, out } = await run(process.argv.slice(2));
  (code === 0 ? process.stdout : process.stderr).write(`${out}\n`);
  process.exit(code);
}
