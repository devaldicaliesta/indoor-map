import { createHmac, randomUUID } from 'node:crypto';
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { VenueId } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';
import { sql } from './psql';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';
const RECEIVER_PORT = 8093;
// Edge runtime berjalan di kontainer; penerima uji ada di host.
const RECEIVER_HOST = process.env.WEBHOOK_TEST_HOST ?? 'host.docker.internal';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

interface Received {
  headers: IncomingHttpHeaders;
  body: string;
}

const verify = (secret: string, { headers, body }: Received) => {
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const mac = createHmac('sha256', key)
    .update(`${headers['webhook-id']}.${headers['webhook-timestamp']}.${body}`)
    .digest('base64');
  return headers['webhook-signature'] === `v1,${mac}`;
};

async function until<T>(read: () => Promise<T | undefined> | T | undefined, ms = 20_000) {
  const end = Date.now() + ms;
  for (;;) {
    const value = await read();
    if (value !== undefined) return value;
    if (Date.now() > end) throw new Error('Waktu tunggu habis');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

// Butuh edge runtime lokal (`api`, `webhook-dispatch`) dan port 8093 di host yang bisa dijangkau
// kontainer lewat host.docker.internal.
describe.runIf(url && anonKey && serviceKey)('API integrasi dan webhook (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  const received: Received[] = [];
  const replies: number[] = [];
  const visitor = createRepositories(newDb(anonKey));
  const api = `${url}/functions/v1/api/v1`;
  let server: Server;
  let superAdmin: DataClient;
  let venueId = '' as VenueId;
  let readKey = '';
  let writeKey = '';
  let writeKeyId = '';

  const call = (path: string, key: string, init: RequestInit = {}) =>
    fetch(`${api}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    });

  beforeAll(async () => {
    server = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        received.push({ headers: req.headers, body });
        res.statusCode = replies.shift() ?? 200;
        res.end('ok');
      });
    });
    await new Promise<void>((resolve) => server.listen(RECEIVER_PORT, '0.0.0.0', resolve));

    const email = `sa-${suffix}@api.test`;
    const created = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    const id = created.data.user?.id ?? '';
    userIds.push(id);
    await service
      .from('profiles')
      .insert({ user_id: id, full_name: 'SA', email, role: 'super_admin' });
    const db = newDb(anonKey);
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    superAdmin = createRepositories(db);
  });

  afterAll(async () => {
    server?.close();
    await service.from('webhooks').delete().like('name', `%${suffix}%`);
    if (venueId) {
      await service.storage
        .from('snapshots')
        .remove([`${venueId}/v1.json`, `${venueId}/v1.graph.json`, `${venueId}/latest.json`]);
      await service.from('venues').delete().eq('id', venueId);
    }
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it('venue siap publish dengan satu lokasi berkode', async () => {
    const venue = await superAdmin.venues.create({
      name: `API ${suffix}`,
      address: 'Jl. Kenari 9, Jakarta',
      center: { type: 'Point', coordinates: [106.8272, -6.1754] },
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    const building = await superAdmin.buildings.create(venueId, {
      name: 'Gedung',
      code: 'G',
      footprint: null,
    });
    const floor = await superAdmin.floors.create(building.id, { name: 'GF', level: 0, heightM: 4 });
    const unitId = randomUUID();
    await superAdmin.features.save(venueId, {
      type: 'Feature',
      id: unitId,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [106.8271, -6.1754],
            [106.8272, -6.1754],
            [106.8272, -6.1755],
            [106.8271, -6.1754],
          ],
        ],
      },
      properties: { id: unitId, kind: 'unit', floorId: floor.id, unitCode: 'R-01' },
    });
    const path = randomUUID();
    const entrance = randomUUID();
    await superAdmin.navGraph.apply(venueId, {
      saveNodes: [
        {
          id: path,
          floorId: floor.id,
          coordinates: [106.82718, -6.17542],
          role: 'path',
          featureId: null,
        },
        {
          id: entrance,
          floorId: floor.id,
          coordinates: [106.82716, -6.17542],
          role: 'entrance',
          featureId: unitId,
        },
      ],
      removeNodeIds: [],
      saveEdges: [
        {
          id: randomUUID(),
          floorId: floor.id,
          from: path,
          to: entrance,
          lengthM: 2.2,
          accessible: true,
        },
      ],
      removeEdgeIds: [],
    });
    sql(`
      insert into public.locations (venue_id, location_type_id, name, code)
      select '${venueId}', id, 'Radiologi', 'RAD-01' from public.location_types
      where venue_id = '${venueId}' order by name limit 1;
      insert into public.location_units (location_id, feature_id, is_primary)
      select id, '${unitId}', true from public.locations where venue_id = '${venueId}';
    `);

    readKey = (
      await superAdmin.integrations.createApiKey({
        name: `Baca ${suffix}`,
        scopes: ['locations:read'],
        venueIds: [venueId],
      })
    ).key;
    const write = await superAdmin.integrations.createApiKey({
      name: `Tulis ${suffix}`,
      scopes: ['locations:read', 'locations:write', 'closures:write'],
      venueIds: [venueId],
    });
    writeKey = write.key;
    writeKeyId = write.id;
    expect(readKey).toMatch(/^pa_[0-9a-f]{48}$/);
  });

  it('TC-OPS-09: kunci baca-saja yang menulis, kunci salah, dan kunci dicabut ditolak', async () => {
    const body = JSON.stringify({ locations: [{ code: 'RAD-01', status: 'inactive_temporary' }] });
    const readOnly = await call(`/venues/${venueId}/locations`, readKey, { method: 'PUT', body });
    expect(readOnly.status).toBe(403);
    expect((await readOnly.json()).message).toContain('locations:write');
    expect((await call(`/venues/${venueId}/locations`, readKey)).status).toBe(200);

    expect((await call('/venues', 'pa_salah')).status).toBe(401);
    expect((await fetch(`${api}/venues`)).status).toBe(401);

    const spare = await superAdmin.integrations.createApiKey({
      name: `Cadangan ${suffix}`,
      scopes: ['locations:read'],
      venueIds: null,
    });
    expect((await call('/venues', spare.key)).status).toBe(200);
    await superAdmin.integrations.revokeApiKey(spare.id);
    const revoked = await call('/venues', spare.key);
    expect(revoked.status).toBe(401);

    const other = await call(`/venues/${randomUUID()}/locations`, writeKey);
    expect(other.status).toBe(404);

    const invalid = await call(`/venues/${venueId}/locations`, writeKey, {
      method: 'PUT',
      body: JSON.stringify({
        locations: [{ code: 'RAD-01', hours: { weekly: { mon: ['8-16'] } } }],
      }),
    });
    expect(invalid.status).toBe(422);
    expect((await invalid.json()).errors).toEqual([
      'locations[0].hours.weekly.mon: "8-16" bukan rentang jam JJ:MM-JJ:MM.',
    ]);

    const keys = await superAdmin.integrations.listApiKeys();
    expect(keys.find((k) => k.id === spare.id)?.revokedAt).not.toBeNull();
    expect(keys.find((k) => k.id === writeKeyId)?.lastUsedAt).not.toBeNull();
  });

  it('TC-OPS-10: jam diubah lewat API tampil di Visitor setelah publish', async () => {
    const response = await call(`/venues/${venueId}/locations`, writeKey, {
      method: 'PUT',
      body: JSON.stringify({
        locations: [
          {
            code: 'rad-01',
            hours: {
              weekly: { mon: ['08:00-12:00', '13:00-16:00'], tue: ['08:00-16:00'] },
              special: [{ date: '2026-12-25', spans: [] }],
            },
          },
        ],
      }),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).locations).toEqual([
      { code: 'RAD-01', id: expect.any(String), action: 'updated' },
    ]);

    const read = await (await call(`/venues/${venueId}/locations?code=RAD-01`, readKey)).json();
    expect(read.locations[0].hours.weekly.mon).toEqual(['08:00-12:00', '13:00-16:00']);
    expect(read.locations[0].visitorPath).toBe(`/v/${venueId}?loc=${read.locations[0].id}`);

    await superAdmin.publications.publish(venueId);
    const snapshot = await visitor.snapshots.latest(venueId);
    const location = snapshot.locations.find((l) => l.code === 'RAD-01');
    expect(location?.hours?.weekly[0]).toEqual([
      { opens: '08:00', closes: '12:00' },
      { opens: '13:00', closes: '16:00' },
    ]);
    expect(location?.hours?.weekly[1]).toEqual([{ opens: '08:00', closes: '16:00' }]);
    expect(location?.hours?.special['2026-12-25']).toEqual([]);
  });

  it('TC-OPS-11: webhook bertanda tangan HMAC, 500 dicoba ulang, log pengiriman lengkap', async () => {
    const hook = await superAdmin.integrations.createWebhook({
      name: `Penerima ${suffix}`,
      url: `http://${RECEIVER_HOST}:${RECEIVER_PORT}/hook`,
      events: ['publish', 'closure', 'location'],
      venueIds: [venueId],
    });
    received.length = 0;
    replies.push(500);

    const closed = await call(`/venues/${venueId}/closures`, writeKey, {
      method: 'POST',
      body: JSON.stringify({ locationCode: 'RAD-01', reason: 'Perawatan alat' }),
    });
    expect(closed.status).toBe(201);

    const first = await until(() => received[0]);
    expect(JSON.parse(first.body)).toMatchObject({
      type: 'closure.created',
      venueId,
      data: { closure: { reason: 'Perawatan alat', locationCodes: ['RAD-01'] } },
    });
    expect(verify(hook.secret, first)).toBe(true);
    expect(verify(`whsec_${Buffer.from('salah').toString('base64')}`, first)).toBe(false);

    const retrying = await until(async () => {
      const page = await superAdmin.integrations.listDeliveries({
        q: '',
        page: 1,
        size: 20,
        filters: { statuses: ['retrying'], webhookId: hook.id },
      });
      return page.rows[0];
    });
    expect(retrying).toMatchObject({ event: 'closure.created', attempts: 1, responseStatus: 500 });
    expect(retrying.error).toContain('500');

    sql(`update public.webhook_deliveries set next_attempt_at = now() where id = '${retrying.id}';
         select app.webhook_tick();`);
    const second = await until(() => received[1]);
    expect(second.headers['webhook-id']).toBe(first.headers['webhook-id']);
    expect(verify(hook.secret, second)).toBe(true);
    const delivered = await until(async () => {
      const page = await superAdmin.integrations.listDeliveries({
        q: 'closure',
        page: 1,
        size: 20,
        filters: { statuses: ['delivered'], webhookId: hook.id },
      });
      return page.rows[0];
    });
    expect(delivered).toMatchObject({ attempts: 2, responseStatus: 200, error: null });

    await superAdmin.publications.publish(venueId);
    const publish = await until(() =>
      received.map((r) => JSON.parse(r.body)).find((p) => p.type === 'publish.completed'),
    );
    expect(publish.data).toMatchObject({ version: 2, origin: 'publish' });

    await call(`/venues/${venueId}/locations`, writeKey, {
      method: 'PUT',
      body: JSON.stringify({ locations: [{ code: 'RAD-01', status: 'inactive_temporary' }] }),
    });
    const location = await until(() =>
      received.map((r) => JSON.parse(r.body)).find((p) => p.type === 'location.changed'),
    );
    expect(location.data).toMatchObject({
      source: 'api',
      count: 1,
      locations: [{ code: 'RAD-01', status: 'inactive_temporary', action: 'update' }],
    });

    const pingId = await superAdmin.integrations.pingWebhook(hook.id);
    await until(() => received.find((r) => r.headers['webhook-id'] === pingId));
    const log = await superAdmin.integrations.listDeliveries({
      q: '',
      page: 1,
      size: 20,
      filters: { statuses: [], webhookId: hook.id },
    });
    expect(log.rows.map((d) => d.event).sort()).toEqual([
      'closure.created',
      'location.changed',
      'ping',
      'publish.completed',
    ]);
  });
});
