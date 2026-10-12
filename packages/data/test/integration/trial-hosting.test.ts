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

/** Rahasia Vault yang dikirim pg_cron (migrasi 0054); panggilan tanpa rahasia ditolak. */
const lifecycleSecret = () =>
  sql(`select decrypted_secret from vault.decrypted_secrets where name = 'trial_lifecycle_secret'`);

const callLifecycle = (headers: Record<string, string> = {}) =>
  fetch(`${url}/functions/v1/trial-lifecycle`, { method: 'POST', headers });

const lifecycle = async () =>
  (await (await callLifecycle({ 'x-trial-lifecycle-secret': lifecycleSecret() })).json()) as {
    reminded: number;
    locked: number;
    deleted: number;
    activated: number;
    failed: number;
  };

// T-614b + T-615a dalam satu berkas berurutan: verifikasi, kapasitas, dan siklus hidup berbagi
// slot trial bersama, jadi tidak boleh berjalan paralel. Klik tautan verifikasi → ruang kerja
// siap pakai (FR-HT-02, NFR-HT-01 ≤ 60 detik) → pengingat → terkunci → antrean → dihapus.
describe.runIf(url && serviceKey && mailpit)(
  'trial ter-hosting: verifikasi dan siklus hidup',
  () => {
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

    it('siklus hidup menolak pemanggil tanpa rahasia pg_cron atau sesi staf vendor', async () => {
      for (const headers of [
        {},
        { 'x-trial-lifecycle-secret': 'tebakan' },
        { Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY ?? ''}` },
      ]) {
        const response = await callLifecycle(headers);
        expect(response.status, JSON.stringify(Object.keys(headers))).toBe(401);
      }
      // Preflight CORS dasbor vendor dijawab tanpa menjalankan putaran.
      const preflight = await fetch(`${url}/functions/v1/trial-lifecycle`, { method: 'OPTIONS' });
      expect(await preflight.text()).toBe('ok');
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
      // Venue templat tersalin utuh (keputusan pemilik 2026-10-12) dan sudah terbit untuk Visitor.
      const countOf = (table: string, venue: string) =>
        sql(`select count(*) from public.${table} where venue_id = '${venue}'`);
      const template = sql(`select id from public.venues where slug = '${TEMPLATE_SLUG}'`);
      for (const table of ['buildings', 'floors', 'features', 'nav_edges', 'origin_points']) {
        expect(countOf(table, venueId), table).toBe(countOf(table, template));
      }
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

    // ---- T-615a: siklus hidup, waktu dimajukan dengan mengubah tanggal trial ----
    const slug = `menara-uji-${suffix}`;
    const venueOf = () => sql(`select id from public.venues where slug = '${slug}'`);
    const latest = async (venueId: string) =>
      fetch(`${url}/storage/v1/object/public/snapshots/${venueId}/latest.json`, {
        cache: 'no-cache',
      });

    it('hari 14: pemohon diingatkan sekali (FR-HT-08)', async () => {
      sql(`update hosting.trials set ends_at = now() + interval '2 days'
         where venue_id = '${venueOf()}'`);
      expect((await lifecycle()).reminded).toBeGreaterThanOrEqual(1);
      await waitForMail(`to:"${email}" subject:"Trial PanduArah Anda berakhir"`);
      expect(
        sql(`select reminded_at is not null from hosting.trials where venue_id = '${venueOf()}'`),
      ).toBe('t');
    });

    it('hari 17: terkunci, Visitor menerima penanda, vendor diberi tahu (FR-HT-09)', async () => {
      const venueId = venueOf();
      sql(
        `update hosting.trials set ends_at = now() - interval '1 minute' where venue_id = '${venueId}'`,
      );
      const run = await lifecycle();
      expect(run.locked).toBeGreaterThanOrEqual(1);
      // Slot yang dilepas langsung dipakai antrean di putaran yang sama (uji kapasitas di atas
      // mengisi semua slot dan meninggalkan satu permintaan antre).
      expect(run.activated).toBeGreaterThanOrEqual(1);
      expect(await (await latest(venueId)).json()).toEqual({ trialEnded: true });
      await waitForMail(`to:"${email}" subject:"Trial PanduArah Anda sudah berakhir"`);
      await waitForMail(`subject:"Trial berakhir: ${institution}"`);
    });

    it('pemohon antre mendapat ruang kerja begitu ada slot', async () => {
      const queuedEmail = `antre-${suffix}@instansi-${suffix}.id`;
      expect(sql(`select status from hosting.trial_requests where email = '${queuedEmail}'`)).toBe(
        'active',
      );
      expect(
        sql(`select count(*) from hosting.trials t join hosting.trial_requests r
             on r.id = t.request_id where r.email = '${queuedEmail}'`),
      ).toBe('1');
      await waitForMail(`to:"${queuedEmail}" subject:"Trial PanduArah Anda siap"`);
    });

    it('hari 24: venue, berkas, dan akun dihapus; leads tetap (FR-HT-10)', async () => {
      const venueId = venueOf();
      sql(`update hosting.trials set locked_at = now() - interval '8 days'
         where venue_id = '${venueId}'`);
      expect((await lifecycle()).deleted).toBeGreaterThanOrEqual(1);
      expect(sql(`select count(*) from public.venues where id = '${venueId}'`)).toBe('0');
      expect(sql(`select count(*) from auth.users where email = '${email}'`)).toBe('0');
      expect(sql(`select status from hosting.trial_requests where email = '${email}'`)).toBe(
        'deleted',
      );
      expect([400, 404]).toContain((await latest(venueId)).status);
      const pointer = await fetch(`${url}/storage/v1/object/public/snapshots/slugs/${slug}.json`, {
        cache: 'no-cache',
      });
      expect([400, 404]).toContain(pointer.status);
    });
  },
);
