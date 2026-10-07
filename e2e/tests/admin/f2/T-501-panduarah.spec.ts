import type { Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { LoginPage } from '../../../pages/login-page';
import { inviteUser } from '../../../support/auth-users';
import { type Mail, waitForMail } from '../../../support/mailpit';

const shot = (name: string) => `evidence/T-501/${name}.png`;
const LEGACY_NAME = /indoor map/i;
const VENDOR_EMAIL = 'panduarahid@gmail.com';

/**
 * Email bermerek: pengirim PanduArah (email vendor di seed lokal), logo PNG inline yang dirujuk
 * HTML lewat `cid:`, dan kontak vendor di kaki email HTML maupun teks.
 */
function expectBrandedMail(mail: Mail) {
  expect(mail.fromName).toBe('PanduArah');
  expect(mail.fromAddress).toBe(VENDOR_EMAIL);
  expect(mail.text).toContain(`PanduArah — Indoor Navigation · Dukungan: ${VENDOR_EMAIL}`);
  expect(mail.html).toContain(`href="mailto:${VENDOR_EMAIL}"`);
  expect(`${mail.subject}\n${mail.text}\n${mail.html}`).not.toMatch(LEGACY_NAME);
  expect(mail.inline).toEqual([
    expect.objectContaining({
      fileName: 'panduarah.png',
      contentType: 'image/png',
      contentId: 'logo@panduarah',
    }),
  ]);
  expect(mail.html).toContain('src="cid:logo@panduarah"');
  expect(mail.html).toContain('alt="PanduArah"');
}

/** Tampilan email di Mailpit, setelah logo inline selesai dimuat di pratinjau HTML. */
async function captureMail(page: Page, mail: Mail, name: string) {
  await page.goto(`${env.mailpitUrl}/view/${mail.id}`);
  const logo = page.frameLocator('iframe').first().getByRole('img', { name: 'PanduArah' });
  await expect(logo).toBeVisible();
  await expect
    .poll(() => logo.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await page.screenshot({ path: shot(name) });
}

test.describe('T-501 Nama produk PanduArah — Admin', () => {
  test('TC-BRD-01 judul, logo, dan favicon di masuk, lupa password, aktivasi, dan beranda', async ({
    page,
    loginAs,
    fullVenue,
    variedVenues,
  }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(page).toHaveTitle('Admin · PanduArah');
    await expect(login.brand).toBeVisible();
    await expect(page.locator('body')).not.toContainText(LEGACY_NAME);
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
      'href',
      '/favicon.svg',
    );
    const favicon = await page.request.get('/favicon.svg');
    expect(favicon.headers()['content-type']).toContain('image/svg+xml');
    expect(await favicon.text()).toContain('id="symbol-blue"');
    await page.screenshot({ path: shot('01-masuk') });

    await page.getByRole('link', { name: 'Lupa password?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(login.brand).toBeVisible();
    await page.screenshot({ path: shot('02-lupa-password') });

    await loginAs('super_admin');
    const shell = new AdminShell(page);
    await shell.selectVenue(fullVenue.name);
    await expect(page.getByRole('cell', { name: 'Gedung Timur' })).toBeVisible();
    await expect(shell.brandLogo).toBeVisible();
    await expect(shell.brandLogo).toHaveAccessibleName('PanduArah');
    await expect(page).toHaveTitle('Admin · PanduArah');
    await expect(page.locator('body')).not.toContainText(LEGACY_NAME);
    // Logo digambar vektor: proporsinya sama dengan berkas resmi pada ukuran tampil apa pun.
    const box = await shell.brandLogo.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(28);
    expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(1538 / 404, 1);
    await page.screenshot({ path: shot('03-beranda-admin') });

    await page.getByRole('tab', { name: 'Semua venue' }).click();
    for (const venue of variedVenues.slice(0, 3)) {
      await expect(page.getByText(venue.name, { exact: true }).first()).toBeVisible();
    }
    await page.screenshot({ path: shot('04-semua-venue') });

    await page.goto('/aktivasi');
    await expect(page.getByRole('heading', { name: 'Pasang lisensi baru' })).toBeVisible();
    await expect(login.brand).toBeVisible();
    await expect(page.getByRole('link', { name: VENDOR_EMAIL })).toHaveAttribute(
      'href',
      `mailto:${VENDOR_EMAIL}`,
    );
    await page.screenshot({ path: shot('05-aktivasi') });

    await page.goto('/license');
    await expect(page.getByRole('link', { name: VENDOR_EMAIL })).toBeVisible();
    await page.screenshot({ path: shot('05b-lisensi-kontak-vendor') });
  });

  test('TC-BRD-04 sidebar diciutkan menampilkan simbol; varian putih tanpa kotak latar', async ({
    page,
    loginAs,
    fullVenue,
  }) => {
    await loginAs('admin');
    const shell = new AdminShell(page);
    await shell.selectVenue(fullVenue.name);
    await page.goto('/locations');
    await expect(page.getByRole('heading', { name: 'Lokasi' })).toBeVisible();

    await shell.setSidebarCollapsed(true);
    await expect(shell.brandSymbol).toBeVisible();
    await expect(shell.brandLogo).toHaveCount(0);
    const symbol = await shell.brandSymbol.boundingBox();
    const sidebar = await shell.sidebar.boundingBox();
    expect(symbol?.width ?? 999).toBeLessThan(sidebar?.width ?? 0);
    await page.screenshot({ path: shot('06-sidebar-diciutkan') });
    await shell.setSidebarCollapsed(false);
    await expect(shell.brandLogo).toBeVisible();

    // Galeri sistem desain: varian putih di atas --ink. Setiap bagian logo berisi warna
    // --on-strong dan elemen svg tidak punya latar sendiri.
    await page.goto('/_ui');
    const dark = page.getByTestId('brand-dark');
    await expect(dark).toBeVisible();
    const whiteMarks = dark.locator('svg[data-tone="white"]');
    await expect(whiteMarks).toHaveCount(4);
    const styles = await whiteMarks.evaluateAll((svgs) =>
      svgs.map((svg) => ({
        background: getComputedStyle(svg).backgroundColor,
        fills: [...svg.querySelectorAll('path')].map((path) => getComputedStyle(path).fill),
      })),
    );
    for (const style of styles) {
      expect(style.background).toBe('rgba(0, 0, 0, 0)');
      expect(new Set(style.fills)).toEqual(new Set(['rgb(255, 255, 255)']));
    }
    await dark.scrollIntoViewIfNeeded();
    await page.getByRole('heading', { name: 'Merek' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: shot('07-varian-putih-latar-gelap') });
  });

  test('TC-BRD-03 email undangan, reset password, dan pemberitahuan akun bermerek PanduArah', async ({
    page,
    superAdmin,
  }) => {
    const user = await inviteUser(superAdmin, 'merek');
    const invite = await waitForMail(user.email, 1);
    expect(invite.subject).toBe('Undangan Admin PanduArah');
    expectBrandedMail(invite);

    // Reset password lewat halaman Admin; tautan di email tetap membuka form password baru.
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(user.email);
    await page.getByRole('button', { name: 'Kirim tautan reset' }).click();
    await expect(page.getByRole('status')).toContainText(`Jika ${user.email} terdaftar`);
    const reset = await waitForMail(user.email, 2);
    expect(reset.subject).toBe('Atur ulang password Admin PanduArah');
    expectBrandedMail(reset);
    await captureMail(page, reset, '08-email-reset-password');
    await page.goto(reset.link);
    await expect(page).toHaveURL(/\/reset-password/);
    await expect(new LoginPage(page).brand).toBeVisible();
    await page.getByLabel('Password baru', { exact: true }).fill(`${user.password}-baru`);
    await page.getByLabel('Ulangi password baru').fill(`${user.password}-baru`);
    await page.screenshot({ path: shot('09-tautan-reset-berfungsi') });
    await page.getByRole('button', { name: 'Simpan password' }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Lima kali salah password: pemberitahuan akun terkunci dikirim ke pemiliknya.
    const login = new LoginPage(page);
    await login.goto();
    for (let attempt = 1; attempt <= 5; attempt++) {
      await login.signIn(user.email, `salah-${attempt}`);
      await expect(login.error).toBeVisible();
      await expect(login.submit).toBeEnabled();
    }
    const notice = await waitForMail(user.email, 3);
    expect(notice.subject).toBe('Akun Admin PanduArah dikunci sementara');
    expect(notice.text).toContain('Akun Admin PanduArah Anda dikunci selama 15 menit');
    expectBrandedMail(notice);
    await captureMail(page, notice, '10-email-akun-dikunci');
    await captureMail(page, invite, '11-email-undangan');
  });
});
