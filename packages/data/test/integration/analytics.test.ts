import { randomUUID } from 'node:crypto';
import type { AnalyticsEvent, VenueId } from '@indoor/domain';
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

const today = new Date().toISOString().slice(0, 10);
const shift = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

describe.runIf(url && anonKey && serviceKey)('analitik penggunaan (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const venueId = randomUUID() as VenueId;
  const userIds: string[] = [];
  const visitor = createRepositories(newDb(anonKey), { url, anonKey }).analytics;
  const context = { source: 'direct', sourceRef: null, language: 'id', device: 'mobile' } as const;

  afterAll(async () => {
    await service.from('system_settings').update({ analytics_enabled: false }).eq('id', true);
    await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor') {
    const email = `${role}-${suffix}@analytics.test`;
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

  it('TC-OPS-01/03: event uji lewat endpoint cocok dengan dasbor; dimatikan = tidak tersimpan', async () => {
    await service.from('venues').insert({
      id: venueId,
      name: `Analitik ${suffix}`,
      slug: `analitik-${suffix}`,
      timezone: 'UTC',
    });
    await service.from('system_settings').update({ analytics_enabled: true }).eq('id', true);
    expect((await visitor.config()).enabled).toBe(true);

    const events: AnalyticsEvent[] = [
      { ...context, kind: 'visit' },
      { ...context, kind: 'search', query: 'Kantin', resultCount: 2 },
      { ...context, kind: 'search', query: 'xyz', resultCount: 0 },
    ];
    expect(await visitor.send(venueId, events)).toBe(3);

    const admin = await signIn('admin');
    const facts = await admin.analytics.facts(venueId, shift(-1), shift(1));
    const count = (metric: string, key: string) =>
      facts.find((f) => f.metric === metric && f.key === key && f.day === today)?.count ?? 0;
    expect(count('kind', 'visit')).toBe(1);
    expect(count('kind', 'search')).toBe(2);
    expect(count('search', 'kantin')).toBe(1);
    expect(count('search_empty', 'xyz')).toBe(1);

    const editor = await signIn('editor');
    expect(await editor.analytics.facts(venueId, shift(-1), shift(1))).toEqual([]);

    await service.from('system_settings').update({ analytics_enabled: false }).eq('id', true);
    expect((await visitor.config()).enabled).toBe(false);
    expect(await visitor.send(venueId, [{ ...context, kind: 'visit' }])).toBe(0);
    const after = await admin.analytics.facts(venueId, shift(-1), shift(1));
    expect(after.find((f) => f.metric === 'kind' && f.key === 'visit')?.count).toBe(1);
  });

  it('TC-OPS-04: kiriman melebihi batas laju ditolak tanpa melempar galat ke Visitor', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 45; i++) {
      const response = await fetch(`${url}/functions/v1/analytics`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venueId, events: [] }),
      });
      statuses.push(response.status);
      await response.body?.cancel();
    }
    expect(statuses).toContain(429);
    await expect(visitor.send(venueId, [{ ...context, kind: 'visit' }])).resolves.toBe(0);
  });
});
