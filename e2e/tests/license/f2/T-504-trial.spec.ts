import { writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { signedInDb } from '@indoor/data/testing/full-venue';
import { TRIAL_FEATURES, TRIAL_QUOTA } from '@indoor/domain/license';
import { createVendorStub } from '../../../../tools/vendor-stub/src/server';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { currentLicenseId, devLicenseFile, restoreLicense, sql } from '../../../support/license';

const shot = (name: string) => `evidence/T-504/${name}.png`;
const DAY_MS = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

test.describe.configure({ mode: 'serial' });

/**
 * Lisensi trial (T-504): trial otomatis dari /aktivasi lewat vendor-stub, trial per permintaan
 * (berkas), batas trial di Admin dan API, masa tenggang, lalu upgrade ke lisensi berbayar.
 */
test.describe('T-504 Lisensi trial', () => {
  let original = '';
  let stub: Server;
  const suffix = Date.now().toString(36);

  test.beforeAll(async () => {
    original = currentLicenseId();
    stub = await createVendorStub();
    await new Promise<void>((resolve) => stub.listen(8091, '0.0.0.0', resolve));
  });

  test.afterAll(async () => {
    stub?.close();
    restoreLicense(original);
  });

  test('TC-TRL-02/03/05/10 Mulai trial di /aktivasi: aktif < 1 menit, banner, batas, trial kedua ditolak', async ({
    page,
    loginAs,
    superAdmin,
  }) => {
    await loginAs('super_admin');
    await page.goto('/aktivasi');
    await page.getByRole('tab', { name: 'Mulai trial' }).click();
    await page.getByLabel('Nama').fill('Rina Calon Klien');
    await page.getByLabel('Instansi').fill(`Mal Calon Klien ${suffix}`);
    await page.getByLabel('Email').fill(`rina-${suffix}@calon-${suffix}.co.id`);
    await page.screenshot({ path: shot('01-form-mulai-trial') });
    const started = Date.now();
    await page.getByRole('button', { name: 'Mulai trial 14 hari' }).click();
    await expect(page.getByText('Trial aktif')).toBeVisible({ timeout: 60_000 });
    expect(Date.now() - started).toBeLessThan(60_000);

    await page.goto('/venues');
    await expect(page.getByText('Trial — sisa 14 hari')).toBeVisible();
    await page.screenshot({ path: shot('02-banner-trial') });

    // Data seed melebihi batas trial: tambah venue nonaktif dengan pesan trial, API menolak.
    const venues = Number(sql('select count(*) from public.venues'));
    await page.getByRole('tab', { name: 'Semua venue' }).click();
    await expect(page.getByRole('button', { name: 'Tambah venue' })).toBeDisabled();
    await expect(
      page.getByText(`Batas trial tercapai (Venue ${venues}/${TRIAL_QUOTA.venues}).`),
    ).toBeVisible();
    await page.screenshot({ path: shot('03-tambah-venue-nonaktif') });
    const admin = await signedInDb(env.supabaseUrl, env.anonKey, {
      email: ACCOUNTS.admin.email,
      password: env.password,
    });
    const venue = await admin.from('venues').insert({ name: 'Venue Lewat Trial' });
    expect(venue.error?.message).toContain('Batas trial tercapai: venue');
    const [venueId, typeId] = sql(
      `select venue_id || '|' || id from public.location_types limit 1`,
    ).split('|');
    const location = await admin
      .from('locations')
      .insert({ venue_id: venueId ?? '', location_type_id: typeId ?? '', name: 'Lewat Trial' });
    expect(location.error?.message).toContain('Batas trial tercapai: lokasi');

    await page.goto('/license');
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
    await expect(page.getByText('Lisensi trial: data dibatasi')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Lokasi' })).toContainText(
      `/${TRIAL_QUOTA.locations}`,
    );
    await expect(page.getByRole('row').filter({ hasText: 'Pengguna Admin' })).toContainText(
      `/${TRIAL_QUOTA.users}`,
    );
    const limits = page.getByRole('region', { name: 'Batas per tindakan' });
    await expect(limits).toContainText('20');
    await expect(limits).toContainText('500');
    await page.screenshot({ path: shot('04-halaman-lisensi-trial'), fullPage: true });

    // Trial kedua untuk instalasi yang sama ditolak vendor.
    const again = await superAdmin.license
      .startTrial({ name: 'Rina', institution: 'Mal Lain', email: `lain-${suffix}@lain.id` })
      .catch((e: unknown) => e as Error);
    expect((again as Error).message).toContain('sudah pernah mendapat trial');
  });

  test('TC-TRL-12 upgrade ke berbayar: batas terangkat, data tetap, banner hilang', async ({
    page,
    loginAs,
    superAdmin,
  }) => {
    const before = sql(
      "select count(*) || '|' || (select count(*) from public.locations) from public.venues",
    );
    await superAdmin.license.activateManual(await devLicenseFile());
    expect(
      sql("select count(*) || '|' || (select count(*) from public.locations) from public.venues"),
    ).toBe(before);
    await loginAs('super_admin');
    await page.goto('/venues');
    await page.getByRole('tab', { name: 'Semua venue' }).click();
    await expect(page.getByRole('button', { name: 'Tambah venue' })).toBeEnabled();
    await expect(page.getByText(/Trial — sisa/)).toHaveCount(0);
    await page.screenshot({ path: shot('05-setelah-upgrade') });
  });

  test('TC-TRL-04/11 trial per permintaan lewat berkas, lalu masa tenggang 14 hari', async ({
    page,
    loginAs,
  }, testInfo) => {
    const now = Date.now();
    const file = await devLicenseFile({
      plan: 'trial',
      client: 'Gedung Tanpa Internet',
      validFrom: iso(now - DAY_MS),
      validUntil: iso(now + 29 * DAY_MS),
      quota: { ...TRIAL_QUOTA },
      features: [...TRIAL_FEATURES],
    });
    const path = testInfo.outputPath('lisensi-trial.json');
    writeFileSync(path, JSON.stringify(file));
    await loginAs('super_admin');
    await page.goto('/aktivasi');
    await page.getByRole('tab', { name: 'Unggah berkas' }).click();
    await page.getByLabel('Berkas lisensi (.json)').setInputFiles(path);
    await page.getByRole('button', { name: 'Pasang lisensi' }).click();
    await expect(page.getByText('Lisensi aktif')).toBeVisible();
    await page.goto('/venues');
    await expect(page.getByText('Trial — sisa 29 hari')).toBeVisible();

    // Trial berakhir kemarin: masa tenggang seperti lisensi biasa (Admin hanya-baca).
    sql(`update public.licenses
         set payload = jsonb_set(payload, '{validUntil}', to_jsonb('${iso(now - DAY_MS)}'::text))
         where is_current`);
    expect(sql('select state from public.license_status()')).toBe('grace');
    await page.reload();
    await expect(page.getByText(/Masa tenggang sampai/)).toBeVisible();
    await page.screenshot({ path: shot('06-trial-masa-tenggang') });
  });
});
