import { randomUUID } from 'node:crypto';
import type { VenueId } from '@indoor/domain';
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

describe.runIf(url && anonKey && serviceKey)('template instruksi (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '' as VenueId;

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor') {
    const email = `${role}-${suffix}@instructions.test`;
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
    return createRepositories(db);
  }

  it('Admin mengubah teks aksi, Editor hanya membaca', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Instruksi ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    expect((await admin.instructionTemplates.get(venue.id)).turn_left).toEqual({
      id: 'Belok kiri',
      en: 'Turn left',
    });

    await admin.instructionTemplates.update(venue.id, 'turn_left', {
      id: 'Belok ke kiri',
      en: 'Turn to the left',
    });
    const editor = await signIn('editor');
    const read = await editor.instructionTemplates.get(venue.id);
    expect(read.turn_left).toEqual({ id: 'Belok ke kiri', en: 'Turn to the left' });
    expect(read.turn_right.id).toBe('Belok kanan');
    await expect(
      editor.instructionTemplates.update(venue.id, 'turn_left', { id: 'x', en: 'x' }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
  });
});
