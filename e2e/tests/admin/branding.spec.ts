import { env } from '../../env';
import { expect, test } from '../../fixtures';
import { AdminShell } from '../../pages/admin-shell';

const shot = (name: string) => `evidence/T-410/${name}.png`;
// PNG 1×1 hitam; cukup untuk membuktikan logo tersimpan dan tampil.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('Branding Visitor', () => {
  test('Admin mengatur logo, nama, dan warna; tampil di Visitor setelah publish', async ({
    page,
    browser,
    loginAs,
    publishedVenue,
    superAdmin,
  }) => {
    const { venue } = publishedVenue;
    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Branding' }).click();
    const preview = page.getByTestId('branding-preview');
    await expect(preview).toContainText(venue.name);
    await page.screenshot({ path: shot('01-branding-bawaan'), fullPage: true });

    // Isian salah ditolak dengan pesan per kolom.
    await page.getByLabel('Warna utama', { exact: true }).fill('kuning');
    await page.getByRole('button', { name: 'Simpan branding' }).click();
    await expect(page.getByText('Warna harus berformat #rrggbb')).toBeVisible();
    await page.screenshot({ path: shot('02-validasi-warna'), fullPage: true });

    // Kuning muda: teks tetap --ink dan terbaca.
    await page.getByLabel('Warna utama', { exact: true }).fill('#fff6b3');
    await expect(page.getByText(/memakai warna gelap \(kontras/)).toBeVisible();
    await page.getByLabel('Nama tampilan').fill('Kenari Medika');
    await page.getByLabel('Warna rute', { exact: true }).fill('#e4002b');
    await page.locator('#branding-logo').setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: PNG,
    });
    await expect(preview).toContainText('Kenari Medika');
    await page.screenshot({ path: shot('03-pratinjau-langsung'), fullPage: true });

    await page.getByRole('button', { name: 'Simpan branding' }).click();
    await expect(page.getByText('Branding disimpan')).toBeVisible();
    await page.screenshot({ path: shot('04-tersimpan'), fullPage: true });

    // Belum publish: Visitor masih memakai nama venue.
    const settings = await superAdmin.displaySettings.get(venue.id);
    expect(settings.branding).toEqual({
      displayName: 'Kenari Medika',
      primaryColor: '#fff6b3',
      routeColor: '#e4002b',
    });
    await superAdmin.publications.publish(venue.id);

    const visitor = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await visitor.goto(`${env.visitorUrl}/v/${venue.id}`);
    await expect(visitor.getByRole('heading', { name: 'Kenari Medika' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(visitor).toHaveTitle('Kenari Medika');
    const signal = await visitor.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--signal').trim(),
    );
    expect(signal).toBe('#fff6b3');
    const onSignal = await visitor.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--on-signal').trim(),
    );
    expect(onSignal).toBe('#111418');
    await expect(visitor.locator('aside img')).toHaveAttribute('src', /venues\/.*\/logo-/);
    await visitor.screenshot({ path: shot('05-visitor-desktop') });
    await visitor.close();

    const phone = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await phone.goto(`${env.visitorUrl}/v/${venue.id}`);
    await expect(phone.locator('header img')).toBeVisible({ timeout: 30_000 });
    await expect(phone).toHaveTitle('Kenari Medika');
    await expect(phone.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true');
    await phone.screenshot({ path: shot('05b-visitor-hp') });
    await phone.close();

    // Hapus logo dan kembali ke warna bawaan.
    await page.getByRole('button', { name: 'Hapus logo' }).click();
    await page.getByLabel('Warna utama', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Simpan branding' }).click();
    await expect(page.getByText('Branding disimpan')).toBeVisible();
    expect((await superAdmin.venues.get(venue.id)).logoPath).toBeNull();
    await page.screenshot({ path: shot('06-logo-dihapus'), fullPage: true });
  });

  test('Editor hanya melihat branding tanpa bisa mengubah', async ({
    page,
    loginAs,
    testVenue,
  }) => {
    await loginAs('editor');
    await new AdminShell(page).selectVenue(testVenue.venue.name);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Branding' }).click();
    await expect(page.getByLabel('Nama tampilan')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Simpan branding' })).toHaveCount(0);
    await page.screenshot({ path: shot('07-editor-baca-saja'), fullPage: true });
  });
});
