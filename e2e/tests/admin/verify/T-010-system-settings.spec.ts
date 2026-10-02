import type { Page } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';

const shot = (name: string) => `evidence/T-010/${name}.png`;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

async function openSystemTab(page: Page) {
  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Sistem' }).click();
  await expect(page.getByLabel('URL publik Visitor')).toBeVisible();
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
}

/** Email uji dengan nama pengirim itu yang dibuat setelah `since` sudah ada di Mailpit. */
async function testMailArrived(senderName: string, since: number): Promise<boolean> {
  const query = encodeURIComponent(`to:"${ACCOUNTS.super_admin.email}"`);
  const response = await fetch(`${env.mailpitUrl}/api/v1/search?query=${query}`);
  const { messages } = (await response.json()) as {
    messages: { Created: string; From: { Name: string } }[];
  };
  return messages.some((m) => m.From.Name === senderName && Date.parse(m.Created) >= since);
}

const NOT_HTTPS = 'Gunakan https agar QR dan tautan bagikan aman.';
const BAD_PORT = 'Port antara 1 dan 65535, biasanya 587 atau 465.';
const SENDER = 'Peta RS Harapan Sejahtera';

test.describe('T-010 Pengaturan sistem', () => {
  // Pengaturan berlaku untuk seluruh instalasi dan SMTP dipakai test lain lewat Mailpit:
  // host SMTP tidak diubah dan semua nilai dikembalikan di akhir test.
  test('TC-SYS ubah pengaturan, validasi per kolom, email uji ke Mailpit', async ({
    page,
    loginAs,
    superAdmin,
  }) => {
    const { updatedAt: _updatedAt, ...original } = await superAdmin.systemSettings.get();
    try {
      await loginAs('super_admin');
      await openSystemTab(page);
      await capture(page, '01-tab-sistem');

      const url = page.getByLabel('URL publik Visitor');
      const port = page.getByLabel('Port');
      const save = page.getByRole('button', { name: 'Simpan pengaturan' });

      await url.fill('http://peta.contoh.id/');
      await port.fill('dua lima');
      await save.click();
      await expect(page.getByText(NOT_HTTPS)).toBeVisible();
      await expect(page.getByText(BAD_PORT)).toBeVisible();
      await capture(page, '06-error-validasi');
      expect((await superAdmin.systemSettings.get()).publicVisitorUrl).toBe(
        original.publicVisitorUrl,
      );

      await url.fill('https://peta.rs-harapan-sejahtera.co.id');
      await port.fill(String(original.smtpPort ?? 1025));
      await page.getByRole('combobox', { name: 'Zona waktu default' }).click();
      await page
        .getByRole('option', { name: /Makassar|WITA/ })
        .first()
        .click();
      await page.getByRole('combobox', { name: 'Bahasa default' }).click();
      await page.getByRole('option', { name: 'English' }).click();
      await page.getByLabel('Pengirim').fill(`${SENDER} <noreply@local.test>`);
      await save.click();
      await expect(page.getByText('Pengaturan sistem tersimpan')).toBeVisible();
      await expect(page.getByText(NOT_HTTPS)).toHaveCount(0);
      await expect(page.getByText(BAD_PORT)).toHaveCount(0);
      await capture(page, '02-tersimpan');

      expect(await superAdmin.systemSettings.get()).toMatchObject({
        publicVisitorUrl: 'https://peta.rs-harapan-sejahtera.co.id',
        defaultTimezone: 'Asia/Makassar',
        defaultLanguage: 'en',
        smtpFrom: `${SENDER} <noreply@local.test>`,
        smtpHost: original.smtpHost,
      });

      await openSystemTab(page);
      await expect(url).toHaveValue('https://peta.rs-harapan-sejahtera.co.id');

      const since = Date.now() - 5_000;
      await page.getByRole('button', { name: 'Kirim email uji' }).click();
      await expect(page.getByText('Email uji terkirim')).toBeVisible();
      await capture(page, '03-email-uji-terkirim');
      await expect.poll(() => testMailArrived(SENDER, since)).toBe(true);
    } finally {
      await superAdmin.systemSettings.update(original);
    }
  });

  test('TC-SEC-09 Admin tidak melihat tab Sistem dan Catatan', async ({ page, loginAs }) => {
    await loginAs('admin');
    await page.goto('/settings');
    await expect(page.getByRole('tab', { name: 'Tampilan' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sistem' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Catatan' })).toHaveCount(0);
    await capture(page, '07-admin-tanpa-sistem');
  });
});
