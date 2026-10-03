import { signedInDb } from '@indoor/data/testing/full-venue';
import type { Browser } from '@playwright/test';
import { ACCOUNTS } from '../../accounts';
import { env } from '../../env';
import { expect, test } from '../../fixtures';
import { currentLicenseId, devLicenseFile, restoreLicense, sql } from '../../support/license';

const shot = (name: string) => `evidence/T-406/${name}.png`;
const DAY_MS = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

/** Tanggal berakhir lisensi berlaku digeser (meniru waktu berjalan) tanpa menerbitkan berkas. */
const endsInDays = (days: number) =>
  sql(`update public.licenses
       set payload = jsonb_set(payload, '{validUntil}', to_jsonb('${iso(Date.now() + days * DAY_MS)}'::text))
       where is_current`);

async function openVisitor(browser: Browser, venueId: string, lang: 'id' | 'en' = 'id') {
  const page = await browser.newPage({ viewport: { width: 360, height: 740 }, isMobile: true });
  await page.goto(`${env.visitorUrl}/v/${venueId}?lang=${lang}`);
  return page;
}

test.describe.configure({ mode: 'serial' });

test.describe('T-406 Pengingat, masa tenggang, kedaluwarsa', () => {
  let original = '';

  test.beforeAll(() => {
    original = currentLicenseId();
  });

  test.afterAll(() => {
    restoreLicense(original);
  });

  test('H-7, masa tenggang, layanan berhenti setelah hari ke-14, lisensi baru memulihkan', async ({
    page,
    browser,
    loginAs,
    superAdmin,
    publishedVenue,
  }) => {
    const venueId = publishedVenue.venue.id;
    const latest = () => superAdmin.snapshots.latestUrl(venueId);
    const latestBody = async () => (await fetch(latest(), { cache: 'no-store' })).text();

    // H-7: banner pengingat.
    await superAdmin.license.activateManual(
      await devLicenseFile({ validUntil: iso(Date.now() + 7 * DAY_MS - 60_000) }),
    );
    await loginAs('admin');
    await page.goto('/venues');
    await expect(page.getByText(/Lisensi berakhir dalam 7 hari/)).toBeVisible();
    await page.screenshot({ path: shot('01-pengingat-h7') });

    // Hari ke-1 setelah berakhir: Admin hanya-baca dengan banner, Visitor normal.
    endsInDays(-1);
    await page.reload();
    await expect(page).toHaveURL(/\/venues$/);
    await expect(page.getByText(/Masa tenggang sampai/)).toBeVisible();
    await page.screenshot({ path: shot('02-masa-tenggang-admin') });
    const admin = await signedInDb(env.supabaseUrl, env.anonKey, {
      email: ACCOUNTS.admin.email,
      password: env.password,
    });
    const write = await admin.from('venues').insert({ name: 'Venue Masa Tenggang' });
    expect(write.error?.code).toBe('42501');
    const visitor = await openVisitor(browser, venueId);
    await expect(visitor.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await visitor.close();

    // Setelah hari ke-14: latest.json diganti penanda, Visitor menampilkan pesan (ID/EN).
    endsInDays(-15);
    await expect.poll(latestBody, { timeout: 20_000 }).toContain('serviceInactive');
    const inactive = await openVisitor(browser, venueId);
    await expect(inactive.getByText('Layanan peta tidak aktif')).toBeVisible();
    await inactive.screenshot({ path: shot('03-visitor-layanan-tidak-aktif') });
    await inactive.close();
    const inactiveEn = await openVisitor(browser, venueId, 'en');
    await expect(inactiveEn.getByText('Map service unavailable')).toBeVisible();
    await inactiveEn.close();
    await page.goto('/venues');
    await expect(page).toHaveURL(/\/aktivasi$/);

    // Lisensi baru: semuanya pulih tanpa kehilangan data.
    await superAdmin.license.activateManual(await devLicenseFile());
    await expect.poll(latestBody, { timeout: 20_000 }).toContain('"schemaVersion"');
    const restored = await openVisitor(browser, venueId);
    await expect(restored.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await restored.screenshot({ path: shot('04-visitor-pulih') });
    await restored.close();
    await page.goto('/venues');
    await expect(page).toHaveURL(/\/venues$/);
  });
});
