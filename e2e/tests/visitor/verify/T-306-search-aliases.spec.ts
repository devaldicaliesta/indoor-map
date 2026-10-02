import type { Venue } from '@indoor/domain';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { LoginPage } from '../../../pages/login-page';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-306/${name}.png`;

test.describe('T-306 Alias pencarian', () => {
  test('alias lokasi dan jenis fasilitas: tambah, ubah, hapus; berlaku di Visitor setelah publish', async ({
    page,
    browser,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);

    // Admin di konteks desktop terpisah; `page` (proyek visitor) dipakai sebagai Visitor.
    const adminContext = await browser.newContext({
      baseURL: env.adminUrl,
      viewport: { width: 1440, height: 900 },
    });
    const admin = await adminContext.newPage();
    const login = new LoginPage(admin);
    await login.goto();
    await login.signIn(ACCOUNTS.admin.email, env.password);
    await expect(admin).not.toHaveURL(/\/login/);
    await new AdminShell(admin).selectVenue(fullVenue.name);

    const editAliases = async (
      row: string,
      dialog: RegExp | string,
      value: string,
      save: string,
    ) => {
      await admin
        .getByRole('row')
        .filter({ hasText: row })
        .getByRole('button', { name: 'Ubah' })
        .click();
      const d = admin.getByRole('dialog', { name: dialog });
      await d.getByLabel('Alias pencarian (opsional)').fill(value);
      await d.getByRole('button', { name: save }).click();
      await expect(d).toBeHidden();
    };

    const visitor = new VisitorPage(page);
    const found = async (query: string, name: string) => {
      await visitor.goto(venueId);
      await visitor.search.fill(query);
      await expect(page.getByText(/^\d+ hasil$|^Tidak ada hasil untuk/).first()).toBeVisible();
      return visitor.results.filter({ hasText: name }).count();
    };

    // Tambah alias lokasi dan alias jenis fasilitas.
    await admin.goto('/locations');
    await editAliases('Radiologi', 'Ubah Radiologi', 'Rontgen, sinar tembus', 'Simpan lokasi');
    await admin.goto('/settings');
    await admin.getByRole('tab', { name: 'Jenis fasilitas' }).click();
    await editAliases('Toilet', 'Ubah Toilet', 'WC, kamar kecil', 'Simpan jenis');
    await admin.screenshot({ path: shot('01-alias-fasilitas') });
    const aliases = async () =>
      [...(await superAdmin.aliases.listByVenue(venueId)).values()].flat();
    await expect
      .poll(aliases)
      .toEqual(expect.arrayContaining(['Rontgen', 'sinar tembus', 'WC', 'kamar kecil']));

    // Belum publish: Visitor belum mengenal alias.
    expect(await found('sinar tembus', 'Radiologi')).toBe(0);
    expect(await found('kamar kecil', 'Toilet')).toBe(0);
    await superAdmin.publications.publish(venueId);
    expect(await found('sinar tembus', 'Radiologi')).toBe(1);
    await page.screenshot({ path: shot('02-cari-alias-lokasi') });
    expect(await found('kamar kecil', 'Toilet')).toBeGreaterThan(0);
    await page.screenshot({ path: shot('03-cari-alias-fasilitas') });

    // Ubah alias: "sinar tembus" diganti "pemindaian".
    await admin.goto('/locations');
    await editAliases('Radiologi', 'Ubah Radiologi', 'Rontgen, pemindaian', 'Simpan lokasi');
    await superAdmin.publications.publish(venueId);
    expect(await found('pemindaian', 'Radiologi')).toBe(1);
    expect(await found('sinar tembus', 'Radiologi')).toBe(0);

    // Hapus semua alias lokasi.
    await editAliases('Radiologi', 'Ubah Radiologi', '', 'Simpan lokasi');
    await expect.poll(aliases).not.toContain('Rontgen');
    await superAdmin.publications.publish(venueId);
    expect(await found('rontgen', 'Radiologi')).toBe(0);
    expect(await found('pemindaian', 'Radiologi')).toBe(0);
    await page.screenshot({ path: shot('04-alias-dihapus') });
    await adminContext.close();
  });
});
