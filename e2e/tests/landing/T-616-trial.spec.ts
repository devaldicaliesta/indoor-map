import { randomUUID } from 'node:crypto';
import { expect, test } from '../../fixtures';
import { sql } from '../../support/license';
import { waitForMail } from '../../support/mailpit';

const shot = (name: string) => `evidence/T-616/${name}.png`;
const TEMPLATE_SLUG = 'demo-kantor'; // jenis gedung "Perkantoran" (TRIAL_TEMPLATES)

// T-616: dari landing sampai ruang kerja trial siap, lewat Edge Function dan email sungguhan
// (FR-HT-01, FR-HT-02). Venue templat: venue demo kantor bila ada (`db:seed-demo`), selain itu
// venue uji yang sudah terbit dipakai sementara sebagai templat.
test.describe('T-616 Trial otomatis dari landing', () => {
  test('TC-HT-01/02 form → email verifikasi → tautan → ruang kerja siap', async ({
    page,
    publishedVenue,
  }) => {
    const borrowed =
      sql(`select count(*) from public.venues where slug = '${TEMPLATE_SLUG}'`) === '0';
    if (borrowed) {
      sql(`update public.venues set slug = '${TEMPLATE_SLUG}'
           where id = '${publishedVenue.venue.id}'`);
    }
    sql(`insert into app.server_settings (key, value) values ('hosting_mode', 'true')
           on conflict (key) do update set value = 'true'`);
    const tag = randomUUID().slice(0, 8);
    const email = `pemohon-${tag}@kantor-${tag}.co.id`;
    try {
      await page.goto('/?lang=id');
      await page.getByRole('link', { name: 'Coba gratis 17 hari' }).click();
      await expect(page).toHaveURL(/#trial$/);
      const trial = page.locator('#trial');
      await expect(trial.getByRole('link', { name: 'Lihat demo dulu' })).toHaveAttribute(
        'href',
        /\/v\/demo$/,
      );

      // Isian kosong ditolak di peramban dengan pesan per kolom.
      await trial.getByRole('button', { name: 'Minta trial' }).click();
      await expect(trial.getByText('Wajib diisi.').first()).toBeVisible();
      await expect(trial.getByLabel('Email kantor')).toHaveAttribute('aria-invalid', 'true');

      await trial.getByLabel('Nama lengkap').fill('Rina Wijaya');
      await trial.getByLabel('Nama instansi atau gedung').fill(`Menara Landing ${tag}`);
      await trial.getByLabel('Jabatan').fill('Manajer Fasilitas');
      await trial.getByLabel('Email kantor').fill(email);
      await trial.getByLabel('Telepon / WhatsApp').fill('+62 812 3456 7890');
      await trial.getByLabel('Jenis gedung').selectOption('office');
      await trial.getByLabel('Perkiraan luas lantai total').selectOption('lt5k');
      await trial.getByRole('checkbox').check();
      // Galat dari kiriman kosong hilang begitu kolomnya diisi.
      await expect(trial.getByText('Wajib diisi.')).toHaveCount(0);
      await trial.screenshot({ path: shot('01-form-trial') });
      await trial.getByRole('button', { name: 'Minta trial' }).click();
      await expect(trial.getByRole('heading', { name: 'Cek email Anda' })).toBeVisible();
      await expect(trial.getByText(email)).toBeVisible();
      await trial.screenshot({ path: shot('02-cek-email') });

      const mail = await waitForMail(email);
      expect(mail.subject).toBe('Konfirmasi trial PanduArah Anda');
      const link = /(http\S+\/trial\/verifikasi\/\?token=[A-Za-z0-9_-]+)/.exec(mail.text)?.[1];
      expect(link).toBeTruthy();

      await page.goto(link ?? '');
      await expect(page.getByRole('heading', { name: 'Ruang kerja Anda siap' })).toBeVisible({
        timeout: 60_000,
      });
      // Token dihapus dari alamat setelah dipakai.
      expect(page.url()).not.toContain('token=');
      await expect(page.getByRole('link', { name: 'Buka Admin' })).toHaveAttribute('href', /^http/);
      await expect(page.getByRole('link', { name: 'Lihat Visitor' })).toHaveAttribute(
        'href',
        new RegExp(`/v/menara-landing-${tag}$`),
      );
      await page.screenshot({ path: shot('03-ruang-kerja-siap') });

      // Membuka tautan yang sama lagi: sudah terpakai.
      await page.goto(link ?? '');
      await expect(page.getByRole('heading', { name: 'Tautan tidak berlaku' })).toBeVisible();
    } finally {
      sql(`delete from public.venues where id in (
             select t.venue_id from hosting.trials t
             join hosting.trial_requests r on r.id = t.request_id where r.email = '${email}');
           delete from auth.users where email = '${email}';
           delete from hosting.trial_requests where email = '${email}';`);
      if (borrowed) {
        sql(`update public.venues set slug = null where id = '${publishedVenue.venue.id}'`);
      }
    }
  });
});
