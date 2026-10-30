import { readFile } from 'node:fs/promises';
import { createDataClient } from '@indoor/data';
import type { Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { DataTablePage } from '../../../pages/data-table';
import { inviteUser } from '../../../support/auth-users';

const shot = (name: string) => `evidence/T-601/${name}.png`;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

test.describe('T-601a Data akun dan masa simpan log audit (UU PDP)', () => {
  test('TC-KOM-01: Super Admin mengekspor lalu menghapus akun; keduanya tercatat di Log audit', async ({
    page,
    loginAs,
    superAdmin,
  }) => {
    test.setTimeout(120_000);
    const user = await inviteUser(superAdmin, 't601', 'editor');

    await loginAs('super_admin');
    await page.goto('/users');
    const users = new DataTablePage(page, 'Pengguna');
    await users.ready();
    await users.searchFor(user.email);
    await users.expectTotal(1);

    const menu = page.getByRole('button', { name: `Aksi data akun ${user.fullName}` });
    await menu.click();
    await capture(page, '01-menu-data-akun');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: 'Ekspor data akun (JSON)' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(
      /^data-akun-t601-[a-z0-9]+-e2e-test-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const exported = JSON.parse(await readFile(await download.path(), 'utf8')) as {
      format: string;
      account: { email: string; full_name: string; role: string };
      audit_events: unknown[];
    };
    expect(exported.format).toBe('panduarah.user-data/1');
    expect(exported.account).toMatchObject({
      email: user.email,
      full_name: user.fullName,
      role: 'editor',
    });
    await expect(page.getByText(`Data akun ${user.fullName} diunduh`)).toBeVisible();

    await menu.click();
    await page.getByRole('menuitem', { name: 'Hapus akun…' }).click();
    const dialog = page.getByRole('dialog', { name: `Hapus akun ${user.fullName}?` });
    const confirm = dialog.getByRole('button', { name: 'Hapus akun' });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel(`Ketik ${user.email} untuk mengonfirmasi`).fill(user.email);
    await expect(confirm).toBeEnabled();
    await capture(page, '02-konfirmasi-hapus');
    await confirm.click();
    await expect(page.getByText(`Akun ${user.fullName} dihapus`)).toBeVisible();
    await users.expectTotal(0);
    await capture(page, '03-pengguna-terhapus');

    // Akun yang dihapus tidak bisa masuk lagi.
    const deleted = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
    await expect(deleted.auth.signIn(user.email, user.password)).rejects.toThrow();

    await page.goto('/settings?tab=audit');
    const audit = new DataTablePage(page, 'Log audit');
    await audit.ready();
    await audit.check('Aksi', ['Data akun diekspor', 'Akun dihapus']);
    await expect(
      audit.rows.filter({ hasText: 'Pengguna terhapus (Editor)' }).first(),
    ).toBeVisible();
    await expect(audit.rows.filter({ hasText: 'Data akun diekspor' }).first()).toBeVisible();
    await expect(audit.table).not.toContainText(user.email);
    await capture(page, '04-log-audit-export-hapus');
  });

  test('TC-KOM-02: masa simpan log audit diubah di Pengaturan Sistem dan tercatat', async ({
    page,
    loginAs,
    superAdmin,
  }) => {
    await loginAs('super_admin');
    await page.goto('/settings?tab=system');
    const retention = page.getByLabel('Masa simpan log audit (hari)');
    await expect(retention).toHaveValue('365');
    try {
      await retention.fill('7');
      await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
      await expect(page.getByText('Isi angka 30–3650 hari')).toBeVisible();

      await retention.fill('90');
      await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
      await expect(page.getByText('Pengaturan sistem tersimpan')).toBeVisible();
      await page.reload();
      await expect(page.getByLabel('Masa simpan log audit (hari)')).toHaveValue('90');
      await page.getByRole('heading', { name: 'Privasi data' }).scrollIntoViewIfNeeded();
      await capture(page, '05-pengaturan-masa-simpan');
      expect((await superAdmin.systemSettings.get()).auditRetentionDays).toBe(90);

      await page.goto('/settings?tab=audit');
      const audit = new DataTablePage(page, 'Log audit');
      await audit.ready();
      await audit.check('Aksi', ['Pengaturan diubah']);
      await expect(audit.rows.filter({ hasText: 'masa simpan log audit' }).first()).toBeVisible();
      await capture(page, '06-log-audit-pengaturan');
    } finally {
      await superAdmin.systemSettings.update({ auditRetentionDays: 365 });
    }
  });
});
