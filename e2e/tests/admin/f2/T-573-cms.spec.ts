import { createDataClient, type DataClient } from '@indoor/data';
import {
  EMPTY_OPENING_HOURS,
  type LocationId,
  type LocationInput,
  type LocationStatus,
  type LocationTypeId,
  mediaFileName,
  type VenueId,
} from '@indoor/domain';
import type { Page } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-573/${name}.png`;
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const input = (name: string): LocationInput => ({
  code: '',
  name,
  description: '',
  customFields: {},
  status: 'active',
  openingDate: null,
  hours: EMPTY_OPENING_HOURS,
  categoryIds: [],
  unitIds: [],
  primaryUnitId: null,
});

async function seedLocations(data: DataClient, venueId: VenueId, count: number) {
  const [type] = await data.categories.listTypes(venueId);
  if (!type) throw new Error('venue uji tanpa tipe lokasi');
  const typeId = type.id as LocationTypeId;
  const names = Array.from({ length: count }, (_, i) => `Ruang ${String(i + 1).padStart(3, '0')}`);
  for (let i = 0; i < names.length; i += 10) {
    await Promise.all(
      names.slice(i, i + 10).map((name) =>
        data.locations.save(venueId, typeId, null, input(name), {
          keepPhotoPaths: [],
          newPhotos: [],
        }),
      ),
    );
  }
  return typeId;
}

async function statusCounts(data: DataClient, venueId: VenueId) {
  const counts: Record<LocationStatus, number> = {
    active: 0,
    coming_soon: 0,
    inactive_temporary: 0,
    inactive_permanent: 0,
  };
  for (const location of await data.locations.list(venueId)) counts[location.status] += 1;
  return counts;
}

async function signedIn(role: 'viewer' | 'operator') {
  const data = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
  await data.auth.signIn(ACCOUNTS[role].email, env.password);
  return data;
}

const PATHS: Record<string, string> = {
  Dasbor: '/dashboard',
  Media: '/media',
  Lokasi: '/locations',
};

async function openModule(page: Page, venueName: string, label: string) {
  await page.goto(PATHS[label] ?? '/');
  await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
  const shell = new AdminShell(page);
  if ((await shell.venuePicker.textContent()) !== venueName) await shell.selectVenue(venueName);
}

const figure = (page: Page, id: string) => page.getByTestId(id);

test.describe('T-573 Penguatan CMS', () => {
  test('TC-PAR-09/10: edit massal 100 lokasi dengan pratinjau, audit, dan undo; dasbor sama dengan data', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    test.setTimeout(240_000);
    const { venue } = testVenue;
    await seedLocations(superAdmin, venue.id, 100);

    await loginAs('editor');
    await openModule(page, venue.name, 'Dasbor');
    await expect(figure(page, 'locations-total')).toHaveText('100');
    await expect(figure(page, 'status-active')).toHaveText('100');
    await expect(figure(page, 'locations-without-unit')).toHaveText('100');
    await expect(figure(page, 'published-version')).toHaveText('Belum pernah diterbitkan.');
    await page.screenshot({ path: shot('01-dasbor-sebelum') });

    await page.getByRole('link', { name: 'Buka Lokasi' }).click();
    await expect(page.getByRole('heading', { name: 'Lokasi', exact: true })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Pilih semua lokasi di halaman ini' }).check();
    await expect(page.getByTestId('selection-count')).toHaveText('25 lokasi dipilih');
    await page.getByRole('button', { name: 'Pilih semua 100 hasil' }).click();
    await expect(page.getByTestId('selection-count')).toHaveText('100 lokasi dipilih');
    await page.screenshot({ path: shot('02-pilih-semua-hasil') });

    await page.getByRole('button', { name: 'Edit massal', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit massal 100 lokasi' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Status baru').click();
    await page.getByRole('option', { name: 'Nonaktif sementara' }).click();
    await expect(dialog.getByTestId('bulk-preview-summary')).toHaveText(
      '100 dari 100 lokasi berubah.',
    );
    await expect(
      dialog
        .getByRole('table', { name: 'Pratinjau perubahan' })
        .getByRole('row', { name: /Ruang 001/ }),
    ).toContainText('Nonaktif sementara');
    await page.screenshot({ path: shot('03-pratinjau-edit-massal') });
    await dialog.getByRole('button', { name: 'Terapkan ke 100 lokasi' }).click();
    await expect(page.getByText('100 lokasi diubah')).toBeVisible();
    await expect(dialog).toHaveCount(0);

    expect(await statusCounts(superAdmin, venue.id)).toMatchObject({
      active: 0,
      inactive_temporary: 100,
    });
    const [audit] = await superAdmin.audit.listRecent('location_bulk_edit');
    expect(audit?.actor?.email).toBe(ACCOUNTS.editor.email);
    expect(audit?.details).toMatchObject({ count: 100, venue_id: venue.id });

    const banner = page.getByRole('region', { name: 'Edit massal terakhir' });
    await expect(banner).toContainText('Status → Nonaktif sementara');
    await expect(banner).toContainText('100 lokasi');
    await page.screenshot({ path: shot('04-berhasil-dan-banner-undo') });

    await openModule(page, venue.name, 'Dasbor');
    await expect(figure(page, 'status-inactive_temporary')).toHaveText('100');
    await expect(figure(page, 'status-active')).toHaveText('0');

    await page
      .getByRole('navigation', { name: 'Menu utama' })
      .getByRole('link', { name: 'Lokasi' })
      .click();
    await banner.getByRole('button', { name: 'Urungkan' }).click();
    await expect(page.getByText('Edit massal diurungkan')).toBeVisible();
    await expect(banner).toHaveCount(0);
    expect(await statusCounts(superAdmin, venue.id)).toMatchObject({
      active: 100,
      inactive_temporary: 0,
    });
    const [undo] = await superAdmin.audit.listRecent('location_bulk_undo');
    expect(undo?.entityId).toBe(audit?.entityId);
    await page.screenshot({ path: shot('05-setelah-undo') });

    // TC-PAR-10: setiap angka dasbor sama dengan data sebenarnya.
    const locations = await superAdmin.locations.list(venue.id);
    await superAdmin.locationBulkEdits.apply(
      venue.id,
      locations.slice(0, 3).map((l) => l.id as LocationId),
      { kind: 'status', status: 'coming_soon', openingDate: '2027-01-15' },
    );
    const counts = await statusCounts(superAdmin, venue.id);
    await openModule(page, venue.name, 'Dasbor');
    await page.getByRole('button', { name: 'Muat ulang' }).click();
    for (const [status, value] of Object.entries(counts)) {
      await expect(figure(page, `status-${status}`)).toHaveText(String(value));
    }
    await expect(figure(page, 'status-coming_soon')).toHaveText('3');
    await expect(figure(page, 'findings-errors')).toBeVisible();
    await page.screenshot({ path: shot('06-dasbor-sama-dengan-data') });
  });

  test('TC-PAR-08: aset terpakai tidak bisa dihapus dan menyebut pemakainya; aset tidak terpakai terhapus', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    test.setTimeout(120_000);
    const { venue } = testVenue;
    await loginAs('editor');
    await openModule(page, venue.name, 'Media');
    await expect(page.getByText('Belum ada aset')).toBeVisible();
    await page.getByLabel('Berkas gambar').setInputFiles([
      { name: 'logo.png', mimeType: 'image/png', buffer: PNG },
      { name: 'bebas.png', mimeType: 'image/png', buffer: PNG },
    ]);
    await expect(page.getByText('2 gambar diunggah ke pustaka')).toBeVisible();

    const paths = (await superAdmin.media.list(venue.id)).map((a) => a.path);
    const used = paths.find((p) => mediaFileName(p).startsWith('media-logo-'));
    const free = paths.find((p) => mediaFileName(p).startsWith('media-bebas-'));
    if (!used || !free) throw new Error('unggahan tidak tersimpan');
    const [type] = await superAdmin.categories.listTypes(venue.id);
    await superAdmin.locations.save(venue.id, type?.id as LocationTypeId, null, input('Apotek'), {
      logoPath: used,
      keepPhotoPaths: [],
      newPhotos: [],
    });
    await superAdmin.locations.save(venue.id, type?.id as LocationTypeId, null, input('Kasir'), {
      keepPhotoPaths: [used],
      newPhotos: [],
    });

    await page.reload();
    const usedRow = page.getByRole('row').filter({ hasText: mediaFileName(used) });
    const freeRow = page.getByRole('row').filter({ hasText: mediaFileName(free) });
    await expect(usedRow).toContainText('Apotek');
    await expect(usedRow).toContainText('Kasir');
    await expect(freeRow).toContainText('Tidak terpakai');
    await page.screenshot({ path: shot('07-pustaka-media') });

    await usedRow.getByRole('button', { name: 'Hapus' }).click();
    const blocked = page.getByRole('dialog');
    await expect(blocked).toContainText('masih dipakai');
    await expect(blocked).toContainText('Lokasi "Apotek" (logo)');
    await expect(blocked).toContainText('Lokasi "Kasir" (foto)');
    await expect(blocked.getByRole('button', { name: 'Hapus aset' })).toHaveCount(0);
    await page.screenshot({ path: shot('08-aset-terpakai-ditolak') });
    await page.keyboard.press('Escape');
    await expect(blocked).toHaveCount(0);

    await freeRow.getByRole('button', { name: 'Hapus' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Hapus aset' }).click();
    await expect(page.getByText(`${mediaFileName(free)} dihapus`)).toBeVisible();
    await expect(freeRow).toHaveCount(0);
    expect((await superAdmin.media.list(venue.id)).map((a) => a.path)).toEqual([used]);

    // Server tetap menolak walau tombol dilewati.
    await expect(
      superAdmin.media.remove(venue.id, { bucket: 'public-assets', path: used }),
    ).rejects.toMatchObject({ kind: 'conflict' });
    await page.screenshot({ path: shot('09-aset-bebas-terhapus') });
  });

  test('TC-SEC-78: pustaka media dan edit massal untuk Super Admin, Admin, Editor; Operator, Viewer, tamu ditolak', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    test.setTimeout(180_000);
    const { venue } = testVenue;
    await seedLocations(superAdmin, venue.id, 2);
    const blob = new Blob([PNG], { type: 'image/png' });
    const path = await superAdmin.media.upload(venue.id, blob);
    const ids = (await superAdmin.locations.list(venue.id)).map((l) => l.id as LocationId);

    for (const role of ['super_admin', 'admin'] as const) {
      await loginAs(role);
      await openModule(page, venue.name, 'Media');
      await expect(page.getByRole('button', { name: 'Unggah gambar' })).toBeVisible();
      await page
        .getByRole('navigation', { name: 'Menu utama' })
        .getByRole('link', { name: 'Lokasi' })
        .click();
      await expect(
        page.getByRole('checkbox', { name: 'Pilih semua lokasi di halaman ini' }),
      ).toBeVisible();
      await new AdminShell(page).signOut(ACCOUNTS[role].name);
    }

    await loginAs('viewer');
    await openModule(page, venue.name, 'Media');
    await expect(page.getByText('Mode baca')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: mediaFileName(path) })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unggah gambar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Hapus' })).toHaveCount(0);
    await page.screenshot({ path: shot('10-viewer-media-baca') });
    await page
      .getByRole('navigation', { name: 'Menu utama' })
      .getByRole('link', { name: 'Lokasi' })
      .click();
    await expect(page.getByRole('row', { name: /Ruang 001/ })).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await new AdminShell(page).signOut(ACCOUNTS.viewer.name);

    await loginAs('operator');
    const nav = page.getByRole('navigation', { name: 'Menu utama' });
    await expect(nav.getByRole('link', { name: 'Media' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Dasbor' })).toHaveCount(0);
    await page.goto('/media');
    await expect(
      page.getByText(/tidak (memiliki|punya) (izin|akses)|Tidak berizin/i).first(),
    ).toBeVisible();
    await page.screenshot({ path: shot('11-operator-ditolak') });
    await new AdminShell(page).signOut(ACCOUNTS.operator.name);

    await page.goto('/media');
    await expect(page).toHaveURL(/\/login/);

    // Tingkat API (I): tombol yang disembunyikan tidak membuka jalan lewat server.
    for (const role of ['viewer', 'operator'] as const) {
      const data = await signedIn(role);
      await expect(
        data.locationBulkEdits.apply(venue.id, ids, {
          kind: 'status',
          status: 'inactive_permanent',
          openingDate: null,
        }),
      ).rejects.toMatchObject({ kind: 'forbidden' });
      await expect(
        data.media.remove(venue.id, { bucket: 'public-assets', path }),
      ).rejects.toMatchObject({ kind: 'forbidden' });
      await data.auth.signOut();
    }
    const anon = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
    await expect(anon.media.list(venue.id)).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(anon.venueDashboard.get(venue.id)).rejects.toMatchObject({ kind: 'forbidden' });
    expect(await statusCounts(superAdmin, venue.id)).toMatchObject({ active: 2 });
    expect((await superAdmin.media.list(venue.id)).map((a) => a.path)).toEqual([path]);
  });
});
