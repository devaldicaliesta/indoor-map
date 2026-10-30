import { randomUUID } from 'node:crypto';
import { userDataExportFilename } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

describe.runIf(url && anonKey && serviceKey)('data akun UU PDP (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];

  afterAll(async () => {
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function createAccount(name: string, role: 'super_admin' | 'editor') {
    const email = `${name}-${suffix}@pdp.test`;
    const created = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    const id = created.data.user?.id ?? '';
    userIds.push(id);
    await service.from('profiles').insert({ user_id: id, full_name: name, email, role });
    return { id, email };
  }

  async function signIn(email: string) {
    const db = newDb(anonKey);
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    return createRepositories(db);
  }

  it('TC-KOM-01: Super Admin mengekspor lalu menghapus akun; keduanya tercatat di audit', async () => {
    const admin = await createAccount('sa', 'super_admin');
    const editor = await createAccount('editor', 'editor');
    const editorRepos = await signIn(editor.email);
    await editorRepos.tours.markSeen('locations@1');

    // Editor tidak bisa mengekspor atau menghapus akun siapa pun.
    await expect(editorRepos.users.exportData(admin.id)).rejects.toMatchObject({
      kind: 'forbidden',
    });
    await expect(editorRepos.users.remove(admin.id)).rejects.toMatchObject({ kind: 'forbidden' });

    const repos = await signIn(admin.email);
    const exported = await repos.users.exportData(editor.id);
    expect(exported.format).toBe('panduarah.user-data/1');
    expect(exported.document.account).toMatchObject({ email: editor.email, role: 'editor' });
    expect(exported.document.tour_progress).toEqual([
      expect.objectContaining({ tour_key: 'locations@1' }),
    ]);
    expect(userDataExportFilename(editor.email, exported.exportedAt)).toMatch(
      /^data-akun-editor-[a-z0-9]+-pdp-test-\d{4}-\d{2}-\d{2}\.json$/,
    );

    await repos.users.remove(editor.id);
    const auth = await service.auth.admin.getUserById(editor.id);
    expect(auth.data.user).toBeNull();
    expect((await repos.profiles.list()).some((p) => p.userId === editor.id)).toBe(false);
    await expect(repos.users.exportData(editor.id)).rejects.toMatchObject({ kind: 'conflict' });

    const events = await repos.audit.listRecent();
    const about = events.filter((e) => e.entityId === editor.id).map((e) => e.action);
    expect(about).toEqual(expect.arrayContaining(['user_data_exported', 'user_data_deleted']));
    const deleted = events.find(
      (e) => e.action === 'user_data_deleted' && e.entityId === editor.id,
    );
    expect(deleted?.actor?.userId).toBe(admin.id);
    expect(deleted?.details).toEqual({ role: 'editor' });
  });

  it('Super Admin tidak bisa menghapus akunnya sendiri', async () => {
    const admin = await createAccount('sa-diri', 'super_admin');
    const repos = await signIn(admin.email);
    await expect(repos.users.remove(admin.id)).rejects.toMatchObject({ kind: 'conflict' });
  });
});
