import { VENUE_TEMPLATES, type Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';

const shot = (name: string) => `evidence/T-302/${name}.png`;
const sorted = (values: readonly string[]) => [...values].sort((a, b) => a.localeCompare(b));

test.describe('T-302 Tipe venue dan template industri', () => {
  test('wizard Kampus: pratinjau, isi template tersalin utuh, salinan tidak terikat venue lain', async ({
    page,
    loginAs,
    superAdmin,
  }) => {
    const name = `Kampus Ümmü ${Date.now().toString(36)}`;
    const template = VENUE_TEMPLATES.campus;
    const venues: Venue[] = [];
    try {
      await loginAs('super_admin');
      await page.goto('/venues');
      await page.getByRole('tab', { name: 'Semua venue' }).click();
      await page.getByRole('button', { name: 'Tambah venue' }).click();
      const dialog = page.getByRole('dialog', { name: 'Tambah venue' });
      await dialog.getByLabel('Nama').fill(name);
      await dialog.getByLabel('Titik pusat').fill('-6.175400, 106.827200');
      await dialog.getByRole('button', { name: 'Lanjut' }).click();

      // Langkah 2: pratinjau berubah sesuai tipe.
      await dialog.getByRole('radio', { name: 'Kampus' }).check();
      const firstType = template.locationTypes[0];
      if (!firstType) throw new Error('template kampus tanpa tipe lokasi');
      await expect(dialog.getByText(firstType.name, { exact: true })).toBeVisible();
      await expect(
        dialog.getByText(`${template.aliases.length} kata pencarian awal.`),
      ).toBeVisible();
      await page.screenshot({ path: shot('01-pratinjau-kampus') });
      await dialog.getByRole('button', { name: 'Lanjut' }).click();
      await expect(
        dialog.getByText(
          `${template.locationTypes.length} tipe lokasi, ${template.facilityTypes.length} jenis fasilitas`,
        ),
      ).toBeVisible();
      await page.screenshot({ path: shot('02-konfirmasi') });
      await dialog.getByRole('button', { name: 'Buat venue' }).click();
      await expect(page.getByText('Venue dibuat')).toBeVisible();

      const created = (await superAdmin.venues.listDetailed()).find((v) => v.name === name);
      if (!created) throw new Error('venue tidak tersimpan');
      venues.push(created);

      // Tipe lokasi + field, kategori, jenis fasilitas, dan alias sama dengan template.
      const types = await superAdmin.locationTypes.list(created.id);
      expect(sorted(types.map((t) => t.name))).toEqual(
        sorted(template.locationTypes.map((t) => t.name)),
      );
      for (const t of template.locationTypes) {
        const copy = types.find((x) => x.name === t.name);
        expect(copy?.fields.map((f) => [f.label, f.type, f.isRequired])).toEqual(
          t.fields.map((f) => [f.label, f.type, f.isRequired]),
        );
      }
      const categories = await superAdmin.categories.list(created.id);
      expect(sorted(categories.map((c) => c.name))).toEqual(
        sorted(template.locationTypes.flatMap((t) => t.categories.map((c) => c.name))),
      );
      const facilities = await superAdmin.facilityTypes.list(created.id);
      expect(sorted(facilities.map((f) => f.name))).toEqual(
        sorted(template.facilityTypes.map((f) => f.name)),
      );
      const aliases = [...(await superAdmin.aliases.listByVenue(created.id)).values()].flat();
      expect(sorted(aliases)).toEqual(sorted(template.aliases.map((a) => a.keyword)));

      // Venue kedua dari template yang sama, lalu salinan pertama diubah: venue kedua tetap.
      const second = await superAdmin.venues.create({
        name: `${name} B`,
        address: null,
        center: { type: 'Point', coordinates: [106.8272, -6.1754] },
        timezone: 'Asia/Jakarta',
      });
      venues.push(second);
      await superAdmin.venues.applyTemplate(second.id, template);
      const facility = facilities[0];
      if (!facility) throw new Error('template tanpa jenis fasilitas');
      await superAdmin.facilityTypes.remove(facility.id);
      expect((await superAdmin.facilityTypes.list(created.id)).length).toBe(facilities.length - 1);
      expect((await superAdmin.facilityTypes.list(second.id)).map((f) => f.name)).toContain(
        facility.name,
      );

      await expect(page.getByRole('combobox', { name: 'Venue aktif' })).toHaveText(name);
      await page.screenshot({ path: shot('03-venue-baru-terpilih') });
    } finally {
      for (const v of venues) await superAdmin.venues.remove(v.id);
    }
  });
});
