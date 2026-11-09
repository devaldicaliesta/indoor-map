import type { Browser, Page } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { LoginPage } from '../../../pages/login-page';
import { type InvitedUser, inviteUser } from '../../../support/auth-users';
import { sql } from '../../../support/license';

const shot = (name: string) => `evidence/T-598/${name}.png`;

// Pengingat lisensi memakai lisensi instalasi dan email ke akun seed Super Admin, jadi spec ini
// ikut proyek serial.
test.describe.configure({ mode: 'serial' });

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

interface MailSummary {
  ID: string;
  Subject: string;
}

async function mails(to: string, subject: string): Promise<MailSummary[]> {
  const query = `to:"${to}" subject:"${subject}"`;
  const response = await fetch(
    `${env.mailpitUrl}/api/v1/search?query=${encodeURIComponent(query)}`,
  );
  return ((await response.json()) as { messages: MailSummary[] }).messages;
}

async function mailText(id: string): Promise<string> {
  const response = await fetch(`${env.mailpitUrl}/api/v1/message/${id}`);
  return ((await response.json()) as { Text: string }).Text;
}

async function signInAs(browser: Browser, user: InvitedUser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(user.email, user.password);
  await expect(page.getByRole('button', { name: new RegExp(user.fullName) })).toBeVisible();
  return page;
}

async function openPreferences(page: Page, user: InvitedUser) {
  await page.getByRole('button', { name: new RegExp(user.fullName) }).click();
  await page.getByRole('menuitem', { name: 'Notifikasi email' }).click();
  return page.getByRole('dialog', { name: 'Notifikasi email' });
}

test.describe('T-598 Notifikasi email operasional', () => {
  test('TC-OPS-18: email publish sesuai preferensi; tautan berhenti berlangganan', async ({
    browser,
    page,
    publishedVenue,
    superAdmin,
  }) => {
    test.setTimeout(180_000);
    const { venue } = publishedVenue;
    const subject = `Peta ${venue.name} diterbitkan`;
    const quiet = await inviteUser(superAdmin, 't598a', 'editor');
    const reader = await inviteUser(superAdmin, 't598b', 'editor');

    // Editor pertama mematikan email publish dari menu akun.
    const quietPage = await signInAs(browser, quiet);
    const dialog = await openPreferences(quietPage, quiet);
    const publishBox = dialog.getByRole('checkbox', { name: /Peta diterbitkan/ });
    await expect(publishBox).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: /Pengingat lisensi/ })).toHaveCount(0);
    await publishBox.click();
    await expect(publishBox).not.toBeChecked();
    await expect(quietPage.getByText('Peta diterbitkan: email dimatikan')).toBeVisible();
    await capture(quietPage, '01-preferensi-editor');

    await superAdmin.publications.publish(venue.id);
    await expect.poll(async () => (await mails(reader.email, subject)).length).toBe(1);
    // Super Admin yang menerbitkan tidak mengirimi dirinya sendiri; Editor yang mematikan tidak menerima.
    expect(await mails(quiet.email, subject)).toHaveLength(0);
    const [mail] = await mails(reader.email, subject);
    const text = await mailText(mail?.ID ?? '');
    expect(text).toContain(`Peta ${venue.name} diterbitkan sebagai versi 2 oleh Super Admin Lokal`);
    const link = /(http\S+\/berhenti-langganan\?t=[0-9a-f]+)/.exec(text)?.[1] ?? '';
    expect(link).not.toBe('');
    await page.goto(`${env.mailpitUrl}/view/${mail?.ID}`);
    await page.screenshot({ path: shot('02-email-publish'), fullPage: true });

    // Tautan di email: tanpa login, konfirmasi dulu, lalu jenis itu berhenti.
    await page.goto(link);
    await expect(page.getByRole('heading', { name: 'Berhenti menerima email?' })).toBeVisible();
    await expect(page.getByText('"Peta diterbitkan"')).toBeVisible();
    await capture(page, '03-konfirmasi-berhenti');
    await page.getByRole('button', { name: 'Berhenti berlangganan' }).click();
    await expect(page.getByRole('heading', { name: 'Langganan dihentikan' })).toBeVisible();
    await capture(page, '04-berhenti');
    await page.goto('/berhenti-langganan?t=salah');
    await expect(page.getByRole('heading', { name: 'Tautan tidak berlaku' })).toBeVisible();

    await superAdmin.publications.publish(venue.id);
    // Penerima lain (Admin seed) membuktikan email publish ketiga sudah dikirim.
    const admin = ACCOUNTS.admin.email;
    await expect.poll(async () => (await mails(admin, subject)).length).toBe(3);
    expect(await mails(reader.email, subject)).toHaveLength(1);
    expect(await mails(quiet.email, subject)).toHaveLength(0);

    const readerPage = await signInAs(browser, reader);
    const readerDialog = await openPreferences(readerPage, reader);
    await expect(
      readerDialog.getByRole('checkbox', { name: /Peta diterbitkan/ }),
    ).not.toBeChecked();
  });

  test('TC-OPS-19: pengingat lisensi H-30, H-7, H-1 sekali per tahap (jam palsu)', async ({
    page,
  }) => {
    const licenseId = sql(`select license_id from public.licenses where is_current`);
    const until = Date.parse(
      sql(
        `select to_char((payload->>'validUntil')::timestamptz at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') from public.licenses where is_current`,
      ),
    );
    sql(`delete from app.license_reminders_sent where license_id = '${licenseId}'`);
    const at = (daysBefore: number) =>
      new Date(until - daysBefore * 86_400_000 + 3_600_000).toISOString();
    const remind = (daysBefore: number) =>
      sql(`select coalesce(app.license_reminders('${at(daysBefore)}')::text, '-')`);
    const superAdmin = ACCOUNTS.super_admin.email;
    const count = async () => (await mails(superAdmin, 'Lisensi PanduArah berakhir')).length;
    const before = await count();

    expect(remind(31)).toBe('-');
    expect(remind(30)).toBe('30');
    expect(remind(29)).toBe('-');
    expect(remind(7)).toBe('7');
    expect(remind(1)).toBe('1');
    expect(remind(1)).toBe('-');
    await expect.poll(count).toBe(before + 3);
    const subjects = (await mails(superAdmin, 'Lisensi PanduArah berakhir'))
      .slice(0, 3)
      .map((m) => m.Subject);
    expect(subjects.sort()).toEqual([
      'Lisensi PanduArah berakhir dalam 1 hari',
      'Lisensi PanduArah berakhir dalam 30 hari',
      'Lisensi PanduArah berakhir dalam 7 hari',
    ]);
    const [latest] = await mails(superAdmin, 'Lisensi PanduArah berakhir dalam 1 hari');
    await page.goto(`${env.mailpitUrl}/view/${latest?.ID}`);
    await page.screenshot({ path: shot('05-email-pengingat-lisensi'), fullPage: true });
    sql(`delete from app.license_reminders_sent where license_id = '${licenseId}'`);
  });
});
