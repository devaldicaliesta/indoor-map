import type { EventInput, Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const evidence = (name: string) => `evidence/T-581/${name}.png`;
const HOUR = 3_600_000;
const XSS_TITLE = '<script>window.__xss=1</script>Seminar Jantung';
const XSS_DESCRIPTION = '<img src=x onerror="window.__xss=2">Gratis untuk umum';

function venueInput(offsetMs: number) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(Date.now() + offsetMs));
  return parts.replace(' ', 'T');
}

async function bannerPng(page: Page): Promise<Buffer> {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const gradient = ctx.createLinearGradient(0, 0, 640, 360);
    gradient.addColorStop(0, '#0b6e4f');
    gradient.addColorStop(1, '#f2c14e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText('Seminar', 40, 200);
    return canvas.toDataURL('image/png');
  });
  return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64');
}

const base = (overrides: Partial<EventInput>): EventInput => ({
  kind: 'event',
  status: 'active',
  title: { id: 'Event', en: '' },
  summary: { id: '', en: '' },
  description: { id: '', en: '' },
  imagePath: null,
  linkUrl: null,
  startsAt: new Date(Date.now() - HOUR).toISOString(),
  endsAt: new Date(Date.now() + HOUR).toISOString(),
  repeat: 'none',
  repeatUntil: null,
  point: null,
  locationIds: [],
  ...overrides,
});

