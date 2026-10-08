import { expect, type Page, test } from '@playwright/test';

const shot = (name: string) => `evidence/T-505/${name}.png`;

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'halaman tidak bergeser ke samping').toBeLessThanOrEqual(0);
}

/**
 * Landing page vendor (T-505): isi lengkap ID/EN di HP dan desktop, video motion graphic, peta 3D
 * interaktif (konser dan rumah sakit), ajakan kontak lewat email, dan kebijakan privasi. Form trial
 * belum dipasang di situs terbit (branch landing-publish).
 */
test.describe('T-505 Landing page', () => {
  test('TC-LND-01 isi lengkap ID/EN di desktop dan HP 360 px tanpa geser ke samping', async ({
    page,
  }) => {
    await page.goto('/?lang=id');
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Pengunjung tidak lagi tersesat di gedung Anda.',
      }),
    ).toBeVisible();
    for (const name of [
      'Untuk gedung yang ramai dan rumit',
      'Fitur utama',
      'Coba peta 3D interaktif',
      'Cara kerja',
      'On-premise dan lisensi',
      'Tangkapan layar',
      'Hubungi kami',
    ]) {
      await expect(page.getByRole('heading', { level: 2, name })).toBeAttached();
    }
    const video = page.locator('video');
    await expect(video).toHaveAttribute('poster', '/media/panduarah-motion-poster.jpg');
    await expect(page.getByRole('button', { name: /Jeda video|Putar video/ })).toBeVisible();
    await noHorizontalScroll(page);
    await page.screenshot({ path: shot('01-desktop-id') });
    await page.screenshot({ path: shot('02-desktop-id-penuh'), fullPage: true });

    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Visitors never get lost in your building again.',
      }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/Indoor navigation/);
    await page.screenshot({ path: shot('03-desktop-en') });

    // Pilihan bahasa diingat; HP 360 px.
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await noHorizontalScroll(page);
    await page.screenshot({ path: shot('04-hp-en') });
    await page.goto('/?lang=id');
    await noHorizontalScroll(page);
    await page.screenshot({ path: shot('05-hp-id-penuh'), fullPage: true });
  });

  test('peta 3D interaktif: konser dengan orang mini, ganti lantai, rumah sakit', async ({
    page,
  }) => {
    await page.goto('/?lang=id#demo');
    const map = page.getByTestId('demo-map');
    await expect(map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await expect(map).toHaveAttribute('data-venue', 'concert');
    await expect(map).toHaveAttribute('data-people', 'on');
    await page.waitForTimeout(2500);
    const section = page.locator('#demo');
    await section.screenshot({ path: shot('06-demo-konser-3d') });

    const floors = page.getByRole('group', { name: 'Lantai' });
    const ground = await map.getAttribute('data-floor-id');
    await floors.getByRole('button', { name: 'L2' }).click();
    await expect(map).not.toHaveAttribute('data-floor-id', ground ?? '');
    await page.waitForTimeout(1500);
    await section.screenshot({ path: shot('07-demo-konser-l2') });

    await page.getByRole('button', { name: 'Ilustrasi orang' }).click();
    await expect(map).toHaveAttribute('data-people', 'off');
    await page.getByRole('button', { name: 'Rumah sakit' }).click();
    await expect(map).toHaveAttribute('data-venue', 'hospital');
    await expect(map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Ilustrasi orang' }).click();
    await page.waitForTimeout(2500);
    await section.screenshot({ path: shot('08-demo-rumah-sakit') });
  });

  test('ajakan kontak: tombol utama menuju bagian kontak dengan email vendor', async ({ page }) => {
    await page.goto('/?lang=id');
    await page.getByRole('link', { name: 'Hubungi kami' }).first().click();
    await expect(page).toHaveURL(/#kontak$/);
    const contact = page.locator('#kontak');
    await expect(contact.getByRole('link', { name: 'Kirim email' })).toHaveAttribute(
      'href',
      'mailto:panduarahid@gmail.com',
    );
    await expect(page.locator('form')).toHaveCount(0);
    await contact.screenshot({ path: shot('09-kontak') });
  });

  test('kebijakan privasi ID/EN dan tautan dari kaki halaman', async ({ page }) => {
    await page.goto('/?lang=id');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Kebijakan privasi' }).click();
    await expect(page).toHaveURL(/\/privasi\/\?lang=id$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Kebijakan privasi' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hak Anda' })).toBeVisible();
    await page.screenshot({ path: shot('10-privasi-id'), fullPage: true });
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();
    await page.getByRole('link', { name: /Back to home/ }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
