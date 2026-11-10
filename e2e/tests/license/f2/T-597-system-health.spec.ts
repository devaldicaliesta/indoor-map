import { createDataClient } from '@indoor/data';
import type { Page } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { sql } from '../../../support/license';

const shot = (name: string) => `evidence/T-597/${name}.png`;

// Keadaan server dan email peringatan berlaku untuk seluruh instalasi (email ke akun seed Super
// Admin), jadi spec ini ikut proyek serial agar tidak tercampur email uji di spec lain.
test.describe.configure({ mode: 'serial' });

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

/** Laporan agen `deploy/health-report.sh`, dengan disk dan sertifikat yang bisa diatur. */
function report(usedPercent: number, certDays: number) {
  const expires = new Date(Date.now() + certDays * 86_400_000).toISOString();
  const json = JSON.stringify({
    version: '1.4.0',
    services: [
      { name: 'db', state: 'running', health: 'healthy' },
      { name: 'auth', state: 'running', health: '' },
      { name: 'web', state: 'running', health: '' },
    ],
    disks: [{ path: '/var/lib/docker', total: 100 * 2 ** 30, used: usedPercent * 2 ** 30 }],
    cert: { domain: 'admin.rs-uji.id', expires_at: expires },
  });
  sql(`select app.health_report('${json}'::jsonb)`);
}

/** Hasil yang dicatat `deploy/backup.sh` lewat trap EXIT. */
const backup = (ok: boolean, message = '') =>
  sql(`select app.health_backup_result(${ok}, '${message}')`);

async function alertMails(): Promise<string[]> {
  const query = `to:"${ACCOUNTS.super_admin.email}" subject:"Peringatan PanduArah"`;
  const response = await fetch(
    `${env.mailpitUrl}/api/v1/search?query=${encodeURIComponent(query)}`,
  );
  const { messages } = (await response.json()) as { messages: { Subject: string }[] };
  return messages.map((m) => m.Subject);
}

test.describe('T-597 Kesehatan sistem', () => {
  test.beforeEach(() => {
    sql(`delete from app.server_health; delete from app.backup_runs; delete from app.health_alerts;
         delete from public.account_notices where kind <> 'account_locked';`);
  });
  test.afterAll(() => {
    sql(
      'delete from app.server_health; delete from app.backup_runs; delete from app.health_alerts;',
    );
  });

  test('TC-OPS-17: backup gagal 2×, disk > 85%, sertifikat < 14 hari → peringatan dan email', async ({
    page,
    loginAs,
  }) => {
    test.setTimeout(120_000);
    const before = (await alertMails()).length;
    report(62, 60);
    backup(true);

    await loginAs('super_admin');
    await page.getByRole('link', { name: 'Kesehatan sistem' }).click();
    await expect(page.getByText('Semua pemeriksaan normal.')).toBeVisible();
    await expect(page.getByText('1.4.0')).toBeVisible();
    await expect(page.getByText('62% terpakai')).toBeVisible();
    await capture(page, '01-normal');

    // Backup sengaja digagalkan: satu kali belum peringatan, dua kali berturut-turut ya.
    backup(false, 'Berhenti dengan kode 2 saat backup database.');
    await page.getByRole('button', { name: 'Muat ulang' }).click();
    await expect(page.getByText('Semua pemeriksaan normal.')).toBeVisible();
    backup(false, 'Berhenti dengan kode 2 saat backup database.');
    report(90, 10);
    await page.getByRole('button', { name: 'Muat ulang' }).click();
    const alerts = page.getByRole('list', { name: 'Peringatan' });
    await expect(alerts).toContainText('Backup gagal 2 kali berturut-turut');
    await expect(alerts).toContainText('Disk /var/lib/docker terpakai 90%');
    await expect(alerts).toContainText('Sertifikat HTTPS admin.rs-uji.id berakhir dalam');
    await expect(page.getByRole('table', { name: 'Riwayat backup' })).toContainText('Gagal');
    await capture(page, '02-peringatan');

    await expect
      .poll(async () => (await alertMails()).length - before, { timeout: 20_000 })
      .toBe(3);
    const subjects = await alertMails();
    expect(subjects.slice(0, 3).sort()).toEqual([
      'Peringatan PanduArah: backup gagal 2 kali berturut-turut',
      'Peringatan PanduArah: disk server hampir penuh',
      'Peringatan PanduArah: sertifikat HTTPS segera berakhir',
    ]);
    await page.goto(`${env.mailpitUrl}/`);
    await page
      .getByText('Peringatan PanduArah: backup gagal 2 kali berturut-turut')
      .first()
      .click();
    await expect(page.getByText('gagal 2 kali berturut-turut').first()).toBeVisible();
    await page.screenshot({ path: shot('03-email-backup-gagal'), fullPage: true });

    // Laporan berikutnya selama kejadian berlangsung tidak mengirim email lagi; pulih menutupnya.
    report(91, 9);
    backup(true);
    report(70, 80);
    await page.goto('/system-health');
    await expect(page.getByText('Semua pemeriksaan normal.')).toBeVisible();
    expect((await alertMails()).length - before).toBe(3);
    await capture(page, '04-pulih');
  });

  test('TC-SEC-76: hanya Super Admin yang membaca Kesehatan sistem', async ({ page, loginAs }) => {
    report(62, 60);
    await loginAs('admin');
    await expect(page.getByRole('link', { name: 'Kesehatan sistem' })).toHaveCount(0);
    await page.goto('/system-health');
    await expect(page.getByText(/tidak tersedia untuk role Anda/)).toBeVisible();
    await capture(page, '05-admin-ditolak');

    for (const role of ['admin', 'editor', 'operator', 'viewer'] as const) {
      const client = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
      await client.auth.signIn(ACCOUNTS[role].email, env.password);
      await expect(client.systemHealth.get(), role).rejects.toMatchObject({ kind: 'forbidden' });
      await client.auth.signOut();
    }
    const anon = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
    await expect(anon.systemHealth.get()).rejects.toMatchObject({ kind: 'forbidden' });
  });
});