test.describe('T-581 Event & Promo di Admin', () => {
  test('CRUD dengan gambar, lokasi, titik peta; validasi; teks aman; anon hanya yang aktif', async ({
    page,
    loginAs,
    superAdmin,
    publishedVenue,
  }) => {
    test.setTimeout(120_000);
    const { venue } = publishedVenue;
    const venueId = venue.id as Venue['id'];

    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    await page
      .getByRole('navigation', { name: 'Menu utama' })
      .getByRole('link', { name: 'Event & Promo' })
      .click();
    await expect(page.getByRole('heading', { name: 'Event & Promo' })).toBeVisible();
    await expect(page.getByText('Belum ada event')).toBeVisible();

    await page.getByRole('button', { name: 'Tambah event' }).click();
    const dialog = page.getByRole('dialog', { name: 'Event baru' });
    await dialog.getByRole('button', { name: 'Simpan event' }).click();
    await expect(dialog.getByText('Judul (Indonesia) wajib diisi.')).toBeVisible();

    await dialog.getByLabel('Judul (Indonesia)').fill(XSS_TITLE);
    await dialog.getByLabel('Mulai').fill(venueInput(-HOUR));
    await dialog.getByLabel('Selesai').fill(venueInput(-2 * HOUR));
    await expect(dialog.getByText('Waktu selesai harus setelah waktu mulai.')).toBeVisible();
    await dialog.getByLabel('Selesai').fill(venueInput(400 * 24 * HOUR));
    await expect(dialog.getByText('Durasi event paling lama 1 tahun.')).toBeVisible();
    await page.screenshot({ path: evidence('01-validasi') });

    await dialog.getByLabel('Selesai').fill(venueInput(2 * HOUR));
    await dialog.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Aktif' }).click();
    await dialog.getByLabel('Judul (English, opsional)').fill('Heart Seminar');
    await dialog
      .getByLabel('Ringkasan (Indonesia)')
      .fill('Bincang kesehatan jantung bersama dokter.');
    await dialog.getByLabel('Deskripsi (Indonesia)').fill(XSS_DESCRIPTION);
    await dialog.getByLabel('Tautan (opsional)').fill('https://contoh.id/daftar');
    await dialog.locator('#event-image').setInputFiles({
      name: 'seminar.png',
      mimeType: 'image/png',
      buffer: await bannerPng(page),
    });
    await dialog.getByLabel('Cari lokasi').fill('radio');
    await dialog.getByLabel('Tautkan Radiologi').check();

    await dialog.getByRole('button', { name: 'Pilih titik di peta' }).click();
    const picker = page.getByRole('dialog', { name: 'Titik event di peta' });
    const map = picker.getByTestId('event-point-map');
    await expect(map.locator('canvas')).toBeVisible();
    await page.waitForTimeout(500);
    await map.click({ position: { x: 200, y: 160 } });
    await expect(picker.getByText('Titik dipilih.')).toBeVisible();
    await picker.getByRole('button', { name: 'Pakai titik ini' }).click();
    await expect(dialog.getByText('Titik dipilih', { exact: true })).toBeVisible();

    const card = dialog.getByRole('article', { name: 'Pratinjau kartu' });
    await expect(card.getByRole('heading', { name: XSS_TITLE })).toBeVisible();
    await expect(card.getByText('Radiologi')).toBeVisible();
    await expect(card.locator('img')).toHaveJSProperty('complete', true);
    await page.screenshot({ path: evidence('02-form-dan-pratinjau') });
    await dialog.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(card.getByRole('heading', { name: 'Heart Seminar' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Simpan event' }).click();
    await expect(page.getByText('Event disimpan')).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: 'Seminar Jantung' });
    await expect(row.getByRole('cell').first()).toHaveText(XSS_TITLE);
    await expect(row).toContainText('Berlangsung');
    await expect(row).toContainText('Radiologi, Titik peta');
    expect(await page.evaluate(() => (window as { __xss?: number }).__xss)).toBeUndefined();
    await page.screenshot({ path: evidence('03-tabel') });

    await superAdmin.events.create(
      venueId,
      base({ title: { id: 'Draf Diskon', en: '' }, status: 'draft' }),
    );
    await superAdmin.events.create(
      venueId,
      base({
        title: { id: 'Promo Lewat', en: '' },
        kind: 'promotion',
        startsAt: new Date(Date.now() - 5 * HOUR).toISOString(),
        endsAt: new Date(Date.now() - 4 * HOUR).toISOString(),
      }),
    );
    await page.reload();
    await expect(page.getByRole('row')).toHaveCount(4);
    await page.getByRole('searchbox').fill('jantung');
    await expect(page.getByRole('row')).toHaveCount(2);
    await page.getByRole('searchbox').fill('');
    await page.getByRole('button', { name: 'Status', exact: true }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Selesai' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('row')).toHaveCount(2);
    await expect(page.getByRole('row').nth(1)).toContainText('Promo Lewat');
    await page.screenshot({ path: evidence('04-filter-selesai') });

    const rest = await page.request.get(
      `${env.supabaseUrl}/rest/v1/events?venue_id=eq.${venueId}&select=title_id,image_path,event_locations(location_id)`,
      { headers: { apikey: env.anonKey, authorization: `Bearer ${env.anonKey}` } },
    );
    const visible = (await rest.json()) as {
      title_id: string;
      image_path: string | null;
      event_locations: unknown[];
    }[];
    expect(visible.map((e) => e.title_id)).toEqual([XSS_TITLE]);
    expect(visible[0]?.event_locations).toHaveLength(1);
    const image = await page.request.get(
      `${env.supabaseUrl}/storage/v1/object/public/public-assets/${visible[0]?.image_path}`,
    );
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toBe('image/png');

    await page.goto('/events');
    await page
      .getByRole('row')
      .filter({ hasText: 'Seminar Jantung' })
      .getByRole('button', { name: 'Ubah' })
      .click();
    const edit = page.getByRole('dialog', { name: 'Ubah event' });
    await expect(edit.getByLabel('Tautkan Radiologi')).toBeChecked();
    await edit.getByLabel('Judul (Indonesia)').fill('Seminar Jantung Sehat');
    await edit.getByRole('button', { name: 'Simpan event' }).click();
    await expect(page.getByText('Event diperbarui')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Seminar Jantung Sehat' })).toBeVisible();

    await page
      .getByRole('row')
      .filter({ hasText: 'Draf Diskon' })
      .getByRole('button', { name: 'Hapus' })
      .click();
    await expect(page.getByText('Event dihapus')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Draf Diskon' })).toHaveCount(0);
    await page.screenshot({ path: evidence('05-ubah-hapus') });
  });

  test('TC-SEC-70: Viewer hanya membaca', async ({ page, loginAs, superAdmin, publishedVenue }) => {
    const { venue } = publishedVenue;
    await superAdmin.events.create(
      venue.id as Venue['id'],
      base({ title: { id: 'Bazar Buku', en: '' } }),
    );
    await loginAs('viewer');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/events');
    await expect(page.getByText('Mode baca')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Bazar Buku' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tambah event' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ubah' })).toHaveCount(0);
    await page.screenshot({ path: evidence('06-viewer-baca') });
  });
});
