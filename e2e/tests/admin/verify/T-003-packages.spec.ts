import { expect, test } from '@playwright/test';
import {
  type CheckResult,
  readJson,
  readRepo,
  renderSummary,
  runOnTempFile,
} from '../../../support/repo-checks';

// T-003 tanpa UI: struktur lima paket bersama, arah dependensi, dan batas impor.
const PACKAGES = ['domain', 'routing', 'map-core', 'data', 'ui'] as const;
// Diagram 03-arsitektur.md: domain tidak bergantung paket internal; lainnya hanya ke domain.
const ALLOWED_INTERNAL: Record<(typeof PACKAGES)[number], string[]> = {
  domain: [],
  routing: ['@indoor/domain'],
  'map-core': ['@indoor/domain'],
  data: ['@indoor/domain'],
  ui: ['@indoor/domain'],
};
const results: CheckResult[] = [];

function record(id: string, check: string, ok: boolean) {
  results.push({ id, check, ok });
  expect(ok, `${id} ${check}`).toBe(true);
}

const lintRejects = (dir: string, code: string, message: string) => {
  const run = runOnTempFile(dir, 'impor.ts', code, ['exec', 'biome', 'lint']);
  return run.failed && run.output.includes(message);
};

test.describe('T-003 Kerangka paket bersama', () => {
  test.describe.configure({ mode: 'serial' });

  test('struktur dan dependensi lima paket', () => {
    for (const name of PACKAGES) {
      const pkg = readJson(`packages/${name}/package.json`);
      record(
        `T003-${name}-1`,
        `@indoor/${name}: type module, exports "." ke src/index.ts`,
        pkg.name === `@indoor/${name}` &&
          pkg.type === 'module' &&
          pkg.exports['.'] === './src/index.ts',
      );
      record(
        `T003-${name}-2`,
        `@indoor/${name}: tsconfig extends base, README berisi tanggung jawab`,
        readRepo(`packages/${name}/tsconfig.json`).includes('tsconfig.base.json') &&
          readRepo(`packages/${name}/README.md`).length > 100,
      );
      const internal = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }).filter((d) =>
        d.startsWith('@indoor/'),
      );
      record(
        `T003-${name}-3`,
        `@indoor/${name} hanya bergantung pada ${ALLOWED_INTERNAL[name].join(', ') || 'tidak ada paket internal'}`,
        internal.every((d) => ALLOWED_INTERNAL[name].includes(d)),
      );
    }
    const domain = readJson('packages/domain/package.json');
    record('T003-10', 'domain memakai zod', Boolean(domain.dependencies.zod));
    record(
      'T003-11',
      'ids.ts (ID bermerek) dan units.ts (EPSG:4326, meter)',
      readRepo('packages/domain/src/ids.ts').includes("brand<'VenueId'>") &&
        readRepo('packages/domain/src/units.ts').includes('EPSG:4326'),
    );
    record(
      'T003-12',
      'kedua app memakai @indoor/domain langsung dari sumber (test workspace-packages)',
      ['admin', 'visitor'].every((app) =>
        readRepo(`apps/${app}/src/workspace-packages.test.ts`).includes("from '@indoor/domain'"),
      ),
    );
  });

  test('batas impor ditolak lint', () => {
    record(
      'T003-20',
      'domain mengimpor react → ditolak',
      lintRejects('packages/domain/src', "import 'react';\n", 'packages/domain harus murni'),
    );
    record(
      'T003-21',
      'domain mengimpor maplibre-gl → ditolak',
      lintRejects('packages/domain/src', "import 'maplibre-gl';\n", 'packages/domain harus murni'),
    );
    record(
      'T003-22',
      'domain mengimpor @supabase/supabase-js → ditolak',
      lintRejects('packages/domain/src', "import '@supabase/supabase-js';\n", 'packages/domain'),
    );
    record(
      'T003-23',
      'domain mengimpor paket @indoor lain → ditolak',
      lintRejects('packages/domain/src', "import '@indoor/data';\n", 'packages/d'),
    );
    record(
      'T003-24',
      'routing mengimpor react → ditolak',
      lintRejects('packages/routing/src', "import 'react';\n", 'packages/routing harus murni'),
    );
    record(
      'T003-25',
      'routing mengimpor @indoor/data → ditolak',
      lintRejects('packages/routing/src', "import '@indoor/data';\n", 'packages/routing'),
    );
    record(
      'T003-26',
      'map-core mengimpor @indoor/data → ditolak',
      lintRejects('packages/map-core/src', "import '@indoor/data';\n", 'tidak mengakses data'),
    );
    record(
      'T003-27',
      'app Admin mengimpor Supabase langsung → ditolak',
      lintRejects('apps/admin/src', "import '@supabase/supabase-js';\n", 'Hanya packages/data'),
    );
    record(
      'T003-28',
      'app Visitor mengimpor Supabase langsung → ditolak',
      lintRejects('apps/visitor/src', "import '@supabase/supabase-js';\n", 'Hanya packages/data'),
    );
    const allowed = runOnTempFile(
      'packages/data/src',
      'impor.ts',
      "import '@supabase/supabase-js';\n",
      ['exec', 'biome', 'lint'],
    );
    record('T003-29', 'packages/data boleh mengimpor Supabase', !allowed.failed);
  });

  test('ringkasan bukti', async ({ page }) => {
    await renderSummary(page, 'T-003 · Kerangka paket bersama', results);
    await expect(page.getByText('Gagal', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: 'evidence/T-003/01-ringkasan.png', fullPage: true });
  });
});
