import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/database.types';
import { insertVenue } from '../support/full-venue';
import { sql } from './psql';

const url = process.env.SUPABASE_API_URL ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const mailpit = process.env.SUPABASE_MAILPIT_URL ?? '';
const TEMPLATE_SLUG = 'demo-kantor'; // jenis gedung `office` (TRIAL_TEMPLATES)

async function waitForMail(query: string): Promise<{ subject: string; text: string }> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const response = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(query)}`);
    const [first] = ((await response.json()) as { messages: { ID: string; Subject: string }[] })
      .messages;
    if (first) {
      const detail = (await (await fetch(`${mailpit}/api/v1/message/${first.ID}`)).json()) as {
        Text: string;
      };
      return { subject: first.Subject, text: detail.Text };
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Email "${query}" tidak sampai di Mailpit.`);
}

/** Permintaan yang menunggu verifikasi; token aslinya hanya diketahui test (seperti email). */
function request(email: string, institution: string): string {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  sql(`insert into hosting.trial_requests
         (name, institution, title, email, phone, building_type, building_size, language, token_hash)
       values ('Rina', '${institution}', 'Manajer', '${email}', '+62 812 0000 0000', 'office',
         'lt5k', 'id', '${hash}')`);
  return token;
}

const verify = async (token: string) =>
  (await (
    await fetch(`${url}/functions/v1/trial-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  ).json()) as { outcome: string; visitorUrl?: string; adminUrl?: string };

// T-614b: klik tautan verifikasi → ruang kerja trial siap pakai (FR-HT-02, NFR-HT-01 ≤ 60 detik).
describe.runIf(url && serviceKey && mailpit)('verifikasi dan provisioning trial', () => {
  const service = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const suffix = randomUUID().slice(0, 8);
  const email = `rina-${suffix}@kantor-${suffix}.co.id`;
  const institution = `Menara Uji ${suffix}`;
  let templateCreated: string | null = null;

  beforeAll(async () => {
    sql(`insert into app.server_settings (key, value) values ('hosting_mode', 'true')
           on conflict (key) do update set value = 'true'`);
    // Venue demo kantor dari `db:seed-demo` dipakai bila ada; database bersih memakai venue uji.
    if (sql(`select count(*) from public.venues where slug = '${TEMPLATE_SLUG}'`) === '0') {
      const { venueId } = await insertVenue(
        service,
        `Templat Kantor ${suffix}`,
        sampleSnapshotSource(),
        [106.8272, -6.1753],
      );
      sql(`update public.venues set slug = '${TEMPLATE_SLUG}' where id = '${venueId}'`);
      templateCreated = venueId;
    }
  });

  afterAll(async () => {
    const venues = sql(
      `select string_agg(t.venue_id::text, ',') from hosting.trials t
       join hosting.trial_requests r on r.id = t.request_id where r.email like '%${suffix}%'`,
    );
    const users = sql(
      `select string_agg(user_id::text, ',') from public.profiles where email like '%${suffix}%'`,
    );
    for (const id of users ? users.split(',') : []) await service.auth.admin.deleteUser(id);
    sql(`delete from public.venues where id = any (string_to_array('${venues}', ',')::uuid[]);
         delete from hosting.trial_requests where email like '%${suffix}%';
         delete from app.server_settings where key in ('hosting_mode', 'trial_capacity');`);
    if (templateCreated) sql(`delete from public.venues where id = '${templateCreated}'`);
  });

  it('ruang kerja dibuat dari venue demo, diterbitkan, dan pemohon menerima tautan', async () => {
    const token = request(email, institution);
    const started = Date.now();
    const result = await verify(token);
    expect(Date.now() - started).toBeLessThan(60_000);
    expect(result).toMatchObject({ outcome: 'active', adminUrl: 'http://localhost:5173' });
    const slug = `menara-uji-${suffix}`;
    expect(result.visitorUrl).toBe(`http://localhost:5174/v/${slug}`);

    const venueId = sql(`select id from public.venues where slug = '${slug}'`);
    expect(
      sql(`select role || '/' || all_venues from public.profiles where email = '${email}'`),
    ).toBe('admin/false');
    expect(sql(`select count(*) from hosting.trials where venue_id = '${venueId}'`)).toBe('1');
    // Data contoh tersalin dalam batas trial dan sudah diterbitkan untuk Visitor.
    expect(Number(sql(`select count(*) from public.buildings where venue_id = '${venueId}'`))).toBe(
      1,
    );
    expect(
      Number(sql(`select count(*) from public.locations where venue_id = '${venueId}'`)),
    ).toBeGreaterThan(0);
    expect(
      sql(`select count(*) from public.publications where venue_id = '${venueId}' and is_active`),
    ).toBe('1');
    const pointer = await fetch(`${url}/storage/v1/object/public/snapshots/slugs/${slug}.json`);
    expect(await pointer.json()).toEqual({ venueId });

    const mail = await waitForMail(`to:"${email}" subject:"Trial PanduArah Anda siap"`);
    expect(mail.text).toContain('Buat password: http');
    expect(mail.text).toContain('type=recovery');
    expect(mail.text).toContain(`http://localhost:5174/v/${slug}`);
    const vendor = await waitForMail(`subject:"Trial aktif: ${institution}"`);
    expect(vendor.text).toContain(`Email: ${email}`);

    // Tautan sekali pakai.
    expect((await verify(token)).outcome).toBe('invalid');
  });

  it('kapasitas penuh: permintaan antre dan pemohon diberi tahu', async () => {
    const active = sql(`select count(*) from hosting.trial_requests where status = 'active'`);
    sql(`insert into app.server_settings (key, value) values ('trial_capacity', '${active}')
           on conflict (key) do update set value = '${active}'`);
    const queuedEmail = `antre-${suffix}@instansi-${suffix}.id`;
    expect((await verify(request(queuedEmail, `Antre ${suffix}`))).outcome).toBe('queued');
    await waitForMail(
      `to:"${queuedEmail}" subject:"Permintaan trial PanduArah Anda dalam antrean"`,
    );
  });

  it('token asal-asalan ditolak tanpa rincian', async () => {
    expect((await verify('bukan-token-yang-sah-sama-sekali')).outcome).toBe('invalid');
    expect((await verify('<script>')).outcome).toBe('invalid');
  });
});
