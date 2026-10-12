import { readFileSync } from 'node:fs';
import { totpCode } from '@indoor/data/testing/totp';
import { expect, type Page, test } from '@playwright/test';
import { env } from '../../env';
import { sql } from '../../support/license';
import { createVendorFixture, removeVendorFixture, type VendorFixture } from '../../support/vendor';

const shot = (name: string) => `evidence/T-617/${name}.png`;

async function signIn(page: Page, email: string) {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(env.password);
  await page.getByRole('button', { name: 'Masuk' }).click();
}

const rowOf = (page: Page, institution: string) =>
  page.getByTestId('lead-row').filter({ hasText: institution });

// T-617: dasbor vendor (FR-HT-14) — staf vendor masuk dengan password + aplikasi autentikator,
// lalu memantau kapasitas, memperpanjang, mengunci, menghapus, mengekspor leads, dan memblokir.
test.describe('T-617 Dasbor vendor', () => {
  let fixture: VendorFixture;
  test.beforeAll(() => {
    fixture = createVendorFixture();
  });
  test.afterAll(() => removeVendorFixture(fixture));

  test('TC-HT-14 masuk dengan 2FA, kelola trial, ekspor leads, blokir', async ({ page }) => {
    test.setTimeout(180_000);
    const { institutions } = fixture;

    // ---- Masuk: password lalu pendaftaran aplikasi autentikator ----
    await signIn(page, fixture.staffEmail);
    await expect(
      page.getByRole('heading', { name: 'Pasang verifikasi dua langkah' }),
    ).toBeVisible();
    await expect(page.getByAltText('QR untuk aplikasi autentikator')).toBeVisible();
    const secret = (await page.getByTestId('totp-secret').textContent()) ?? '';
    await page.screenshot({ path: shot('01-pasang-2fa') });
    await page.getByLabel('Kode 6 digit').fill('000000');
    await page.getByRole('button', { name: 'Verifikasi' }).click();
    await expect(page.getByRole('alert')).toContainText('Kode salah');
    await page.getByLabel('Kode 6 digit').fill(totpCode(secret));
    await page.getByRole('button', { name: 'Verifikasi' }).click();

    // ---- Ringkasan dan daftar ----
    await expect(page.getByRole('heading', { name: 'Trial ter-hosting' })).toBeVisible();
    const summary = page.getByRole('definition').first();
    await expect(summary).toHaveText(/^\d+\/\d+$/);
    await expect(rowOf(page, institutions.extend)).toContainText('Aktif');
    await expect(rowOf(page, institutions.extend)).toContainText('Sisa 5 hari');
    await page.screenshot({ path: shot('02-dasbor'), fullPage: true });
    await page.getByRole('tab', { name: /^Antre/ }).click();
    await expect(rowOf(page, institutions.queued)).toContainText('Antre');
    await page.getByRole('tab', { name: /^Aktif/ }).click();

    // ---- Perpanjang (total ≤ 17 hari) ----
    await rowOf(page, institutions.extend).getByRole('button', { name: 'Perpanjang' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('sisa 17 hari');
    await dialog.getByLabel('Tambah (hari)').fill('7');
    await page.screenshot({ path: shot('03-perpanjang') });
    await dialog.getByRole('button', { name: 'Perpanjang' }).click();
    await expect(page.getByText(`Trial ${institutions.extend} diperpanjang sampai`)).toBeVisible();
    await expect(rowOf(page, institutions.extend)).toContainText('Sisa 12 hari');
    await expect(rowOf(page, institutions.extend)).toContainText('diperpanjang 7 hari');

    // ---- Kunci: siklus hidup yang sama dengan hari ke-17 ----
    await rowOf(page, institutions.extend).getByRole('button', { name: 'Kunci' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Kunci trial' }).click();
    await expect(page.getByText(`Trial ${institutions.extend} dikunci.`)).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole('tab', { name: /^Terkunci/ }).click();
    await expect(rowOf(page, institutions.extend)).toContainText('Terkunci');
    await expect(
      rowOf(page, institutions.extend).getByRole('button', { name: 'Perpanjang' }),
    ).toHaveCount(0);
    expect(
      sql(`select status from hosting.trial_requests where email = '${fixture.applicantEmail}'`),
    ).toBe('locked');
    await page.screenshot({ path: shot('04-terkunci'), fullPage: true });

    // ---- Hapus: venue dan akun pemohon hilang, lead tetap ----
    await page.getByRole('tab', { name: /^Aktif/ }).click();
    await rowOf(page, institutions.remove).getByRole('button', { name: 'Hapus' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Hapus permanen' }).click();
    await expect(page.getByText(`Ruang kerja ${institutions.remove} dihapus.`)).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole('tab', { name: /^Semua leads/ }).click();
    await expect(rowOf(page, institutions.remove)).toContainText('Dihapus');
    expect(sql(`select count(*) from public.venues where id = '${fixture.venueIds[1]}'`)).toBe('0');

    // ---- Ekspor leads ----
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Ekspor leads (CSV)' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^leads-panduarah-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = readFileSync((await file.path()) ?? '', 'utf8');
    expect(csv.startsWith('﻿Tanggal permintaan,Nama,Instansi')).toBe(true);
    expect(csv).toContain(institutions.queued);
    // Nomor telepon diawali "+" diberi kutip agar tidak dibaca rumus oleh spreadsheet.
    expect(csv).toContain("'+62 811 0000 0000");

    // ---- Daftar blokir ----
    const blockValue = page.getByLabel('Email atau domain');
    await blockValue.fill('gmail.com');
    await page.getByRole('button', { name: 'Blokir', exact: true }).click();
    await expect(page.getByText('Domain email umum tidak bisa diblokir')).toBeVisible();
    await blockValue.fill(`Spam-${fixture.tag}.co.id`);
    await page.getByLabel('Catatan (opsional)').fill('Pendaftaran berulang');
    await page.getByRole('button', { name: 'Blokir', exact: true }).click();
    const entry = page
      .getByRole('region', { name: 'Daftar blokir' })
      .getByRole('listitem')
      .filter({ hasText: `spam-${fixture.tag}.co.id` });
    await expect(entry).toContainText('Domain');
    await expect(entry).toContainText('Pendaftaran berulang');
    await entry.scrollIntoViewIfNeeded();
    await page.screenshot({ path: shot('05-daftar-blokir'), fullPage: true });
    await entry.getByRole('button', { name: 'Buka blokir' }).click();
    await expect(entry).toHaveCount(0);

    // ---- Masuk berikutnya: kode dari aplikasi yang sama ----
    await page.getByRole('button', { name: 'Keluar' }).click();
    await expect(page.getByRole('heading', { name: 'Masuk ke dasbor vendor' })).toBeVisible();
    await signIn(page, fixture.staffEmail);
    await expect(page.getByRole('heading', { name: 'Verifikasi dua langkah' })).toBeVisible();
    await page.screenshot({ path: shot('06-verifikasi-dua-langkah') });
    await page.getByLabel('Kode 6 digit').fill(totpCode(secret));
    await page.getByRole('button', { name: 'Verifikasi' }).click();
    await expect(page.getByRole('heading', { name: 'Trial ter-hosting' })).toBeVisible();

    // ---- Ditinggal 30 menit: keluar otomatis, data calon klien tidak tampil lagi ----
    await page.evaluate(() =>
      localStorage.setItem('panduarah-vendor.last-activity', String(Date.now() - 31 * 60_000)),
    );
    await page.reload();
    await expect(page.getByRole('alert')).toContainText('30 menit tidak aktif');
    await expect(page.getByText(institutions.queued)).toHaveCount(0);
  });

  test('akun yang bukan staf vendor dikeluarkan sebelum memasang 2FA', async ({ page }) => {
    await signIn(page, fixture.applicantEmail);
    await expect(page.getByRole('alert')).toHaveText('Akun ini bukan akun staf vendor.');
    await expect(page.getByRole('heading', { name: 'Masuk ke dasbor vendor' })).toBeVisible();
    await page.screenshot({ path: shot('07-bukan-staf') });
  });
});
