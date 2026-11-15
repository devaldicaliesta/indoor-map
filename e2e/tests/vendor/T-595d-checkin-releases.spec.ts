import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { importLicensePublicKey, verifyLicense } from '@indoor/domain/license';
import { LICENSE_PUBLIC_KEY } from '@indoor/domain/license-public-key';
import { expect, type Page, test } from '@playwright/test';
import { env } from '../../env';
import { sql } from '../../support/license';
import { createVendorStaff, signInVendorStaff } from '../../support/vendor';

const shot = (name: string) => `evidence/T-595d/${name}.png`;
const SHA = (seed: string) => seed.repeat(64 / seed.length);

async function vendorApi(path: string, body: Record<string, unknown>, ip: string) {
  const response = await fetch(`${env.supabaseUrl}/functions/v1/vendor-api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

async function issueLicense(page: Page, instanceId: string) {
  const row = page
    .getByRole('region', { name: 'Daftar instalasi' })
    .getByRole('row')
    .filter({ hasText: instanceId });
  await row.getByRole('button', { name: 'Lisensi', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Terbitkan lisensi' }).click();
  await dialog.getByLabel('Paket').fill('professional');
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Terbitkan dan unduh' }).click();
  const file = await download;
  await page.keyboard.press('Escape');
  return JSON.parse(readFileSync((await file.path()) ?? '', 'utf8')) as Record<string, unknown>;
}

test.describe('T-595d Vendor Portal: check-in dan rilis', () => {
  const tag = randomUUID().slice(0, 8);
  const staffEmail = `staf-rilis-${tag}@vendor.test`;
  const institution = `RS Check-in ${tag}`;
  const instanceId = randomUUID();
  const ip = `192.0.2.${Number.parseInt(tag.slice(0, 2), 16) % 250}`;
  const older = `1.1.0-e2e${tag}`;
  const newer = `1.2.0-e2e${tag}`;
  let staffId = '';

  test.beforeAll(() => {
    staffId = createVendorStaff(staffEmail);
    sql(`with c as (
           insert into vendor.clients (name, institution, email)
           values ('Budi', '${institution}', 'budi-${tag}@rs.test') returning id)
         insert into vendor.installations (client_id, instance_id, name)
         select id, '${instanceId}', 'Gedung Utama' from c;`);
  });

  test.afterAll(() => {
    sql(`delete from vendor.releases where version like '%e2e${tag}';
         delete from vendor.clients where institution = '${institution}';
         delete from auth.users where id = '${staffId}';`);
  });

  test('check-in instalasi tercatat, rilis per versi, pencabutan dijawab revoked', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await signInVendorStaff(page, staffEmail);

    await page.getByRole('tab', { name: 'Rilis' }).click();
    for (const [version, releasedOn, seed] of [
      [older, '2026-10-01', 'ab'],
      [newer, '2026-11-01', 'cd'],
    ] as const) {
      await page.getByRole('button', { name: 'Tambah rilis' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Versi').fill(version);
      await dialog.getByLabel('Tanggal rilis').fill(releasedOn);
      await dialog
        .getByLabel('Alamat unduh arsip')
        .fill(`https://unduh.vendor.test/panduarah-${version}.tar.gz`);
      await dialog.getByLabel('SHA-256 (isi berkas .sha256)').fill('bukan-sha');
      await dialog.getByRole('button', { name: 'Tambah rilis' }).click();
      await expect(dialog.getByRole('alert')).toContainText('SHA-256 harus 64 karakter');
      await dialog
        .getByLabel('SHA-256 (isi berkas .sha256)')
        .fill(`${SHA(seed).toUpperCase()}  panduarah-${version}.tar.gz`);
      await dialog.getByLabel('Catatan rilis').fill(`Catatan ${version}`);
      await dialog.getByRole('button', { name: 'Tambah rilis' }).click();
      await expect(page.getByText(`Rilis ${version} ditambahkan.`)).toBeVisible();
      await expect(dialog).toBeHidden();
    }
    const newerRow = page.getByRole('row').filter({ hasText: newer });
    await expect(newerRow).toContainText('Terbaru');
    await expect(newerRow.getByRole('link', { name: `Unduh ${newer}` })).toHaveAttribute(
      'href',
      `https://unduh.vendor.test/panduarah-${newer}.tar.gz`,
    );
    expect(sql(`select sha256 from vendor.releases where version = '${newer}'`)).toBe(SHA('cd'));
    await page.screenshot({ path: shot('01-rilis'), fullPage: true });

    await page.getByRole('tab', { name: 'Klien & Instalasi' }).click();
    const license = await issueLicense(page, instanceId);
    const licenseId = String(license.licenseId);

    const active = await vendorApi('/v1/checkin', { licenseId, instanceId, version: older }, ip);
    expect(active.status).toBe(200);
    expect(active.body.status).toBe('active');
    expect(Number.isNaN(Date.parse(String(active.body.serverTime)))).toBe(false);
    const key = await importLicensePublicKey(LICENSE_PUBLIC_KEY);
    expect((await verifyLicense(active.body.license, key, instanceId, new Date())).valid).toBe(
      true,
    );
    expect(
      await vendorApi('/v1/checkin', { licenseId, instanceId: randomUUID() }, ip),
    ).toMatchObject({ status: 409, body: { message: 'Lisensi ini untuk instalasi lain.' } });
    expect(
      await vendorApi('/v1/checkin', { licenseId: 'LIC-TIDAK-ADA', instanceId }, ip),
    ).toMatchObject({ status: 404, body: { message: 'Lisensi tidak dikenal.' } });
    const activation = await vendorApi('/v1/activate', { licenseKey: 'X', instanceId }, ip);
    expect(activation.status).toBe(404);
    expect(String(activation.body.message)).toContain('Unggah berkas');

    await page.getByRole('button', { name: 'Muat ulang' }).click();
    const installationRow = page
      .getByRole('region', { name: 'Daftar instalasi' })
      .getByRole('row')
      .filter({ hasText: instanceId });
    await expect(installationRow).toContainText(`Versi ${older} tertinggal`);
    await expect(installationRow).toContainText(`Rilis terbaru ${newer}`);
    await page.screenshot({ path: shot('02-instalasi-tertinggal'), fullPage: true });

    await installationRow.getByRole('button', { name: `Check-in ${institution}` }).click();
    const history = page.getByRole('dialog');
    await expect(history.getByRole('row').nth(1)).toContainText(older);
    await expect(history.getByRole('row').nth(1)).toContainText(ip);
    await page.screenshot({ path: shot('03-riwayat-check-in'), fullPage: true });
    await page.keyboard.press('Escape');

    await installationRow.getByRole('button', { name: 'Lisensi', exact: true }).click();
    const licenseDialog = page.getByRole('dialog');
    await licenseDialog
      .getByRole('row')
      .filter({ hasText: licenseId })
      .getByRole('button', { name: 'Cabut' })
      .click();
    await licenseDialog.getByRole('button', { name: 'Cabut lisensi' }).click();
    await expect(page.getByText(`Lisensi ${licenseId} dicabut.`)).toBeVisible();
    await page.keyboard.press('Escape');

    const revoked = await vendorApi('/v1/checkin', { licenseId, instanceId, version: newer }, ip);
    expect(revoked.status).toBe(200);
    expect(revoked.body.status).toBe('revoked');
    expect(revoked.body.license).toBeUndefined();
    await page.getByRole('button', { name: 'Muat ulang' }).click();
    await expect(installationRow).toContainText(`Versi ${newer} (terbaru)`);

    await page.getByRole('tab', { name: 'Rilis' }).click();
    await page
      .getByRole('row')
      .filter({ hasText: older })
      .getByRole('button', { name: 'Hapus' })
      .click();
    await page.getByRole('dialog').getByRole('button', { name: 'Hapus rilis' }).click();
    await expect(page.getByText(`Rilis ${older} dihapus.`)).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: older })).toHaveCount(0);
  });
});
