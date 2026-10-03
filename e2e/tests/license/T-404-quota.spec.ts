import { signedInDb } from '@indoor/data/testing/full-venue';
import { ACCOUNTS } from '../../accounts';
import { env } from '../../env';
import { expect, test } from '../../fixtures';
import { currentLicenseId, devLicenseFile, restoreLicense, sql } from '../../support/license';

const shot = (name: string) => `evidence/T-404/${name}.png`;
const count = (query: string) => Number(sql(query));

test.describe.configure({ mode: 'serial' });

test.describe('T-404 Halaman Lisensi dan kuota', () => {
  let original = '';

  test.beforeAll(() => {
    original = currentLicenseId();
  });

  test.afterAll(() => {
    restoreLicense(original);
  });

  test('kuota penuh: tombol tambah nonaktif, API menolak, pemakaian tampil benar', async ({
    page,
    loginAs,
    superAdmin,
  }) => {
    const used = {
      venues: count('select count(*) from public.venues'),
      buildings: count('select count(*) from public.buildings'),
      floors: count('select count(*) from public.floors where not is_outdoor'),
      infoPoints: count('select count(*) from public.info_points'),
    };
    // Venue, gedung, lantai tepat penuh; masih ada tempat untuk satu Info Point.
    await superAdmin.license.activateManual(
      await devLicenseFile({ quota: { ...used, infoPoints: used.infoPoints + 1 } }),
    );

    const admin = await signedInDb(env.supabaseUrl, env.anonKey, {
      email: ACCOUNTS.admin.email,
      password: env.password,
    });
    const venue = await admin.from('venues').insert({ name: 'Venue Lewat Kuota' });
    expect(venue.error?.message).toContain('Kuota paket tercapai');

    const [venueId, floorId] = sql(
      `select venue_id || '|' || id from public.floors where not is_outdoor limit 1`,
    ).split('|');
    const infoPoint = (code: string) =>
      admin.from('info_points').insert({
        venue_id: venueId ?? '',
        floor_id: floorId ?? '',
        code,
        name: `Info Point ${code}`,
        geom: 'SRID=4326;POINT(106.8272 -6.1754)',
      } as never);
    expect((await infoPoint('E2E-KUOTA-1')).error).toBeNull();
    const over = await infoPoint('E2E-KUOTA-2');
    expect(over.error?.message).toContain(
      `Kuota paket tercapai: Info Point ${used.infoPoints + 1}/${used.infoPoints + 1}`,
    );

    await loginAs('super_admin');
    await page.goto('/license');
    const infoRow = page.getByRole('row').filter({ hasText: 'Info Point' });
    await expect(infoRow).toContainText(`${used.infoPoints + 1}/${used.infoPoints + 1}`);
    await expect(infoRow).toContainText('Kuota paket tercapai');
    await expect(page.getByRole('row').filter({ hasText: 'Venue' })).toContainText(
      `${used.venues}/${used.venues}`,
    );
    await expect(page.getByText('RS Uji E2E')).toBeVisible();
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
    await page.screenshot({ path: shot('01-halaman-lisensi'), fullPage: true });

    await page.goto('/venues');
    await expect(page.getByRole('button', { name: 'Tambah gedung' })).toBeDisabled();
    await page.getByRole('tab', { name: 'Semua venue' }).click();
    await expect(page.getByRole('button', { name: 'Tambah venue' })).toBeDisabled();
    await expect(
      page.getByText(`Kuota paket tercapai (Venue ${used.venues}/${used.venues}).`),
    ).toBeVisible();
    await page.screenshot({ path: shot('02-tambah-venue-nonaktif') });

    sql(`delete from public.info_points where code like 'E2E-KUOTA-%'`);
  });
});
