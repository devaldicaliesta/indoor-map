import type { Venue } from '@indoor/domain';
import { env } from '../../env';
import { expect, test } from '../../fixtures';
import { AdminShell } from '../../pages/admin-shell';
import { EditorPage } from '../../pages/editor-page';
import { currentLicenseId, devLicenseFile, restoreLicense } from '../../support/license';

const shot = (name: string) => `evidence/T-405/${name}.png`;

test.describe.configure({ mode: 'serial' });

test.describe('T-405 Fitur per paket', () => {
  let original = '';

  test.beforeAll(() => {
    original = currentLicenseId();
  });

  test.afterAll(() => {
    restoreLicense(original);
  });

  test('tanpa fitur 3d: tombol 3D tidak ada di Admin maupun Visitor; Info Point tidak terbit', async ({
    page,
    browser,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.license.activateManual(await devLicenseFile({ features: ['cad_import'] }));
    expect(await superAdmin.license.features()).toEqual(['cad_import']);

    await superAdmin.publications.publish(venueId);
    const snapshot = await superAdmin.snapshots.latest(venueId);
    expect(snapshot?.enabledFeatures).toEqual(['cad_import']);
    expect(snapshot?.infoPoints).toEqual([]);

    await loginAs('admin');
    await new AdminShell(page).selectVenue(fullVenue.name);
    await page.goto('/map-editor');
    await new EditorPage(page).waitReady();
    await expect(page.getByRole('button', { name: '2D', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '3D', exact: true })).toHaveCount(0);
    await page.screenshot({ path: shot('01-editor-tanpa-3d') });

    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Tampilan' }).click();
    await expect(page.getByRole('radio', { name: '3D' })).toBeDisabled();
    await expect(page.getByText('Tampilan 3D tidak termasuk paket lisensi ini.')).toBeVisible();

    const visitor = await browser.newPage({
      viewport: { width: 360, height: 740 },
      isMobile: true,
      hasTouch: true,
    });
    await visitor.goto(`${env.visitorUrl}/v/${venueId}`);
    await expect(visitor.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await expect(visitor.getByRole('button', { name: '3D', exact: true })).toHaveCount(0);
    await visitor.screenshot({ path: shot('02-visitor-tanpa-3d') });
    await visitor.close();
  });
});
