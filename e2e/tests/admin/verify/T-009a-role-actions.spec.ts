import { createDataClient, type DataClient, DataError } from '@indoor/data';
import { ADMIN_ACTIONS, type AdminAction, type AppRole, can } from '@indoor/domain';
import type { Locator, Page } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { type RoleTargets, SERVER_ATTEMPTS, snapshot } from '../../../support/role-attempts';

const ROLES: AppRole[] = ['super_admin', 'admin', 'editor', 'operator', 'viewer'];

async function signedIn(role: AppRole): Promise<DataClient> {
  const data = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
  await data.auth.signIn(ACCOUNTS[role].email, env.password);
  return data;
}

/** Tombol/elemen per aksi: ada untuk role yang boleh, tidak ada untuk yang tidak. */
const UI_CHECKS: { action: AdminAction; path: string; control: (page: Page) => Locator }[] = [
  {
    action: 'venue.edit',
    path: '/venues',
    control: (p) => p.getByRole('button', { name: 'Tambah gedung' }),
  },
  {
    action: 'location.edit',
    path: '/locations',
    control: (p) => p.getByRole('button', { name: 'Tambah lokasi' }),
  },
  {
    action: 'closure.manage',
    path: '/closures',
    control: (p) => p.getByRole('button', { name: 'Akhiri sekarang' }),
  },
  {
    action: 'origin_point.edit',
    path: '/origin-points',
    control: (p) => p.getByRole('button', { name: 'Tambah titik asal' }),
  },
  {
    action: 'publish.publish',
    path: '/publish',
    control: (p) => p.getByRole('button', { name: /Terbitkan/ }),
  },
  {
    action: 'settings.edit',
    path: '/settings',
    control: (p) => p.getByRole('button', { name: 'Tambah jenis' }),
  },
  {
    action: 'settings.system',
    path: '/settings',
    control: (p) => p.getByRole('tab', { name: 'Sistem' }),
  },
];

const NO_ACCESS = /tidak (memiliki|punya) (izin|akses)|Tidak berizin/i;

/**
 * Halaman dianggap siap bila judulnya atau pesan tidak berizin tampil dan kerangka memuat
 * hilang; tanpa ini cek "tombol tidak ada" bisa lulus sebelum halaman dimuat.
 */
async function openReady(page: Page, path: string): Promise<'ok' | 'blocked'> {
  await page.goto(path);
  const blocked = page.getByText(NO_ACCESS).first();
  const title = page.getByRole('main').getByRole('heading', { level: 1 });
  await expect(title.or(blocked).first()).toBeVisible();
  if (await blocked.isVisible()) return 'blocked';
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  return 'ok';
}

test.describe('T-009a Peta aksi per role', () => {
  for (const role of ROLES) {
    test(`TC-SEC-02..09 ${role}: tombol sesuai can() dan server menolak aksi terlarang`, async ({
      page,
      loginAs,
      superAdmin,
      publishedVenue,
    }) => {
      const { venue } = publishedVenue;
      const [building] = await superAdmin.buildings.list(venue.id);
      const [location] = await superAdmin.locations.list(venue.id);
      if (!building || !location) throw new Error('fixture publishedVenue kurang');
      // Tombol aksi penutupan hanya ada bila daftar terisi; penutupan ini juga sasaran ubah/hapus.
      const closure = await superAdmin.closures.create(venue.id, {
        target: { kind: 'feature', id: publishedVenue.vacantUnitId },
        reason: 'Renovasi plafon',
        startsAt: new Date().toISOString(),
        endsAt: null,
      });
      const targets: RoleTargets = {
        ...publishedVenue,
        buildingId: building.id,
        closureId: closure.id,
        locationId: location.id,
      };

      await loginAs(role);
      await new AdminShell(page).selectVenue(venue.name);
      for (const check of UI_CHECKS) {
        // Menu yang tidak terlihat untuk role ini sudah dicek di T-007.
        if ((await openReady(page, check.path)) === 'blocked') continue;
        await expect(check.control(page), `${role} ${check.action}`).toHaveCount(
          can(role, check.action) ? 1 : 0,
        );
      }
      await openReady(page, role === 'operator' ? '/closures' : '/settings');
      await page.screenshot({ path: `evidence/T-009a/07-role-${role}.png`, fullPage: true });

      const before = await snapshot(superAdmin, targets);
      const data = await signedIn(role);
      try {
        for (const action of ADMIN_ACTIONS) {
          if (can(role, action)) continue;
          for (const attempt of SERVER_ATTEMPTS[action] ?? []) {
            const outcome = await attempt.run(data, targets).then(
              () => null,
              (error: unknown) => error,
            );
            const what = `${role} ${action} ${attempt.label}`;
            if (attempt.op === 'create') {
              expect(outcome, `${what}: server harus menolak`).toBeInstanceOf(DataError);
              expect((outcome as DataError).kind, `${what}: ${String(outcome)}`).toBe('forbidden');
            } else if (outcome !== null) {
              expect(outcome, what).toBeInstanceOf(DataError);
            }
          }
        }
        // Data khusus Super Admin tidak terbaca role lain.
        if (role !== 'super_admin') {
          expect(await data.audit.listRecent()).toEqual([]);
          await expect(data.systemSettings.get()).rejects.toBeInstanceOf(DataError);
        }
      } finally {
        await data.auth.signOut();
      }
      // Tidak ada yang berubah di database (dibaca ulang sebagai Super Admin).
      expect(await snapshot(superAdmin, targets)).toEqual(before);
    });
  }
});
