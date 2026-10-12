import { expect, test } from '../../../fixtures';
import {
  createHostedTrial,
  endHostedTrial,
  removeHostedTrial,
} from '../../../support/hosted-trial';

// T-615b: setelah trial terkunci, `latest.json` berisi penanda `trialEnded` dan Visitor
// menjelaskannya alih-alih "Peta belum tersedia" (FR-HT-09).
test.describe('T-615 Trial ter-hosting di Visitor', () => {
  test('TC-HT-09 peta trial yang terkunci menampilkan "Trial berakhir"', async ({
    page,
    publishedVenue,
  }) => {
    const venueId = publishedVenue.venue.id;
    const trial = createHostedTrial(venueId, 10);
    try {
      await endHostedTrial(venueId);
      await page.goto(`/v/${venueId}`);
      await expect(page.getByText('Masa trial peta ini sudah berakhir')).toBeVisible();
      await page.screenshot({ path: 'evidence/T-615/03-visitor-trial-berakhir.png' });
    } finally {
      removeHostedTrial(trial, venueId);
    }
  });
});
