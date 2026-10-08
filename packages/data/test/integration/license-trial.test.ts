import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { FloorId } from '@indoor/domain';
import {
  type LicensePayload,
  licenseSigningBytes,
  TRIAL_QUOTA,
  toBase64,
} from '@indoor/domain/license';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createVendorStub } from '../../../../tools/vendor-stub/src/server';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';
const MB = 1024 * 1024;
const DEV_KEY = fileURLToPath(
  new URL('../../../../tools/license-cli/dev-keys/license-private.pkcs8.b64', import.meta.url),
);

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

/** Lisensi berbayar bertanda tangan kunci dev, untuk menguji upgrade dari trial. */
async function paidLicense(instanceId: string) {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(readFileSync(DEV_KEY, 'utf8').trim(), 'base64'),
    { name: 'Ed25519' },
    false,
    ['sign'],
  );
  const payload: LicensePayload = {
    licenseId: `LIC-UPGRADE-${randomUUID().slice(0, 6).toUpperCase()}`,
    client: 'Mal Calon Klien',
    plan: 'professional',
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2099-01-01T00:00:00Z',
    quota: { venues: 100_000, buildings: 100_000, floors: 100_000, infoPoints: 100_000 },
    features: ['3d', 'info_point', 'cad_import'],
    instanceId,
    issuedAt: '2026-10-08T00:00:00Z',
  };
  const signature = await crypto.subtle.sign(
    { name: 'Ed25519' },
    privateKey,
    licenseSigningBytes(payload),
  );
  return { ...payload, signature: toBase64(new Uint8Array(signature)) };
}

