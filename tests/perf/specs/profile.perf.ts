import { writeFileSync } from 'node:fs';
import { devices, test } from '@playwright/test';
import { perfEnv } from '../env';
import { seeded, throttle } from '../support';

test.use({ ...devices['Pixel 7'] });

test('profil kunjungan ulang', async ({ page: first }) => {
  const v = seeded();
  await first.goto(`${perfEnv.visitorUrl}/v/${v.venueId}?lang=id`);
  await first.waitForTimeout(6000);
  const page = await first.context().newPage();
  const cdp = await throttle(page, '4g', 4);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  await page.goto(`${perfEnv.visitorUrl}/v/${v.venueId}?lang=id`, { waitUntil: 'commit' });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="venue-map"]')?.getAttribute('data-ready') === 'true',
    undefined,
    { polling: 'raf', timeout: 60_000 },
  );
  const marks = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((e) => /json|worker|closures/.test(e.name))
      .map(
        (e) =>
          `${Math.round(e.startTime)}-${Math.round((e as PerformanceResourceTiming).responseEnd)} ${e.name.slice(-40)}`,
      )
      .concat(`ready ${Math.round(performance.now())}`),
  );
  const { profile } = await cdp.send('Profiler.stop');
  writeFileSync('results/profile.cpuprofile', JSON.stringify(profile));
  writeFileSync('results/profile-marks.json', JSON.stringify(marks, null, 1));
});
