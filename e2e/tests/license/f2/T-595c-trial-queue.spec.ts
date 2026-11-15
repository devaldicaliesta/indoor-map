import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { currentLicenseId, restoreLicense, sql } from '../../../support/license';
import { waitForMail } from '../../../support/mailpit';
import { createVendorStaff, signInVendorStaff, vendorApiProxy } from '../../../support/vendor';

const shot = (name: string) => `evidence/T-595c/${name}.png`;

test.describe.configure({ mode: 'serial' });

test.describe('T-595c Trial on-premise lewat antrean vendor', () => {
  const tag = randomUUID().slice(0, 8);
  const staffEmail = `staf-antrean-${tag}@vendor.test`;
  const institution = `Mal Antrean ${tag}`;
  const email = `dewi-${tag}@mal-antrean-${tag}.test`;
  let original = '';
  let instanceId = '';
  let staffId = '';
  let proxy: Server;

  test.beforeAll(async () => {
    original = currentLicenseId();
    instanceId = sql('select instance_id from public.installation');
    sql(`delete from vendor.trial_requests where instance_id = '${instanceId}';
         delete from vendor.installations where instance_id = '${instanceId}';`);
    staffId = createVendorStaff(staffEmail);
    proxy = vendorApiProxy(`203.0.113.${Number.parseInt(tag.slice(0, 2), 16) % 250}`);
    await new Promise<void>((resolve) => proxy.listen(8091, '0.0.0.0', resolve));
  });

  test.afterAll(() => {
    proxy?.close();
    restoreLicense(original);
    sql(`delete from vendor.trial_requests where instance_id = '${instanceId}';
         delete from vendor.clients where email like '%${tag}%';
         delete from auth.users where id = '${staffId}';`);
  });

  test('Mulai trial masuk antrean, vendor menyetujui, berkas dari email dipasang', async ({
    page,
    browser,
    loginAs,
    superAdmin,
  }, testInfo) => {
    test.setTimeout(180_000);
    await loginAs('super_admin');
    await page.goto('/aktivasi');
    await page.getByRole('tab', { name: 'Mulai trial' }).click();
    await page.getByLabel('Nama').fill('Dewi Pratama');
    await page.getByLabel('Instansi').fill(institution);
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Mulai trial 14 hari' }).click();
    await expect(page.getByText('menunggu persetujuan vendor')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(`berkas lisensi dikirim ke ${email}`)).toBeVisible();
    await page.screenshot({ path: shot('05-admin-menunggu') });
    expect(currentLicenseId()).toBe(original);

    const vendor = await browser.newPage({
      baseURL: env.vendorUrl,
      viewport: { width: 1440, height: 900 },
    });
    await signInVendorStaff(vendor, staffEmail);
    await vendor.getByRole('tab', { name: 'Klien & Instalasi' }).click();
    const row = vendor
      .getByRole('region', { name: /Permintaan trial on-premise/ })
      .getByRole('row')
      .filter({ hasText: instanceId });
    await expect(row).toContainText(institution);
    await row.getByRole('button', { name: `Setujui trial ${institution}` }).click();
    await vendor.getByRole('button', { name: 'Setujui dan kirim lisensi' }).click();
    await expect(row).toContainText('Disetujui');
    await vendor.close();

    const mail = await waitForMail(email, 1, `Lisensi trial PanduArah untuk ${institution}`);
    const [attachment] = mail.attachments;
    const path = testInfo.outputPath(attachment?.fileName ?? 'lisensi.json');
    writeFileSync(path, attachment?.content ?? '');

    await page.goto('/aktivasi');
    await page.getByRole('tab', { name: 'Unggah berkas' }).click();
    await page.getByLabel('Berkas lisensi (.json)').setInputFiles(path);
    await page.getByRole('button', { name: 'Pasang lisensi' }).click();
    await expect(page.getByText('Lisensi aktif')).toBeVisible();
    await page.goto('/venues');
    await expect(page.getByText('Trial — sisa 14 hari')).toBeVisible();
    await page.screenshot({ path: shot('06-admin-trial-terpasang') });

    const again = await superAdmin.license
      .startTrial({ name: 'Dewi', institution, email: `lain-${tag}@lain-${tag}.test` })
      .catch((e: unknown) => e as Error);
    expect((again as Error).message).toBe('Vendor: Instalasi ini sudah pernah mendapat trial.');
  });
});
