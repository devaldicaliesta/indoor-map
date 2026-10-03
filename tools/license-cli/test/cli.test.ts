import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { run } from '../src/cli';

const NOW = new Date('2026-10-03T00:00:00Z');
const dir = mkdtempSync(join(tmpdir(), 'license-cli-'));
const keys = join(dir, 'keys');
const licensePath = join(dir, 'lisensi.json');
let publicKey = '';

const issueArgs = (extra: string[] = []) => [
  'issue',
  '--key',
  join(keys, 'license-private.pkcs8.b64'),
  '--client',
  'RS Contoh Sehat',
  '--plan',
  'professional',
  '--instance',
  'inst-uji',
  '--from',
  '2026-01-01',
  '--until',
  '2027-01-01',
  '--venues',
  '2',
  '--info-points',
  '10',
  '--features',
  '3d,info_point',
  '--id',
  'LIC-UJI-1',
  '--out',
  licensePath,
  ...extra,
];

beforeAll(async () => {
  const result = await run(['keygen', '--out', keys], NOW);
  expect(result.code).toBe(0);
  publicKey = result.out.trim().split('\n').at(-1) ?? '';
});

describe('license-cli', () => {
  it('keygen menyimpan kunci privat berizin 600 dan menolak menimpa', async () => {
    expect(statSync(join(keys, 'license-private.pkcs8.b64')).mode & 0o777).toBe(0o600);
    expect(publicKey).toMatch(/^[A-Za-z0-9+/]{43}=$/);
    expect((await run(['keygen', '--out', keys], NOW)).code).toBe(1);
  });

  it('keygen menolak folder di dalam repo', async () => {
    const inside = fileURLToPath(new URL('../.tmp-keys', import.meta.url));
    const result = await run(['keygen', '--out', inside], NOW);
    expect(result.code).toBe(1);
    expect(result.out).toContain('di luar repo');
  });

  it('issue menerbitkan lisensi yang sah menurut inspect', async () => {
    expect((await run(issueArgs(), NOW)).code).toBe(0);
    const file = JSON.parse(readFileSync(licensePath, 'utf8'));
    expect(file).toMatchObject({
      licenseId: 'LIC-UJI-1',
      client: 'RS Contoh Sehat',
      quota: { venues: 2, buildings: 1, floors: 10, infoPoints: 10 },
      features: ['3d', 'info_point'],
      instanceId: 'inst-uji',
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2027-01-01T00:00:00Z',
    });
    const inspected = await run(['inspect', licensePath, '--public-key', publicKey], NOW);
    expect(inspected.code).toBe(0);
    expect(inspected.out).toContain('Status: SAH');
  });

  it('inspect menolak berkas yang diubah, instance lain, dan kunci vendor lain', async () => {
    await run(issueArgs(), NOW);
    const tampered = join(dir, 'diubah.json');
    writeFileSync(
      tampered,
      readFileSync(licensePath, 'utf8').replace('"venues": 2', '"venues": 9'),
    );
    const changed = await run(['inspect', tampered, '--public-key', publicKey], NOW);
    expect(changed.code).toBe(2);
    expect(changed.out).toContain('tanda tangan tidak cocok');

    const otherInstance = await run(
      ['inspect', licensePath, '--public-key', publicKey, '--instance', 'inst-lain'],
      NOW,
    );
    expect(otherInstance.out).toContain('untuk instalasi lain');

    // Kunci publik bawaan build bukan pasangan kunci uji.
    expect((await run(['inspect', licensePath], NOW)).out).toContain('tanda tangan tidak cocok');
  });

  it('issue menolak tanggal yang salah dan argumen wajib yang hilang', async () => {
    expect((await run(issueArgs(['--until', '2025-01-01']), NOW)).code).toBe(1);
    expect((await run(issueArgs(['--until', '01-01-2027']), NOW)).code).toBe(1);
    expect((await run(['issue', '--client', 'X'], NOW)).out).toContain('--key wajib diisi');
  });

  it('bisa dijalankan langsung dengan Node', () => {
    const out = execFileSync(
      process.execPath,
      [
        fileURLToPath(new URL('../src/cli.ts', import.meta.url)),
        'inspect',
        licensePath,
        '--public-key',
        publicKey,
      ],
      {
        encoding: 'utf8',
      },
    );
    expect(out).toContain('Status: SAH');
  });
});
