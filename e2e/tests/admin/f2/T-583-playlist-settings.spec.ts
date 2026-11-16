import type { Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { sql } from '../../../support/license';

const evidence = (name: string) => `evidence/T-583/${name}.png`;
const HOUR = 3_600_000;

test.describe('T-583 Pengaturan playlist Info Point', () => {
  test('Editor menyalakan playlist, durasi slide divalidasi, memilih event tertentu', async ({
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    const infoPointId = fullVenue.ids.lobbyInfoPoint;
    const event = await superAdmin.events.create(venueId, {
      kind: 'promotion',
      status: 'active',
      title: { id: 'Promo Kafetaria', en: '' },
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
    });
    const name = sql(`select name from public.info_points where id = '${infoPointId}'`);

    await loginAs('editor');
    await new AdminShell(page).selectVenue(fullVenue.name);
    await page.goto('/origin-points');
    await page.getByRole('tab', { name: 'Info Point' }).click();
    const row = page.getByRole('row').filter({ hasText: name });
    await row.getByRole('button', { name: 'Ubah' }).click();
    const dialog = page.getByRole('dialog', { name: `Ubah ${name}` });
    const playlist = dialog.getByRole('group', { name: 'Playlist promosi saat idle' });
    await playlist.getByLabel('Putar Event & Promo di layar penuh saat tidak dipakai').check();
    await playlist.getByLabel('Durasi per slide (detik)').fill('3');
    await dialog.getByRole('button', { name: 'Simpan' }).click();
    await expect(dialog.getByText('Durasi per slide 4–60 detik.')).toBeVisible();

    await playlist.getByLabel('Durasi per slide (detik)').fill('6');
    await playlist.getByLabel('Event tertentu').check();
    await playlist
      .getByRole('list', { name: 'Pilih event' })
      .getByLabel(/Promo Kafetaria/)
      .check();
    await playlist.scrollIntoViewIfNeeded();
    await page.screenshot({ path: evidence('06-admin-pengaturan-playlist') });
    await dialog.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByText('Info Point disimpan dan ditempelkan ke jalur')).toBeVisible();
    await expect(row).toContainText('playlist 6 s');
    expect(
      sql(`select playlist_enabled || ' ' || playlist_slide_seconds || ' ' || array_to_string(playlist_event_ids, ',')
           from public.info_points where id = '${infoPointId}'`),
    ).toBe(`true 6 ${event.id}`);

    await row.getByRole('button', { name: 'Ubah' }).click();
    await expect(playlist.getByLabel('Event tertentu')).toBeChecked();
    await playlist.getByLabel('Semua event aktif').check();
    await dialog.getByRole('button', { name: 'Simpan' }).click();
    await expect(dialog).toHaveCount(0);
    expect(
      sql(
        `select cardinality(playlist_event_ids) from public.info_points where id = '${infoPointId}'`,
      ),
    ).toBe('0');
  });
});
