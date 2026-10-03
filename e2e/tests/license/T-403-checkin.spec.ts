import type { Server } from 'node:http';
import type { Page } from '@playwright/test';
import { createVendorStub, licenseIdFor } from '../../../tools/vendor-stub/src/server';
import { expect, test } from '../../fixtures';
import {
  currentLicenseId,
  resetCheckin,
  restoreLicense,
  runScheduledCheckin,
  sql,
} from '../../support/license';

const shot = (name: string) => `evidence/T-403/${name}.png`;
const DAY_MS = 86_400_000;
const LICENSE_ID = licenseIdFor('DEV-ONLINE-0001');

const vendor = (path: string, body: Record<string, unknown>) =>
  fetch(`http://127.0.0.1:8091${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const validUntil = () => sql(`select payload->>'validUntil' from public.licenses where is_current`);

async function settled(page: Page) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
}

test.describe.configure({ mode: 'serial' });

test.describe('T-403 Check-in, pencabutan, proteksi jam', () => {
  let original = '';
  let stub: Server;
  // Waktu server vendor relatif terhadap jam server instalasi.
  let vendorShiftMs = 0;

  test.beforeAll(async () => {
    original = currentLicenseId();
    resetCheckin();
    stub = await createVendorStub({ now: () => new Date(Date.now() + vendorShiftMs) });
    await new Promise<void>((resolve) => stub.listen(8091, '0.0.0.0', resolve));
  });

  test.afterAll(() => {
    stub?.close();
    stub?.closeAllConnections();
    restoreLicense(original);
    resetCheckin();
  });

  test('perpanjangan di vendor diterima otomatis pada check-in terjadwal berikutnya', async ({
    page,
    loginAs,
    superAdmin,
  }) => {
    await superAdmin.license.activateOnline('DEV-ONLINE-0001');
    const before = validUntil();
    expect((await vendor('/v1/vendor/renew', { licenseId: LICENSE_ID, days: 30 })).status).toBe(
      200,
    );
    await runScheduledCheckin();
    expect(Date.parse(validUntil()) - Date.parse(before)).toBe(30 * DAY_MS);
    expect(sql('select source from public.licenses where is_current')).toBe('checkin');

    await loginAs('super_admin');
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Catatan' }).click();
    await settled(page);
    await expect(page.getByText(`${LICENSE_ID} · check-in`).first()).toBeVisible();
    await page.screenshot({ path: shot('01-perpanjangan-lewat-check-in') });
  });

  test('check-in gagal 7 hari: banner di Admin, sistem tetap berjalan', async ({
    page,
    loginAs,
  }) => {
    sql(`update public.installation
         set last_checkin_at = now() - interval '8 days',
             checkin_error = 'Server vendor tidak bisa dihubungi.'
         where id`);
    await loginAs('admin');
    await page.goto('/venues');
    const banner = page.getByText('Lisensi belum berhasil diperiksa ke server vendor sejak');
    await expect(banner).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tambah gedung' })).toBeEnabled();
    await settled(page);
    await page.screenshot({ path: shot('02-banner-check-in-gagal') });

    sql(`update public.installation
         set last_checkin_at = now() - interval '6 days', checkin_error = null
         where id`);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Tambah gedung' })).toBeVisible();
    await expect(banner).toHaveCount(0);
  });

  test('jam server mundur: lisensi tidak berlaku sampai jam diperbaiki', async ({
    page,
    loginAs,
  }) => {
    // Vendor tiga hari di depan = jam server instalasi mundur tiga hari.
    vendorShiftMs = 3 * DAY_MS;
    await runScheduledCheckin();
    expect(sql('select state from public.license_status()')).toBe('clock_behind');

    await loginAs('admin');
    await expect(page).toHaveURL(/\/aktivasi$/);
    await expect(page.getByText(/Jam server mundur lebih dari 24 jam/)).toBeVisible();
    await page.goto('/venues');
    await expect(page).toHaveURL(/\/aktivasi$/);
    await page.screenshot({ path: shot('03-jam-mundur') });

    vendorShiftMs = 0;
    await runScheduledCheckin();
    await page.goto('/venues');
    await expect(page).toHaveURL(/\/venues$/);
    await expect(page.getByRole('button', { name: 'Tambah gedung' })).toBeEnabled();
    await settled(page);
    await page.screenshot({ path: shot('04-jam-diperbaiki') });
  });

  test('lisensi dicabut vendor: kedaluwarsa pada check-in berikutnya', async ({
    page,
    loginAs,
  }) => {
    expect((await vendor('/v1/vendor/revoke', { licenseId: LICENSE_ID })).status).toBe(200);
    await runScheduledCheckin();
    expect(sql('select state from public.license_status()')).toBe('revoked');

    await loginAs('super_admin');
    await expect(page).toHaveURL(/\/aktivasi$/);
    await expect(page.getByText('Lisensi dicabut vendor.', { exact: false })).toBeVisible();
    await page.screenshot({ path: shot('05-dicabut') });
  });
});
