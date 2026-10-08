import { expect, type Page, test } from '@playwright/test';
import { waitForMail } from '../../support/mailpit';

const shot = (name: string) => `evidence/T-505/${name}.png`;

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'halaman tidak bergeser ke samping').toBeLessThanOrEqual(0);
}

/**
 * Landing page vendor (T-505): isi lengkap ID/EN di HP dan desktop, video motion graphic, peta 3D
 * interaktif (konser dan rumah sakit), form trial ke Mailpit, validasi, dan kebijakan privasi.
 */
test.describe('T-505 Landing page dan form trial', () => {
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
      'Minta trial gratis',
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

  test('TC-LND-03 isian wajib, email salah, durasi di luar 14–30, tanpa persetujuan', async ({
    page,
  }) => {
    await page.goto('/?lang=id#trial');
    const form = page.locator('#trial form');
    await form.getByRole('button', { name: 'Kirim permintaan' }).click();
    await expect(form.getByRole('alert').first()).toContainText('Periksa isian yang ditandai');
    await expect(form.getByLabel('Nama lengkap')).toHaveAttribute('aria-invalid', 'true');
    await expect(form.getByLabel('Nama lengkap')).toBeFocused();
    await expect(form.getByText('Centang persetujuan untuk melanjutkan.')).toBeVisible();

    await form.getByLabel('Email kantor').fill('bukan-email');
    await form.getByLabel('Lama trial (hari)').fill('31');
    await form.getByRole('button', { name: 'Kirim permintaan' }).click();
    await expect(form.getByText('Format tidak valid.').first()).toBeVisible();
    await expect(form.getByText('Harus 14 sampai 30 hari.')).toBeVisible();
    await page.locator('#trial').screenshot({ path: shot('09-form-galat') });
  });

  test('TC-LND-02 form sah terkirim: email ke vendor dan konfirmasi ke pemohon di Mailpit', async ({
    page,
  }) => {
    const suffix = Date.now().toString(36);
    const email = `calon-${suffix}@malcontoh.co.id`;
    await page.goto('/?lang=id#trial');
    const form = page.locator('#trial form');
    await form.getByLabel('Nama lengkap').fill('Rina Wijaya');
    await form.getByLabel('Instansi / perusahaan').fill(`Mal Contoh ${suffix}`);
    await form.getByLabel('Jabatan').fill('Manajer Operasional');
    await form.getByLabel('Email kantor').fill(email);
    await form.getByLabel('Nomor telepon / WhatsApp').fill('+62 812-3456-7890');
    await form.getByLabel('Jenis gedung').selectOption('mall');
    await form.getByLabel('Perkiraan luas lantai').selectOption('20k-50k');
    await form.getByLabel('Lama trial (hari)').fill('30');
    await form.getByRole('checkbox').check();
    await page.locator('#trial').screenshot({ path: shot('10-form-terisi') });
    await form.getByRole('button', { name: 'Kirim permintaan' }).click();
    await expect(page.getByRole('status')).toContainText('Permintaan terkirim');
    await page.locator('#trial').screenshot({ path: shot('11-form-terkirim') });

    const confirmation = await waitForMail(email);
    expect(confirmation.subject).toBe('Permintaan trial PanduArah diterima');
    expect(confirmation.text).toContain(`Permintaan trial 30 hari untuk Mal Contoh ${suffix}`);
    const vendor = await waitForMail('panduarahid@gmail.com');
    expect(vendor.subject).toContain('Permintaan trial:');
  });

  test('kebijakan privasi ID/EN dan tautan dari form', async ({ page }) => {
    await page.goto('/?lang=id#trial');
    await page.getByRole('link', { name: 'kebijakan privasi', exact: true }).click();
    await expect(page).toHaveURL(/\/privasi\/\?lang=id$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Kebijakan privasi' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hak Anda' })).toBeVisible();
    await page.screenshot({ path: shot('12-privasi-id'), fullPage: true });
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();
    await page.getByRole('link', { name: /Back to home/ }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
