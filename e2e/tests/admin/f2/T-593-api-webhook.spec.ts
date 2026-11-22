import { writeFileSync } from 'node:fs';
import type { Browser, Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import {
  type ReceivedWebhook,
  signatureValid,
  startWebhookReceiver,
} from '../../../support/webhook-receiver';

const shot = (name: string) => `evidence/T-593/${name}.png`;
const API = `${env.supabaseUrl}/functions/v1/api/v1`;
const RECEIVER_PORT = 8094;

function api(path: string, key: string, init: { method?: string; body?: unknown } = {}) {
  return fetch(`${API}${path}`, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
}

async function readSecret(page: Page) {
  const dialog = page.getByRole('dialog');
  const value = (await dialog.getByTestId('secret-value').innerText()).trim();
  return { dialog, value };
}

async function visitorLabel(browser: Browser, venueId: string, at: string, file?: string) {
  const context = await browser.newContext({
    baseURL: env.visitorUrl,
    viewport: { width: 360, height: 740 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date(at) });
  await page.goto(`/v/${venueId}`);
  await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  await page.getByRole('searchbox', { name: 'Cari lokasi' }).fill('radiologi');
  const item = page.locator('#search-results li').filter({ hasText: 'Radiologi' }).first();
  await expect(item).toBeVisible();
  if (file) await page.screenshot({ path: shot(file) });
  const text = (await item.innerText()).split('\n').at(-1) ?? '';
  await context.close();
  return text;
}

test.describe('T-593 API dan webhook integrasi', () => {
  test('TC-SEC-71: kunci API dan webhook hanya untuk Super Admin', async ({ page, loginAs }) => {
    await loginAs('admin');
    const nav = page.getByRole('navigation', { name: 'Menu utama' });
    await expect(nav.getByRole('link', { name: 'Pengguna' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Integrasi' })).toHaveCount(0);
    await page.goto('/integrations');
    await expect(
      page.getByText(/tidak (memiliki|punya) (izin|akses)|Tidak berizin/i).first(),
    ).toBeVisible();
    await page.screenshot({ path: shot('01-admin-tanpa-integrasi') });
  });

  test('TC-OPS-09: kunci baca-saja yang menulis ditolak; kunci dicabut ditolak', async ({
    page,
    loginAs,
    publishedVenue,
  }) => {
    const name = `Sistem uji ${Date.now().toString(36)}`;
    await loginAs('super_admin');
    await page.goto('/integrations');
    await expect(page.getByRole('heading', { name: 'Integrasi', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Buat kunci API' }).click();
    const form = page.getByRole('dialog', { name: 'Buat kunci API' });
    await form.getByLabel('Nama sistem').fill(name);
    await expect(form.getByLabel('Baca lokasi, kategori, dan jam')).toBeChecked();
    await expect(form.getByLabel('Ubah lokasi, status, kategori, dan jam')).not.toBeChecked();
    await page.screenshot({ path: shot('02-buat-kunci-baca-saja') });
    await form.getByRole('button', { name: 'Buat kunci' }).click();

    const { dialog, value: key } = await readSecret(page);
    expect(key).toMatch(/^pa_[0-9a-f]{48}$/);
    await page.screenshot({ path: shot('03-kunci-tampil-sekali') });
    await dialog.getByRole('button', { name: 'Sudah saya simpan' }).click();
    const row = page.getByRole('row').filter({ hasText: name });
    await expect(row).toContainText(`${key.slice(0, 11)}…`);
    await expect(row).not.toContainText(key);

    const venueId = publishedVenue.venue.id;
    const read = await api(`/venues/${venueId}/locations?code=RAD-01`, key);
    expect(read.status).toBe(200);
    const write = await api(`/venues/${venueId}/locations`, key, {
      method: 'PUT',
      body: { locations: [{ code: 'RAD-01', status: 'inactive_temporary' }] },
    });
    expect(write.status).toBe(403);
    const denied = await write.json();
    expect(denied.message).toContain('locations:write');

    await row.getByRole('button', { name: 'Cabut' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cabut kunci' }).click();
    await expect(row).toContainText('Dicabut');
    await page.screenshot({ path: shot('04-kunci-dicabut') });
    const revoked = await api(`/venues/${venueId}/locations`, key);
    expect(revoked.status).toBe(401);

    writeFileSync(
      'evidence/T-593/05-respons-api-ditolak.json',
      `${JSON.stringify(
        {
          'PUT dengan kunci baca-saja': { status: write.status, body: denied },
          'GET dengan kunci dicabut': { status: revoked.status, body: await revoked.json() },
        },
        null,
        2,
      )}\n`,
    );
  });

  test('TC-OPS-10: jam diubah massal lewat API tampil di Visitor setelah publish', async ({
    browser,
    superAdmin,
    publishedVenue,
  }) => {
    test.setTimeout(150_000);
    const venueId = publishedVenue.venue.id;
    const { id, key } = await superAdmin.integrations.createApiKey({
      name: `SIMRS jam ${Date.now().toString(36)}`,
      scopes: ['locations:read', 'locations:write'],
      venueIds: [venueId],
    });
    try {
      const response = await api(`/venues/${venueId}/locations`, key, {
        method: 'PUT',
        body: {
          locations: [
            {
              code: 'rad-01',
              hours: {
                weekly: {
                  mon: ['08:00-12:00', '13:00-16:00'],
                  tue: ['08:00-16:00'],
                  wed: ['08:00-16:00'],
                  thu: ['08:00-16:00'],
                  fri: ['08:00-11:30'],
                },
                special: [{ date: '2026-12-24', spans: [] }],
              },
            },
          ],
        },
      });
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.locations).toEqual([
        { code: 'RAD-01', id: expect.any(String), action: 'updated' },
      ]);

      // Senin 23 Nov 2026 09.00 WIB: draft belum terbit, Visitor belum tahu jamnya.
      const monday = '2026-11-23T02:00:00Z';
      expect(await visitorLabel(browser, venueId, monday)).not.toBe('Buka · tutup 12.00');
      await superAdmin.publications.publish(venueId);
      expect(await visitorLabel(browser, venueId, monday, '06-visitor-senin-buka')).toBe(
        'Buka · tutup 12.00',
      );
      expect(await visitorLabel(browser, venueId, '2026-11-27T05:00:00Z')).toBe(
        'Tutup · buka Senin 08.00',
      );
      expect(
        await visitorLabel(browser, venueId, '2026-12-24T02:00:00Z', '07-visitor-libur-tutup'),
      ).toBe('Tutup · buka besok 08.00');

      const after = await (await api(`/venues/${venueId}/locations?code=RAD-01`, key)).json();
      writeFileSync(
        'evidence/T-593/08-upsert-jam.json',
        `${JSON.stringify({ upsert: result, location: after.locations[0] }, null, 2)}\n`,
      );
    } finally {
      await superAdmin.integrations.revokeApiKey(id);
    }
  });

  test('TC-OPS-11: webhook publish, penutupan, lokasi; HMAC valid, 500 dicoba ulang, log lengkap', async ({
    page,
    loginAs,
    superAdmin,
    publishedVenue,
  }) => {
    test.setTimeout(120_000);
    const receiver = await startWebhookReceiver(RECEIVER_PORT, [500]);
    const { received } = receiver;
    const venue = publishedVenue.venue;
    const name = `SIMRS ${Date.now().toString(36)}`;
    const { id: keyId, key } = await superAdmin.integrations.createApiKey({
      name: `${name} kunci`,
      scopes: ['locations:write', 'closures:write'],
      venueIds: [venue.id],
    });
    const events = () => received.map((r) => JSON.parse(r.body) as { type: string; data: never });

    try {
      await loginAs('super_admin');
      await page.goto('/integrations?tab=webhooks');
      await page.getByRole('button', { name: 'Tambah webhook' }).click();
      const form = page.getByRole('dialog', { name: 'Tambah webhook' });
      await form.getByLabel('Nama').fill(name);
      await form.getByLabel('Alamat penerima').fill(receiver.url);
      await form.getByLabel('Venue tertentu').check();
      const chosen = form.getByRole('group', { name: 'Venue yang dipilih' });
      for (const box of await chosen.getByRole('checkbox', { checked: true }).all())
        await box.uncheck();
      await chosen.getByLabel(venue.name).check();
      await page.screenshot({ path: shot('09-tambah-webhook') });
      await form.getByRole('button', { name: 'Tambah webhook' }).click();
      const { dialog, value: secret } = await readSecret(page);
      expect(secret).toMatch(/^whsec_/);
      await dialog.getByRole('button', { name: 'Sudah saya simpan' }).click();

      // Penutupan lewat API; penerima membalas 500 pada kiriman pertama.
      const closed = await api(`/venues/${venue.id}/closures`, key, {
        method: 'POST',
        body: { locationCode: 'RAD-01', reason: 'Perawatan alat rontgen' },
      });
      expect(closed.status).toBe(201);
      await expect.poll(() => received.length, { timeout: 20_000 }).toBe(1);
      const first = received[0] as ReceivedWebhook;
      expect(signatureValid(secret, first)).toBe(true);
      expect(JSON.parse(first.body)).toMatchObject({
        type: 'closure.created',
        venueId: venue.id,
        data: { closure: { reason: 'Perawatan alat rontgen', locationCodes: ['RAD-01'] } },
      });

      await page
        .getByRole('row')
        .filter({ hasText: name })
        .getByRole('button', { name: `Menu webhook ${name}` })
        .click();
      await page.getByRole('menuitem', { name: 'Log pengiriman' }).click();
      const failed = page.getByRole('row').filter({ hasText: 'closure.created' });
      await expect(failed).toContainText('Dicoba ulang', { timeout: 15_000 });
      await expect(failed).toContainText('Penerima membalas 500');
      await page.screenshot({ path: shot('10-log-500-dicoba-ulang') });

      await failed.getByRole('button', { name: 'Kirim ulang' }).click();
      await expect.poll(() => received.length, { timeout: 20_000 }).toBe(2);
      const second = received[1] as ReceivedWebhook;
      expect(second.headers['webhook-id']).toBe(first.headers['webhook-id']);
      expect(signatureValid(secret, second)).toBe(true);
      await expect(failed).toContainText('Terkirim', { timeout: 15_000 });
      await expect(failed).toContainText('HTTP 200');

      await superAdmin.publications.publish(venue.id);
      await api(`/venues/${venue.id}/locations`, key, {
        method: 'PUT',
        body: { locations: [{ code: 'RAD-01', status: 'inactive_temporary' }] },
      });
      await expect
        .poll(
          () =>
            events()
              .map((e) => e.type)
              .sort(),
          { timeout: 20_000 },
        )
        .toEqual(['closure.created', 'closure.created', 'location.changed', 'publish.completed']);
      expect(received.every((r) => signatureValid(secret, r))).toBe(true);
      expect(events().find((e) => e.type === 'location.changed')?.data).toMatchObject({
        source: 'api',
        locations: [{ code: 'RAD-01', status: 'inactive_temporary', action: 'update' }],
      });

      await page.reload();
      const log = page.getByRole('table');
      await expect(log.getByRole('row').filter({ hasText: 'Terkirim' })).toHaveCount(3, {
        timeout: 15_000,
      });
      await expect(log).toContainText('publish.completed');
      await expect(log).toContainText('location.changed');
      await page.screenshot({ path: shot('11-log-lengkap') });
      writeFileSync(
        'evidence/T-593/12-kiriman-diterima.json',
        `${JSON.stringify(
          received.map((r) => ({
            headers: {
              'webhook-id': r.headers['webhook-id'],
              'webhook-timestamp': r.headers['webhook-timestamp'],
              'webhook-signature': r.headers['webhook-signature'],
              'signature-valid': signatureValid(secret, r),
            },
            body: JSON.parse(r.body),
          })),
          null,
          2,
        )}\n`,
      );
    } finally {
      await receiver.close();
      await superAdmin.integrations.revokeApiKey(keyId);
      for (const hook of await superAdmin.integrations.listWebhooks())
        if (hook.name === name) await superAdmin.integrations.removeWebhook(hook.id);
    }
  });
});