// Trial otomatis (T-504) lewat Edge Function `license-activate` ke vendor-stub di port 8091.
describe.runIf(url && anonKey && serviceKey)('lisensi trial', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  const uploaded: string[] = [];
  let superAdmin: DataClient;
  let superAdminDb: ReturnType<typeof newDb>;
  let admin: DataClient;
  let stub: Server;
  let original: { id: string } | null = null;
  let floorId: FloorId;

  async function signIn(role: 'super_admin' | 'admin') {
    const email = `${role}-${suffix}@trial.test`;
    const created = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    const id = created.data.user?.id ?? '';
    userIds.push(id);
    await service.from('profiles').insert({ user_id: id, full_name: role, email, role });
    const db = newDb(anonKey);
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    return { db, repositories: createRepositories(db) };
  }

  beforeAll(async () => {
    stub = await createVendorStub();
    await new Promise<void>((resolve) => stub.listen(8091, '0.0.0.0', resolve));
    const signedIn = await signIn('super_admin');
    superAdmin = signedIn.repositories;
    superAdminDb = signedIn.db;
    admin = (await signIn('admin')).repositories;
    const { data } = await service
      .from('licenses')
      .select('id')
      .eq('is_current', true)
      .maybeSingle();
    original = data;
    const floor = await service.from('floors').select('id').eq('is_outdoor', false).limit(1);
    floorId = floor.data?.[0]?.id as FloorId;
  });

  afterAll(async () => {
    stub?.close();
    if (uploaded.length) await service.storage.from('floor-plans').remove(uploaded);
    if (original) {
      await service.from('licenses').update({ is_current: false }).eq('is_current', true);
      await service.from('licenses').update({ is_current: true }).eq('id', original.id);
    }
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it('hanya Super Admin yang bisa memulai trial pada instalasi yang sudah berjalan', async () => {
    const error = await admin.license
      .startTrial({ name: 'Admin', institution: 'Mal Uji', email: `ad-${suffix}@mal-uji.id` })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DataError);
    expect((error as DataError).kind).toBe('forbidden');
  });

  it('isian salah ditolak sebelum menghubungi vendor', async () => {
    const error = await superAdmin.license
      .startTrial({ name: 'Rina', institution: 'Mal Uji', email: 'bukan-email' })
      .catch((e: unknown) => e);
    expect((error as DataError).message).toContain('email tidak valid');
  });

  it('Mulai trial: aktif dalam satu permintaan, batas trial berlaku, trial kedua ditolak', async () => {
    const started = Date.now();
    const license = await superAdmin.license.startTrial({
      name: 'Rina Calon Klien',
      institution: `Mal Calon Klien ${suffix}`,
      email: `rina-${suffix}@calon-${suffix}.co.id`,
    });
    expect(Date.now() - started).toBeLessThan(60_000);
    expect(license.plan).toBe('trial');
    const status = await superAdmin.license.status();
    expect(status).toMatchObject({ state: 'active', isTrial: true });
    const usage = await superAdmin.license.usage();
    expect(usage.find((u) => u.kind === 'locations')?.quota).toBe(TRIAL_QUOTA.locations);
    expect(usage.find((u) => u.kind === 'floors')?.quota).toBe(TRIAL_QUOTA.floors);
    expect(await superAdmin.license.limits()).toEqual({ maxUploadMb: 20, importRows: 500 });

    const again = await superAdmin.license
      .startTrial({
        name: 'Rina',
        institution: 'Mal Calon Klien',
        email: `lain-${suffix}@contoh-${suffix}.id`,
      })
      .catch((e: unknown) => e);
    expect((again as DataError).message).toContain('sudah pernah mendapat trial');
  });

  it('denah 21 MB ditolak dengan pesan batas trial, juga bila pemeriksa dilewati', async () => {
    const big = new File([new Uint8Array(21 * MB)], 'denah.png', { type: 'image/png' });
    const error = await superAdmin.floorPlans
      .upload(floorId, { source: big } as never)
      .catch((e: unknown) => e);
    expect((error as DataError).message).toContain(
      'Batas trial tercapai: ukuran berkas (MB) 21/20',
    );

    // Langsung ke Storage tanpa pemeriksa: trigger Storage tetap menolak.
    const path = `uji-trial/${suffix}-besar.png`;
    const direct = await superAdminDb.storage.from('floor-plans').upload(path, big);
    expect(direct.error).not.toBeNull();
    const listed = await service.storage.from('floor-plans').list('uji-trial');
    expect(listed.data?.some((o) => o.name === `${suffix}-besar.png`)).toBe(false);

    const small = `uji-trial/${suffix}-kecil.png`;
    const ok = await superAdminDb.storage
      .from('floor-plans')
      .upload(small, new File([new Uint8Array(MB)], 'kecil.png', { type: 'image/png' }));
    expect(ok.error).toBeNull();
    uploaded.push(small);
  });

  it('impor 501 baris ditolak server; 500 baris lolos pemeriksaan', async () => {
    const row = {
      id: null,
      code: null,
      name: 'X',
      description: '',
      status: 'active' as const,
      openingDate: null,
      categoryIds: [],
      unitIds: [],
      customFields: {},
    };
    const error = await superAdmin.locations
      .importRows(
        randomUUID() as never,
        randomUUID() as never,
        Array.from({ length: 501 }, () => row),
      )
      .catch((e: unknown) => e);
    expect((error as DataError).message).toContain('Batas trial tercapai: baris impor 501/500');
    await expect(superAdminDb.rpc('license_import_check', { p_rows: 500 })).resolves.toMatchObject({
      error: null,
    });
  });

  it('upgrade ke lisensi berbayar: batas terangkat dan data tetap ada', async () => {
    const before = await service.from('locations').select('id', { count: 'exact', head: true });
    const instanceId = (await superAdmin.license.status()).instanceId;
    await superAdmin.license.activateManual(await paidLicense(instanceId));
    const status = await superAdmin.license.status();
    expect(status).toMatchObject({ state: 'active', isTrial: false });
    expect(await superAdmin.license.limits()).toEqual({ maxUploadMb: null, importRows: null });
    const usage = await superAdmin.license.usage();
    expect(usage.find((u) => u.kind === 'locations')?.quota).toBeNull();
    const after = await service.from('locations').select('id', { count: 'exact', head: true });
    expect(after.count).toBe(before.count);
  });
});
