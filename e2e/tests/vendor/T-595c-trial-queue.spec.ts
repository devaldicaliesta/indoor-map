import { randomUUID } from 'node:crypto';
import { importLicensePublicKey, verifyLicense } from '@indoor/domain/license';
import { LICENSE_PUBLIC_KEY } from '@indoor/domain/license-public-key';
import { expect, test } from '@playwright/test';
import { env } from '../../env';
import { sql } from '../../support/license';
import { waitForMail } from '../../support/mailpit';
import { createVendorStaff, signInVendorStaff } from '../../support/vendor';

const shot = (name: string) => `evidence/T-595c/${name}.png`;
const VENDOR_INBOX = 'panduarahid@gmail.com';
const DAY_MS = 86_400_000;

interface Applicant {
  name: string;
  institution: string;
  email: string;
  instanceId: string;
}

async function submitTrial(applicant: Applicant, ip: string) {
  const response = await fetch(`${env.supabaseUrl}/functions/v1/vendor-api/v1/trial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(applicant),
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

const todayInJakarta = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

test.describe('T-595c Vendor Portal: antrean trial on-premise', () => {
  const tag = randomUUID().slice(0, 8);
  const staffEmail = `staf-antrean-${tag}@vendor.test`;
  const approved: Applicant = {
    name: 'Rina Wijaya',
    institution: `RS Antrean ${tag}`,
    email: `rina-${tag}@rs-antrean-${tag}.test`,
    instanceId: randomUUID(),
  };
  const rejected: Applicant = {
    name: 'Sari Lestari',
    institution: `Kampus Antrean ${tag}`,
    email: `sari-${tag}@kampus-${tag}.test`,
    instanceId: randomUUID(),
  };
  const ip = `198.51.100.${Number.parseInt(tag.slice(0, 2), 16) % 250}`;
  let staffId = '';

  test.beforeAll(() => {
    staffId = createVendorStaff(staffEmail);
  });

  test.afterAll(() => {
    sql(`delete from vendor.trial_requests where email like '%${tag}%';
         delete from vendor.clients where email like '%${tag}%';
         delete from auth.users where id = '${staffId}';`);
  });

  test('ajukan dari instalasi, setujui dengan lisensi terlampir, tolak dengan alasan', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const invalid = await submitTrial({ ...approved, instanceId: 'bukan-uuid' }, ip);
    expect(invalid).toEqual({ status: 400, body: { message: 'ID instalasi tidak valid.' } });
    for (const applicant of [approved, rejected]) {
      const queued = await submitTrial(applicant, ip);
      expect(queued.status).toBe(202);
      expect(queued.body.status).toBe('queued');
    }
    expect((await submitTrial(approved, ip)).status).toBe(202);
    expect(
      sql(
        `select count(*) from vendor.trial_requests where instance_id = '${approved.instanceId}'`,
      ),
    ).toBe('1');
    const notice = await waitForMail(
      VENDOR_INBOX,
      1,
      `Permintaan trial on-premise baru: ${approved.institution}`,
    );
    expect(notice.text).toContain(approved.instanceId);

    await signInVendorStaff(page, staffEmail);
    await page.getByRole('tab', { name: 'Klien & Instalasi' }).click();
    const queue = page.getByRole('region', { name: /Permintaan trial on-premise/ });
    const approvedRow = queue.getByRole('row').filter({ hasText: approved.instanceId });
    const rejectedRow = queue.getByRole('row').filter({ hasText: rejected.instanceId });
    await expect(approvedRow).toContainText('Menunggu');
    await expect(rejectedRow).toContainText('Menunggu');
    await page.screenshot({ path: shot('01-antrean'), fullPage: true });

    await approvedRow
      .getByRole('button', { name: `Setujui trial ${approved.institution}` })
      .click();
    const approveDialog = page.getByRole('dialog');
    const days = approveDialog.getByLabel('Lama trial (hari)');
    await expect(days).toHaveValue('14');
    await days.fill('31');
    await expect(approveDialog.getByText('Lama trial harus 14–30 hari.')).toBeVisible();
    await expect(
      approveDialog.getByRole('button', { name: 'Setujui dan kirim lisensi' }),
    ).toBeDisabled();
    await days.fill('20');
    await page.screenshot({ path: shot('02-setujui'), fullPage: true });
    await approveDialog.getByRole('button', { name: 'Setujui dan kirim lisensi' }).click();
    await expect(page.getByText(`dikirim ke ${approved.email}`)).toBeVisible();
    await expect(approvedRow).toContainText('Disetujui');
    await expect(approvedRow).toContainText(staffEmail);
    await expect(approvedRow.getByRole('button', { name: /Setujui/ })).toHaveCount(0);

    const licenseMail = await waitForMail(
      approved.email,
      1,
      `Lisensi trial PanduArah untuk ${approved.institution}`,
    );
    expect(licenseMail.text).toContain('Unggah berkas');
    expect(licenseMail.attachments).toHaveLength(1);
    const [attachment] = licenseMail.attachments;
    const license = JSON.parse(attachment?.content ?? '{}') as Record<string, unknown>;
    expect(attachment?.fileName).toBe(`lisensi-${String(license.licenseId)}.json`);
    expect(attachment?.contentType).toBe('application/json');
    const validUntil = new Date(Date.parse(`${todayInJakarta()}T00:00:00+07:00`) + 20 * DAY_MS)
      .toISOString()
      .replace('.000Z', 'Z');
    expect(license).toMatchObject({
      client: approved.institution,
      plan: 'trial',
      instanceId: approved.instanceId,
      validUntil,
    });
    const key = await importLicensePublicKey(LICENSE_PUBLIC_KEY);
    const check = await verifyLicense(license, key, approved.instanceId, new Date());
    expect(check.valid).toBe(true);

    const installationRow = page
      .getByRole('region', { name: 'Daftar instalasi' })
      .getByRole('row')
      .filter({ hasText: approved.instanceId });
    await expect(installationRow).toContainText(approved.institution);
    await expect(installationRow).toContainText('trial');
    await page.screenshot({ path: shot('03-disetujui'), fullPage: true });

    const again = await submitTrial({ ...approved, email: `lain-${tag}@lain-${tag}.test` }, ip);
    expect(again).toEqual({
      status: 409,
      body: { message: 'Instalasi ini sudah pernah mendapat trial.' },
    });

    await rejectedRow.getByRole('button', { name: `Tolak trial ${rejected.institution}` }).click();
    const rejectDialog = page.getByRole('dialog');
    await expect(rejectDialog.getByRole('button', { name: 'Tolak permintaan' })).toBeDisabled();
    await rejectDialog.getByLabel('Alasan penolakan').fill('Data instansi belum bisa diverifikasi');
    await rejectDialog.getByRole('button', { name: 'Tolak permintaan' }).click();
    await expect(page.getByText(`pemberitahuan dikirim ke ${rejected.email}`)).toBeVisible();
    await expect(rejectedRow).toContainText('Ditolak');
    await expect(rejectedRow).toContainText('Alasan: Data instansi belum bisa diverifikasi');
    const rejection = await waitForMail(
      rejected.email,
      1,
      `Permintaan trial PanduArah untuk ${rejected.institution}`,
    );
    expect(rejection.text).toContain('Alasan: Data instansi belum bisa diverifikasi');
    expect(rejection.attachments).toHaveLength(0);
    await page.screenshot({ path: shot('04-ditolak'), fullPage: true });
  });
});
