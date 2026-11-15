import { readFileSync } from 'node:fs';
import { deepLinkUrl, type LocationId, type Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { sql } from '../../../support/license';

const evidence = (name: string) => `evidence/T-574/${name}`;

async function pdfText(path: string) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await pdfjs.getDocument({
    data: new Uint8Array(readFileSync(path)),
    disableFontFace: true,
  }).promise;
  const pages: { width: number; height: number; strings: string[] }[] = [];
  for (let index = 1; index <= document.numPages; index++) {
    const page = await document.getPage(index);
    const [, , width = 0, height = 0] = page.view;
    const content = await page.getTextContent();
    pages.push({
      width: Math.round(width),
      height: Math.round(height),
      strings: content.items.flatMap((item) => ('str' in item ? [item.str] : [])),
    });
  }
  return pages;
}

async function download(page: Page, button: string, file: string) {
  const downloading = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: button }).click();
  const saved = await downloading;
  await saved.saveAs(evidence(file));
  return evidence(file);
}

test.describe('T-574 Papan "Anda di sini" dan stiker QR', () => {
  test('papan A3 per titik, cetak massal satu lantai, dan lembar stiker 20 lokasi', async ({
    page,
    browser,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    test.setTimeout(180_000);
    const venueId = fullVenue.venueId as Venue['id'];
    const { publicVisitorUrl } = await superAdmin.systemSettings.get();
    await superAdmin.systemSettings.update({ publicVisitorUrl: env.visitorUrl });
    try {
      const lobby = fullVenue.ids.lobbyOrigin;
      sql(`insert into public.origin_points (venue_id, floor_id, name, geom, heading_deg, node_id, public_code)
           select venue_id, floor_id, 'Pintu Timur', geom, 270, node_id, 'e2e574aaaaaa'
           from public.origin_points where id = '${lobby}'`);
      sql(`with free_units as (
             select f.id, row_number() over (order by f.unit_code) as n
             from public.features f
             where f.venue_id = '${venueId}' and f.kind = 'unit'
               and not exists (select 1 from public.location_units u where u.feature_id = f.id)
           ),
           made as (
             insert into public.locations (venue_id, location_type_id, name)
             select '${venueId}', (select location_type_id from public.locations
                                   where venue_id = '${venueId}' limit 1),
                    'Ruang Stiker ' || lpad(g::text, 2, '0')
             from generate_series(1, 20) g
             returning id, name
           )
           insert into public.location_units (location_id, feature_id, is_primary)
           select m.id, u.id, true
           from (select id, row_number() over (order by name) as n from made) m
           join free_units u on u.n = m.n`);
      await superAdmin.publications.publish(venueId);
      const snapshot = await superAdmin.snapshots.latest(venueId);
      const lobbyCode = snapshot.originPoints.find((p) => p.name === 'Lobi Utama')?.code;
      expect(lobbyCode).toBeTruthy();

      await loginAs('admin');
      await new AdminShell(page).selectVenue(fullVenue.name);
      await page.goto('/origin-points');
      const row = page.getByRole('row').filter({ hasText: 'Lobi Utama' });
      await row.getByRole('button', { name: 'Papan' }).click();
      const dialog = page.getByRole('dialog', { name: 'Cetak papan “Lobi Utama”' });
      await dialog.getByRole('radio', { name: 'A3', exact: true }).check();
      await expect(dialog.getByRole('button', { name: 'Buat PDF' })).toBeEnabled();
      await page.screenshot({ path: evidence('01-dialog-papan.png') });
      const single = await pdfText(await download(page, 'Buat PDF', '02-papan-lobi-a3.pdf'));
      expect(single).toHaveLength(1);
      const board = single[0];
      expect([board?.width, board?.height]).toEqual([842, 1191]);
      expect(board?.strings).toEqual(
        expect.arrayContaining([
          'Anda di sini',
          'Lobi Utama · GF Gedung Utama',
          'Legenda',
          'Lokasi utama',
          'Radiologi',
          'Pindai untuk petunjuk arah',
          'dari titik ini',
          'U',
        ]),
      );
      const printedUrl = board?.strings.find((text) => text.includes(`?o=${lobbyCode}`));
      expect(printedUrl).toBe(
        `${env.visitorUrl.replace(/^https?:\/\//, '')}/v/${venueId}?o=${lobbyCode}`,
      );

      const visitor = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await visitor.goto(`${env.visitorUrl.split('//')[0]}//${printedUrl}`);
      await expect(visitor.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
        timeout: 30_000,
      });
      await expect(visitor.getByText(/Anda di sini/).first()).toBeVisible();
      await expect(visitor.getByText('Lobi Utama', { exact: true })).toBeVisible();
      await visitor.screenshot({ path: evidence('03-visitor-dari-qr-papan.png') });

      await page.getByRole('button', { name: 'Cetak papan massal' }).click();
      const bulk = page.getByRole('dialog', { name: 'Cetak papan massal' });
      await expect(bulk.getByLabel('Lantai')).toContainText('2 titik');
      await bulk.getByRole('radio', { name: 'A3', exact: true }).check();
      const pages = await pdfText(await download(page, 'Buat PDF', '04-papan-massal-gf-a3.pdf'));
      expect(pages).toHaveLength(2);
      expect(pages.map((p) => p.strings.find((t) => t.includes(' · GF')))).toEqual([
        'Lobi Utama · GF Gedung Utama',
        'Pintu Timur · GF Gedung Utama',
      ]);

      await page.getByRole('button', { name: 'Stiker QR lokasi' }).click();
      const stickers = page.getByRole('dialog', { name: 'Stiker QR lokasi' });
      await stickers.getByRole('searchbox').fill('Ruang Stiker');
      await expect(stickers.getByRole('button', { name: 'Pilih semua hasil (20)' })).toBeVisible();
      await stickers.getByRole('searchbox').fill('');
      const all = stickers.getByRole('button', { name: /Pilih semua hasil/ });
      await expect(all).not.toHaveText('Pilih semua hasil (20)');
      const total = Number((await all.textContent())?.match(/\((\d+)\)/)?.[1]);
      expect(total).toBeGreaterThanOrEqual(20);
      await all.click();
      await expect(stickers.getByText(`${total} lokasi dipilih`)).toBeVisible();
      await page.screenshot({ path: evidence('05-dialog-stiker.png') });
      const sheets = await pdfText(await download(page, 'Buat lembar stiker', '06-stiker-a4.pdf'));
      expect(sheets).toHaveLength(Math.ceil(total / 15));
      expect(sheets.every((sheet) => sheet.width === 595 && sheet.height === 842)).toBe(true);
      const names = sheets.flatMap((sheet) =>
        sheet.strings.filter((text) => snapshot.locations.some((l) => l.name === text)),
      );
      expect(new Set(names).size).toBe(total);

      const target = snapshot.locations.find((l) => l.name === 'Ruang Stiker 07');
      if (!target) throw new Error('lokasi stiker tidak terbit');
      const stickerUrl = deepLinkUrl(env.visitorUrl, {
        venueId,
        to: { kind: 'location', locationId: target.id as LocationId },
      });
      await visitor.goto(stickerUrl);
      await expect(visitor.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
        timeout: 30_000,
      });
      await expect(visitor.getByText('Anda sedang di mana?')).toBeVisible();
      await visitor.screenshot({ path: evidence('07-visitor-dari-stiker.png') });
      await visitor.close();
    } finally {
      await superAdmin.systemSettings.update({ publicVisitorUrl });
    }
  });
});
