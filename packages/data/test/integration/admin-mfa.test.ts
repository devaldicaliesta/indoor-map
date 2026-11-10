import { randomUUID } from 'node:crypto';
import { type UserId, UserIdSchema } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';
import { totpCode } from '../support/totp';
import { sql } from './psql';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';
const ISSUER = 'PanduArah Admin';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function signedIn(email: string) {
  const repos = createRepositories(newDb(anonKey));
  await repos.auth.signIn(email, PASSWORD);
  return repos;
}

function auditCount(action: string, entityId: string): number {
  return Number(
    sql(`select count(*) from public.audit_events
         where action = '${action}' and entity_id = '${entityId}'`),
  );
}

// T-592a: 2FA Admin lewat Supabase Auth sungguhan — trigger audit faktor dari koneksi Auth,
// kode cadangan, wajib per role, reset Super Admin, dan Edge Function Super Admin.
describe.runIf(url && anonKey && serviceKey)('verifikasi dua langkah Admin', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const superEmail = `super-${suffix}@mfa.test`;
  const editorEmail = `editor-${suffix}@mfa.test`;
  const venueId = randomUUID();
  let superId: UserId;
  let editorId: UserId;
  let editorSecret = '';

  async function createUser(email: string, role: string): Promise<UserId> {
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    sql(`insert into public.profiles (user_id, full_name, email, role, all_venues)
           values ('${data.user.id}', '${role}', '${email}', '${role}', true)
           on conflict (user_id) do update set role = '${role}', all_venues = true`);
    return UserIdSchema.parse(data.user.id);
  }

  /** Masuk dengan password lalu kode aplikasi autentikator. */
  async function signedInAal2(email: string, secret: string) {
    const repos = await signedIn(email);
    const { factorId } = await repos.mfa.status();
    await repos.mfa.verifyTotp(factorId ?? '', totpCode(secret));
    return repos;
  }

  beforeAll(async () => {
    superId = await createUser(superEmail, 'super_admin');
    editorId = await createUser(editorEmail, 'editor');
    sql(`insert into public.venues (id, name) values ('${venueId}', 'Venue 2FA ${suffix}')`);
  });

  afterAll(async () => {
    sql(`update public.system_settings set mfa_required_roles = '{}' where id;
         delete from public.venues where id = '${venueId}';`);
    for (const id of [superId, editorId]) await service.auth.admin.deleteUser(id);
  });

  it('mengaktifkan 2FA sendiri: tercatat dan password saja tidak lagi cukup', async () => {
    const editor = await signedIn(editorEmail);
    expect(await editor.mfa.adminState()).toEqual({
      required: false,
      roleRequired: false,
      hasTotp: false,
      satisfied: true,
    });
    const enrollment = await editor.mfa.enrollTotp(ISSUER);
    editorSecret = enrollment.secret;
    await editor.mfa.verifyTotp(enrollment.factorId, totpCode(editorSecret));
    expect(auditCount('mfa_enabled', editorId)).toBe(1);

    const again = await signedIn(editorEmail);
    expect(await again.mfa.adminState()).toMatchObject({ hasTotp: true, satisfied: false });
    expect((await again.venues.list()).some((v) => v.id === venueId)).toBe(false);

    const verified = await signedInAal2(editorEmail, editorSecret);
    expect(await verified.mfa.adminState()).toMatchObject({ satisfied: true });
    expect((await verified.venues.list()).some((v) => v.id === venueId)).toBe(true);
  });

  it('kode cadangan hanya sekali dan melepas aplikasi lama', async () => {
    const editor = await signedInAal2(editorEmail, editorSecret);
    const codes = await editor.mfa.generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(await editor.mfa.recoveryCodesLeft()).toBe(10);

    const lost = await signedIn(editorEmail);
    await expect(lost.mfa.recover('AAAAA-AAAAA')).resolves.toBe(false);
    await expect(lost.mfa.recover(codes[0] ?? '')).resolves.toBe(true);
    expect(await lost.mfa.adminState()).toEqual({
      required: false,
      roleRequired: false,
      hasTotp: false,
      satisfied: true,
    });
    await expect(lost.mfa.recover(codes[0] ?? '')).resolves.toBe(false);
    await expect(lost.mfa.recover(codes[1] ?? '')).resolves.toBe(false);
  });

  it('mematikan 2FA sendiri lewat Auth tercatat dan menggugurkan kode cadangan', async () => {
    const editor = await signedIn(editorEmail);
    const enrollment = await editor.mfa.enrollTotp(ISSUER);
    editorSecret = enrollment.secret;
    await editor.mfa.verifyTotp(enrollment.factorId, totpCode(editorSecret));
    await editor.mfa.generateRecoveryCodes();

    await editor.mfa.unenrollTotp(enrollment.factorId);
    expect(auditCount('mfa_disabled', editorId)).toBe(1);
    expect(await editor.mfa.recoveryCodesLeft()).toBe(0);
    expect(await editor.mfa.adminState()).toMatchObject({ hasTotp: false, satisfied: true });
  });

  it('role yang diwajibkan diminta mendaftar; Super Admin mereset 2FA', async () => {
    const admin = await signedIn(superEmail);
    await admin.systemSettings.update({ mfaRequiredRoles: ['editor'] });

    const editor = await signedIn(editorEmail);
    expect(await editor.mfa.adminState()).toEqual({
      required: true,
      roleRequired: true,
      hasTotp: false,
      satisfied: false,
    });
    expect((await editor.venues.list()).some((v) => v.id === venueId)).toBe(false);
    const enrollment = await editor.mfa.enrollTotp(ISSUER);
    await editor.mfa.verifyTotp(enrollment.factorId, totpCode(enrollment.secret));
    expect(await editor.mfa.adminState()).toMatchObject({ satisfied: true });

    expect((await admin.mfa.enabledUserIds()).has(editorId)).toBe(true);
    await admin.mfa.resetForUser(editorId);
    expect((await admin.mfa.enabledUserIds()).has(editorId)).toBe(false);
    expect(auditCount('mfa_reset', editorId)).toBe(1);
    expect(sql(`select count(*) from auth.sessions where user_id = '${editorId}'`)).toBe('0');
  });

  it('Edge Function Super Admin menolak sesi tanpa kode bila 2FA aktif', async () => {
    const admin = await signedIn(superEmail);
    const enrollment = await admin.mfa.enrollTotp(ISSUER);
    await admin.mfa.verifyTotp(enrollment.factorId, totpCode(enrollment.secret));

    const passwordOnly = await signedIn(superEmail);
    // Tanpa pemeriksaan 2FA, fungsi ini lolos ke langkah SMTP dan gagal dengan pesan lain.
    await expect(passwordOnly.systemSettings.sendTestEmail()).rejects.toMatchObject({
      kind: 'forbidden',
      message: 'Hanya Super Admin yang bisa mengirim email uji.',
    });
    await expect(passwordOnly.mfa.resetForUser(editorId)).rejects.toMatchObject({
      kind: 'forbidden',
    });
  });
});
