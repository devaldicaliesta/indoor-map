import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { LoginPage } from '../../../pages/login-page';
import {
  createHostedTrial,
  endHostedTrial,
  removeHostedTrial,
} from '../../../support/hosted-trial';

// T-615b: pemohon trial ter-hosting melihat sisa hari di seluruh Admin (FR-HT-08), lalu layar
// "Trial berakhir" setelah siklus hidup sungguhan mengunci trial-nya (FR-HT-09).
test.describe('T-615 Trial ter-hosting di Admin', () => {
  test('TC-HT-08/09 banner sisa hari, lalu "Trial berakhir" setelah terkunci', async ({
    page,
    publishedVenue,
  }) => {
    const venueId = publishedVenue.venue.id;
    const trial = createHostedTrial(venueId, 10);
    try {
      const login = new LoginPage(page);
      await login.goto();
      await login.signIn(trial.email, env.password);
      await expect(page.getByText('Trial — sisa 10 hari')).toBeVisible();
      await page.screenshot({ path: 'evidence/T-615/01-banner-sisa-hari.png' });

      await endHostedTrial(venueId);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Trial berakhir' })).toBeVisible();
      await expect(page.getByText('Trial — sisa')).toHaveCount(0);
      await page.screenshot({ path: 'evidence/T-615/02-admin-trial-berakhir.png' });
    } finally {
      removeHostedTrial(trial, venueId);
    }
  });
});
