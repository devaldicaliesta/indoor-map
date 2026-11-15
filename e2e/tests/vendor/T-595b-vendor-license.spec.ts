import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { importLicensePublicKey, verifyLicense } from '@indoor/domain/license';
import { LICENSE_PUBLIC_KEY } from '@indoor/domain/license-public-key';
import { expect, type Page, test } from '@playwright/test';
import { sql } from '../../support/license';
import { createVendorStaff, signInVendorStaff } from '../../support/vendor';

const shot = (name: string) => `evidence/T-595b/${name}.png`;

async function downloadedLicense(page: Page, action: () => Promise<void>) {
  const download = page.waitForEvent('download');
  await action();
  const file = await download;
  return {
    name: file.suggestedFilename(),
    body: JSON.parse(readFileSync((await file.path()) ?? '', 'utf8')) as Record<string, unknown>,
  };
}

test.describe('T-595b Vendor Portal: lisensi', () => {
  const tag = randomUUID().slice(0, 8);
  const staffEmail = `staf-lisensi-${tag}@vendor.test`;
  const institution = `RS Lisensi ${tag}`;
  const instanceId = randomUUID();
  let staffId = '';

  test.beforeAll(() => {
    staffId = createVendorStaff(staffEmail);
  });

  test.afterAll(() => {
    sql(`delete from vendor.clients where institution = '${institution}';
         delete from auth.users where id = '${staffId}';`);
  });

  test('klien, instalasi, terbitkan, perpanjang, dan cabut lisensi', async ({ page }) => {
    test.setTimeout(120_000);
    await signInVendorStaff(page, staffEmail);
    await page.getByRole('tab', { name: 'Klien & Instalasi' }).click();

    await page.getByRole('button', { name: 'Tambah klien' }).click();
    const clientDialog = page.getByRole('dialog');
    await clientDialog.getByLabel('Instansi').fill(institution);
    await clientDialog.getByLabel('Nama kontak').fill('Budi Santoso');
    await clientDialog.getByLabel('Email kontak').fill(`budi-${tag}@rs.test`);
    await clientDialog.getByRole('button', { name: 'Tambah klien' }).click();
    await expect(page.getByText(`Klien ${institution} ditambahkan.`)).toBeVisible();

    const clientRow = page.getByRole('row').filter({ hasText: institution });
    await clientRow.getByRole('button', { name: 'Instalasi' }).click();
    const installationDialog = page.getByRole('dialog');
    await installationDialog.getByLabel('Nama instalasi').fill('Gedung Utama');
    await installationDialog.getByLabel('ID instalasi').fill('bukan-uuid');
    await installationDialog.getByRole('button', { name: 'Tambah instalasi' }).click();
    await expect(installationDialog.getByText('ID instalasi berbentuk UUID')).toBeVisible();
    await installationDialog.getByLabel('ID instalasi').fill(instanceId);
    await installationDialog.getByRole('button', { name: 'Tambah instalasi' }).click();
    await expect(page.getByText('Instalasi Gedung Utama ditambahkan.')).toBeVisible();

    const installationRow = page.getByRole('row').filter({ hasText: instanceId });
    await expect(installationRow).toContainText('Belum berlisensi');
    await page.screenshot({ path: shot('01-klien-instalasi'), fullPage: true });

    await installationRow.getByRole('button', { name: 'Lisensi' }).click();
    const licenseDialog = page.getByRole('dialog');
    await expect(licenseDialog).toContainText('Belum ada lisensi untuk instalasi ini.');
    await licenseDialog.getByRole('button', { name: 'Terbitkan lisensi' }).click();
    await licenseDialog.getByLabel('Paket').fill('professional');
    await licenseDialog.getByRole('spinbutton', { name: 'Info Point' }).fill('2');
    await licenseDialog.getByRole('checkbox', { name: 'Tampilan 3D' }).check();
    await page.screenshot({ path: shot('02-form-lisensi'), fullPage: true });
    const first = await downloadedLicense(page, () =>
      licenseDialog.getByRole('button', { name: 'Terbitkan dan unduh' }).click(),
    );
    const firstId = String(first.body.licenseId);
    expect(first.name).toBe(`lisensi-${firstId}.json`);
    expect(first.body).toMatchObject({
      client: institution,
      plan: 'professional',
      instanceId,
      features: ['3d'],
      quota: { venues: 1, buildings: 1, floors: 10, infoPoints: 2 },
    });
    const key = await importLicensePublicKey(LICENSE_PUBLIC_KEY);
    const check = await verifyLicense(first.body, key, instanceId, new Date());
    expect(check.valid).toBe(true);
    await expect(licenseDialog.getByRole('row').filter({ hasText: firstId })).toContainText(
      'Berlaku',
    );

    const second = await downloadedLicense(page, async () => {
      await licenseDialog.getByRole('button', { name: 'Terbitkan lisensi baru' }).click();
      await expect(licenseDialog.getByLabel('Paket')).toHaveValue('professional');
      await licenseDialog.getByLabel('Paket').fill('enterprise');
      await licenseDialog.getByRole('button', { name: 'Terbitkan dan unduh' }).click();
    });
    const secondId = String(second.body.licenseId);
    expect((await verifyLicense(second.body, key, instanceId, new Date())).valid).toBe(true);
    await expect(licenseDialog.getByRole('row').filter({ hasText: firstId })).toContainText(
      'Digantikan',
    );
    const secondRow = licenseDialog.getByRole('row').filter({ hasText: secondId });
    await expect(secondRow).toContainText('Berlaku');
    await expect(secondRow).toContainText(staffEmail);
    await page.screenshot({ path: shot('03-riwayat-lisensi'), fullPage: true });

    await secondRow.getByRole('button', { name: 'Cabut' }).click();
    await expect(licenseDialog.getByRole('alertdialog')).toContainText(
      `Cabut lisensi ${secondId}?`,
    );
    await licenseDialog.getByRole('button', { name: 'Cabut lisensi' }).click();
    await expect(page.getByText(`Lisensi ${secondId} dicabut.`)).toBeVisible();
    await expect(secondRow).toContainText('Dicabut');
    await expect(secondRow.getByRole('button', { name: 'Cabut' })).toHaveCount(0);
    await page.screenshot({ path: shot('04-dicabut'), fullPage: true });

    await page.keyboard.press('Escape');
    await expect(installationRow).toContainText('enterprise');

    expect(
      sql(`select count(*) from vendor.licenses l join vendor.installations i
             on i.id = l.installation_id where i.instance_id = '${instanceId}'`),
    ).toBe('2');
    expect(
      sql(`select count(*) from information_schema.columns
             where table_schema = 'vendor' and column_name ~* '(private|secret)'`),
    ).toBe('0');
  });
});
