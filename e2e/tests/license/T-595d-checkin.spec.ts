import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { env } from '../../env';
import { expect, test } from '../../fixtures';
import {
  currentLicenseId,
  resetCheckin,
  restoreLicense,
  runScheduledCheckin,
  sql,
} from '../../support/license';
import { createVendorStaff, signInVendorStaff, vendorApiProxy } from '../../support/vendor';

const shot = (name: string) => `evidence/T-595d/${name}.png`;

test.describe.configure({ mode: 'serial' });

test.describe('T-595d Check-in instalasi ke Vendor Portal', () => {
  const tag = randomUUID().slice(0, 8);
  const staffEmail = `staf-checkin-${tag}@vendor.test`;
  const institution = `Mal Check-in ${tag}`;
  const ip = `198.51.100.${Number.parseInt(tag.slice(0, 2), 16) % 250}`;
  let original = '';
  let instanceId = '';
  let staffId = '';
  let proxy: Server;

  test.beforeAll(async () => {
    original = currentLicenseId();
    resetCheckin();
    instanceId = sql('select instance_id from public.installation');
    sql(`delete from vendor.trial_requests where instance_id = '${instanceId}';
         delete from vendor.installations where instance_id = '${instanceId}';
         with c as (
           insert into vendor.clients (name, institution, email)
           values ('Sari', '${institution}', 'sari-${tag}@mal.test') returning id)
         insert into vendor.installations (client_id, instance_id, name)
         select id, '${instanceId}', 'Server utama' from c;`);
    staffId = createVendorStaff(staffEmail);
    proxy = vendorApiProxy(ip);
    await new Promise<void>((resolve) => proxy.listen(8091, '0.0.0.0', resolve));
  });

  test.afterAll(() => {
    proxy?.close();
    proxy?.closeAllConnections();
    restoreLicense(original);
    resetCheckin();
    sql(`delete from vendor.clients where institution = '${institution}';
         delete from auth.users where id = '${staffId}';`);
  });

  test('lisensi dari portal dipasang, check-in tercatat, pencabutan berlaku di instalasi', async ({
    page,
    browser,
    loginAs,
    superAdmin,
  }) => {
    test.setTimeout(180_000);
    const vendor = await browser.newPage({
      baseURL: env.vendorUrl,
      viewport: { width: 1440, height: 900 },
    });
    await signInVendorStaff(vendor, staffEmail);
    await vendor.getByRole('tab', { name: 'Klien & Instalasi' }).click();
    const row = vendor
      .getByRole('region', { name: 'Daftar instalasi' })
      .getByRole('row')
      .filter({ hasText: instanceId });
    await expect(row).toContainText('Belum pernah');
    await row.getByRole('button', { name: 'Lisensi', exact: true }).click();
    const dialog = vendor.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Terbitkan lisensi' }).click();
    await dialog.getByLabel('Paket').fill('professional');
    const download = vendor.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Terbitkan dan unduh' }).click();
    const file = JSON.parse(readFileSync((await (await download).path()) ?? '', 'utf8')) as {
      licenseId: string;
    };
    await vendor.keyboard.press('Escape');

    await superAdmin.license.activateManual(file);
    expect(sql('select license_id from public.licenses where is_current')).toBe(file.licenseId);

    await runScheduledCheckin();
    expect(sql('select checkin_error is null from public.installation')).toBe('t');
    expect(sql('select state from public.license_status()')).toBe('active');

    await vendor.getByRole('button', { name: 'Muat ulang' }).click();
    await expect(row).not.toContainText('Belum pernah');
    await row.getByRole('button', { name: `Check-in ${institution}` }).click();
    const history = vendor.getByRole('dialog');
    await expect(history.getByRole('row')).toHaveCount(2);
    await expect(history.getByRole('row').nth(1)).toContainText(ip);
    await vendor.screenshot({ path: shot('04-check-in-instalasi'), fullPage: true });
    await vendor.keyboard.press('Escape');

    await row.getByRole('button', { name: 'Lisensi', exact: true }).click();
    await dialog
      .getByRole('row')
      .filter({ hasText: file.licenseId })
      .getByRole('button', { name: 'Cabut' })
      .click();
    await dialog.getByRole('button', { name: 'Cabut lisensi' }).click();
    await expect(vendor.getByText(`Lisensi ${file.licenseId} dicabut.`)).toBeVisible();
    await vendor.close();

    await runScheduledCheckin();
    expect(sql('select state from public.license_status()')).toBe('revoked');
    await loginAs('super_admin');
    await expect(page).toHaveURL(/\/aktivasi$/);
    await expect(page.getByText('Lisensi dicabut vendor.', { exact: false })).toBeVisible();
    await page.screenshot({ path: shot('05-admin-dicabut') });
  });
});
