import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { drawPlan } from '../../../support/plan-files';

const shot = (name: string) => `evidence/T-106/${name}.png`;

const numberOf = (text: string) => Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));

test.describe('T-106 Georeferensi dan opasitas', () => {
  test('TC-PLAN tempatkan denah: geser, ukuran, rotasi, kalibrasi jarak, opasitas, simpan', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, floor } = testVenue;
    await loginAs('admin');
    const png = await drawPlan(page, 'image/png', 'GF — georeferensi');
    const plan = await superAdmin.floorPlans.upload(floor.id, {
      source: new File([png], 'denah-gf.png', { type: 'image/png' }),
    });
    expect(plan.corners).toBeNull();

    await new AdminShell(page).selectVenue(venue.name);
    await page.goto(`/venues/floors/${floor.id}/plan`);
    const map = page.getByTestId('georef-map');
    await expect(map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Tempatkan denah' })).toBeVisible();
    await page.screenshot({ path: shot('01-awal') });

    const status = page.getByText(/^(Tersimpan|Belum disimpan|Menyimpan…)$/);
    const width = page.getByLabel('Lebar');
    const height = page.getByLabel('Tinggi');
    const rotation = page.getByLabel('Rotasi (searah jarum jam dari utara)');

    // Ukuran dengan proporsi terkunci: tinggi ikut berubah.
    const heightBefore = numberOf(await height.inputValue());
    await width.fill('80');
    await width.press('Enter');
    await expect(width).toHaveValue(/^80/);
    await expect.poll(async () => numberOf(await height.inputValue())).not.toBe(heightBefore);
    await expect(status).toHaveText('Belum disimpan');

    // Rotasi dan opasitas.
    await rotation.fill('15');
    await rotation.press('Enter');
    await expect(rotation).toHaveValue(/^15([,.]0+)?$/);
    const opacity = page.getByLabel('Opasitas denah');
    await opacity.fill('40');
    await expect(page.locator('output[for="georef-opacity"]')).toHaveText('40%');
    await page.screenshot({ path: shot('02-ukuran-rotasi-opasitas') });

    // Kalibrasi jarak: ukur dua titik, nyatakan jarak nyata dua kali lipat → lebar ikut dua kali.
    const widthBefore = numberOf(await width.inputValue());
    await page.getByRole('button', { name: 'Ukur jarak' }).click();
    const box = await map.boundingBox();
    if (!box) throw new Error('peta georeferensi tidak tampil');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.click(cx - 60, cy);
    await page.mouse.click(cx + 60, cy);
    const measured = numberOf(
      (await page
        .getByRole('region', { name: 'Kalibrasi skala' })
        .locator('output')
        .textContent()) ?? '0',
    );
    expect(measured).toBeGreaterThan(0);
    await page
      .getByLabel('Jarak nyata (m)')
      .fill(String(Math.round(measured * 2 * 10) / 10).replace('.', ','));
    await page.screenshot({ path: shot('03-kalibrasi') });
    await page.getByRole('button', { name: 'Terapkan skala' }).click();
    await expect
      .poll(async () => numberOf(await width.inputValue()) / widthBefore)
      .toBeCloseTo(2, 0);
    await page.getByRole('button', { name: 'Selesai' }).click();

    // Simpan dulu, lalu geser dengan menyeret denah: sudut tersimpan harus berpindah.
    await page.getByRole('button', { name: 'Simpan posisi' }).click();
    await expect(status).toHaveText('Tersimpan');
    const beforeDrag = (await superAdmin.floorPlans.list(floor.id)).find(
      (p) => p.isActive,
    )?.corners;
    await page.mouse.move(cx, cy + 20);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy + 50, { steps: 8 });
    await page.mouse.up();
    await expect(status).toHaveText('Belum disimpan');

    await page.getByRole('button', { name: 'Simpan posisi' }).click();
    await expect(page.getByText('Posisi denah disimpan')).toBeVisible();
    await expect(status).toHaveText('Tersimpan');
    await page.screenshot({ path: shot('04-tersimpan') });

    const [saved] = (await superAdmin.floorPlans.list(floor.id)).filter((p) => p.isActive);
    expect(saved?.corners).toHaveLength(4);
    expect(saved?.corners).not.toEqual(beforeDrag);
    expect(saved?.opacity).toBeCloseTo(0.4, 2);

    // Terbaca ulang setelah muat ulang.
    const savedWidth = await width.inputValue();
    await page.reload();
    await expect(map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await expect(width).toHaveValue(savedWidth);
    await expect(rotation).toHaveValue(/^15([,.]0+)?$/);
    await expect(page.locator('output[for="georef-opacity"]')).toHaveText('40%');
  });
});
