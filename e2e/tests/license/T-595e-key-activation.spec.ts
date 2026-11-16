import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { env } from '../../env';
import { expect, test } from '../../fixtures';
import { currentLicenseId, releaseLicense, restoreLicense, sql } from '../../support/license';
import { createVendorStaff, signInVendorStaff, vendorApiProxy } from '../../support/vendor';

const shot = (name: string) => `evidence/T-595e/${name}.png`;

async function activate(licenseKey: string, instanceId: string) {
  const response = await fetch(`${env.supabaseUrl}/functions/v1/vendor-api/v1/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.250' },
    body: JSON.stringify({ licenseKey, instanceId }),
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

test.describe.configure({ mode: 'serial' });

test.describe('T-595e Aktivasi dengan kunci lisensi dari Vendor Portal', () => {
  const tag = randomUUID().slice(0, 8);
  const staffEmail = `staf-kunci-${tag}@vendor.test`;
  const institution = `RS Kunci ${tag}`;
  let original = '';
  let instanceId = '';
  let staffId = '';
  let proxy: Server;

  test.beforeAll(async () => {
    original = currentLicenseId();
    instanceId = sql('select instance_id from public.installation');
    sql(`delete from vendor.trial_requests where instance_id = '${instanceId}';
         delete from vendor.installations where instance_id = '${instanceId}';
         insert into vendor.clients (name, institution, email)
         values ('Rina', '${institution}', 'rina-${tag}@rs.test');`);
    staffId = createVendorStaff(staffEmail);
    proxy = vendorApiProxy('198.51.100.249');
    await new Promise<void>((resolve) => proxy.listen(8091, '0.0.0.0', resolve));
  });

  test.afterAll(() => {
    proxy?.close();
    proxy?.closeAllConnections();
    restoreLicense(original);
    sql(`delete from vendor.installations where instance_id = '${instanceId}';
         delete from vendor.clients where institution = '${institution}';
         delete from auth.users where id = '${staffId}';`);
  });

  test('kunci dibuat di portal, diaktifkan di Admin, dan terikat ke instalasi pertama', async ({
    page,
    browser,
    loginAs,
  }) => {
    test.setTimeout(180_000);
    const vendor = await browser.newPage({
      baseURL: env.vendorUrl,
      viewport: { width: 1440, height: 900 },
    });
    await signInVendorStaff(vendor, staffEmail);
    await vendor.getByRole('tab', { name: 'Klien & Instalasi' }).click();
    await vendor.getByRole('button', { name: `Kunci lisensi ${institution}` }).click();
    const dialog = vendor.getByRole('dialog');
    await expect(dialog.getByText('Belum ada kunci lisensi untuk klien ini.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Buat kunci' }).click();
    await dialog.getByLabel('Paket').fill('trial');
    await dialog.getByRole('button', { name: 'Buat kunci' }).click();
    await expect(dialog.getByRole('alert')).toContainText('bukan untuk trial');
    await dialog.getByLabel('Paket').fill('professional');
    await dialog.getByLabel('Masa berlaku (hari sejak aktivasi)').fill('365');
    await dialog.getByRole('checkbox', { name: 'Tampilan 3D' }).check();
    await dialog.getByRole('button', { name: 'Buat kunci' }).click();
    const output = dialog.getByRole('status', { name: 'Kunci lisensi baru' });
    await expect(output).toBeVisible();
    const licenseKey = (await output.getByLabel('Kunci lisensi').textContent())?.trim() ?? '';
    expect(licenseKey).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5}){4}$/);
    expect(sql(`select count(*) from vendor.license_keys where key_hash = '${licenseKey}'`)).toBe(
      '0',
    );
    await vendor.screenshot({ path: shot('01-kunci-baru'), fullPage: true });
    await dialog.getByRole('button', { name: 'Selesai' }).click();
    await expect(dialog.getByRole('row').nth(1)).toContainText('Belum dipakai');
    await vendor.keyboard.press('Escape');

    releaseLicense();
    await loginAs('super_admin');
    await expect(page).toHaveURL(/\/aktivasi$/);
    await page.getByRole('tab', { name: 'Kunci lisensi' }).click();
    await page
      .getByRole('textbox', { name: 'Kunci lisensi' })
      .fill(licenseKey.toLowerCase().replaceAll('-', ' '));
    await page.screenshot({ path: shot('02-admin-isi-kunci') });
    await page.getByRole('button', { name: 'Aktifkan' }).click();
    await expect(page.getByText('Lisensi berlaku.')).toBeVisible();
    expect(sql('select source from public.licenses where is_current')).toBe('online');
    const licenseId = sql('select license_id from public.licenses where is_current');
    expect(
      sql(`select l.status from vendor.licenses l
           join vendor.installations i on i.id = l.installation_id
           where i.instance_id = '${instanceId}' and l.license_id = '${licenseId}'`),
    ).toBe('active');
    expect(sql(`select payload ->> 'plan' from public.licenses where is_current`)).toBe(
      'professional',
    );
    await page.screenshot({ path: shot('03-admin-aktif') });

    const again = await activate(licenseKey, instanceId);
    expect(again.status).toBe(200);
    expect(again.body.licenseId).toBe(licenseId);
    const elsewhere = await activate(licenseKey, randomUUID());
    expect(elsewhere.status).toBe(409);
    expect(elsewhere.body.message).toBe('Kunci lisensi sudah dipakai instalasi lain.');

    await vendor.getByRole('button', { name: `Kunci lisensi ${institution}` }).click();
    const used = dialog.getByRole('row').nth(1);
    await expect(used).toContainText('Sudah diaktifkan');
    await expect(used).toContainText(instanceId);
    await expect(used).toContainText(licenseId);
    await expect(used.getByRole('button', { name: /Cabut/ })).toHaveCount(0);
    await expect(dialog).toHaveCSS('opacity', '1');
    await vendor.screenshot({ path: shot('04-portal-kunci-terpakai'), fullPage: true });
    await vendor.keyboard.press('Escape');
    const installation = vendor
      .getByRole('region', { name: 'Daftar instalasi' })
      .getByRole('row')
      .filter({ hasText: instanceId });
    await vendor.getByRole('button', { name: 'Muat ulang' }).click();
    await expect(installation).toContainText('professional');
    await vendor.close();
  });
});
