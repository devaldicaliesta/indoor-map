import type { Venue } from '@indoor/domain';
import { env } from '../../env';
import { expect, test } from '../../fixtures';
import { AdminShell } from '../../pages/admin-shell';
import { currentLicenseId, devLicenseFile, restoreLicense } from '../../support/license';

const evidence = (name: string) => `evidence/T-581/${name}.png`;
const HOUR = 3_600_000;
const LOCKED = 'Event & Promo tidak termasuk paket lisensi ini.';

test.describe.configure({ mode: 'serial' });

test.describe('T-581 Event & Promo tanpa fitur lisensi', () => {
  let original = '';

  test.beforeAll(() => {
    original = currentLicenseId();
  });

  test.afterAll(() => {
    restoreLicense(original);
  });

  test('TC-EVT-05: server menolak, menu terkunci dengan keterangan, Visitor tidak membaca', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const venueId = testVenue.venue.id as Venue['id'];
    const event = {
      kind: 'event' as const,
      status: 'active' as const,
      title: { id: 'Pameran Kampus', en: '' },
      summary: { id: '', en: '' },
      description: { id: '', en: '' },
      imagePath: null,
      linkUrl: null,
      startsAt: new Date(Date.now() - HOUR).toISOString(),
      endsAt: new Date(Date.now() + HOUR).toISOString(),
      repeat: 'none' as const,
      repeatUntil: null,
      point: null,
      locationIds: [],
    };
    await superAdmin.events.create(venueId, event);

    await superAdmin.license.activateManual(
      await devLicenseFile({ features: ['3d', 'info_point'] }),
    );
    await expect(superAdmin.events.create(venueId, event)).rejects.toMatchObject({
      message: LOCKED,
    });
    const anon = await page.request.get(
      `${env.supabaseUrl}/rest/v1/events?venue_id=eq.${venueId}&select=id`,
      { headers: { apikey: env.anonKey, authorization: `Bearer ${env.anonKey}` } },
    );
    expect(await anon.json()).toEqual([]);

    await loginAs('admin');
    await new AdminShell(page).selectVenue(testVenue.venue.name);
    const link = page
      .getByRole('navigation', { name: 'Menu utama' })
      .getByRole('link', { name: 'Event & Promo' });
    await expect(link).toHaveAttribute('aria-description', LOCKED);
    await link.hover();
    await expect(page.getByRole('tooltip')).toHaveText(LOCKED);
    await page.screenshot({ path: evidence('07-menu-terkunci') });
    await link.click();
    await expect(page.getByText(LOCKED)).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Pameran Kampus' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tambah event' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ubah' })).toHaveCount(0);
    await page.screenshot({ path: evidence('08-halaman-terkunci') });

    await superAdmin.license.activateManual(
      await devLicenseFile({ features: ['3d', 'info_point', 'events'] }),
    );
    const reopened = await page.request.get(
      `${env.supabaseUrl}/rest/v1/events?venue_id=eq.${venueId}&select=title_id`,
      { headers: { apikey: env.anonKey, authorization: `Bearer ${env.anonKey}` } },
    );
    expect(await reopened.json()).toEqual([{ title_id: 'Pameran Kampus' }]);
  });
});
