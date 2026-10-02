import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// T-001 tidak punya UI: bukti berupa pemeriksaan konfigurasi dan penolakan lint/typecheck.
// Perintah berat (pnpm check, build, install beku) dijalankan terpisah; log di evidence/T-001/.
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const read = (file: string) => readFileSync(join(root, file), 'utf8');
const json = (file: string) => JSON.parse(read(file));
const shot = (name: string) => `evidence/T-001/${name}.png`;
const results: { id: string; check: string; ok: boolean }[] = [];

function record(id: string, check: string, ok: boolean) {
  results.push({ id, check, ok });
  expect(ok, `${id} ${check}`).toBe(true);
}

/** Menjalankan Biome/tsc pada berkas sementara di dalam repo; hasilnya keluaran dan kode keluar. */
function runOn(file: string, content: string, command: string[]) {
  const dir = mkdtempSync(join(root, 'packages/domain/src/.t001-'));
  const path = join(dir, file);
  writeFileSync(path, content);
  try {
    execFileSync('pnpm', [...command, path], { cwd: root, stdio: 'pipe' });
    return { failed: false, output: '' };
  } catch (error) {
    const e = error as { stdout?: Buffer; stderr?: Buffer };
    return { failed: true, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test.describe('T-001 Monorepo dan tooling', () => {
  test.describe.configure({ mode: 'serial' });

  test('konfigurasi workspace, TypeScript, Biome, Turborepo, dan CI', () => {
    const workspace = read('pnpm-workspace.yaml');
    record(
      'T001-01',
      'pnpm workspace: apps/* dan packages/*',
      /apps\/\*/.test(workspace) && /packages\/\*/.test(workspace),
    );

    const ts = json('tsconfig.base.json').compilerOptions;
    record(
      'T001-02',
      'tsconfig: strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, bundler, verbatimModuleSyntax',
      ts.strict &&
        ts.noUncheckedIndexedAccess &&
        ts.exactOptionalPropertyTypes &&
        ts.moduleResolution === 'bundler' &&
        ts.verbatimModuleSyntax,
    );

    const biome = json('biome.json');
    record(
      'T001-03',
      'Biome: 2 spasi, lebar 100, kutip tunggal',
      biome.formatter.indentWidth === 2 &&
        biome.formatter.lineWidth === 100 &&
        biome.javascript.formatter.quoteStyle === 'single',
    );
    record(
      'T001-04',
      'Biome: noExplicitAny dan noConsole = error',
      biome.linter.rules.suspicious.noExplicitAny === 'error' &&
        biome.linter.rules.suspicious.noConsole === 'error',
    );

    const turbo = json('turbo.json').tasks;
    record(
      'T001-05',
      'turbo: build, dev (persistent), typecheck, lint, test',
      Boolean(turbo.build && turbo.dev?.persistent && turbo.typecheck && turbo.lint && turbo.test),
    );

    const scripts = json('package.json').scripts;
    record(
      'T001-06',
      'skrip root dev, build, check, test, format, db:types; check = typecheck lint test',
      ['dev', 'build', 'check', 'test', 'format', 'db:types'].every((s) => scripts[s]) &&
        scripts.check === 'turbo run typecheck lint test',
    );

    record('T001-07', '.nvmrc = 22', read('.nvmrc').trim() === '22');
    const ignore = read('.gitignore');
    record(
      'T001-08',
      '.gitignore: node_modules, dist, .turbo, .env*, supabase/.temp; .env.example tetap',
      ['node_modules', 'dist', '.turbo', '.env*', '!.env.example', 'supabase/.temp'].every((e) =>
        ignore.includes(e),
      ),
    );
    record('T001-09', '.editorconfig ada', read('.editorconfig').length > 0);

    const ci = read('.github/workflows/ci.yml');
    record(
      'T001-10',
      'CI: Node dari .nvmrc, install beku, pnpm check, pnpm build',
      [
        'node-version-file: .nvmrc',
        'pnpm install --frozen-lockfile',
        'pnpm check',
        'pnpm build',
      ].every((s) => ci.includes(s)),
    );
    record('T001-11', 'template PR ada', read('.github/pull_request_template.md').includes('## '));

    const lock = read('pnpm-lock.yaml');
    record(
      'T001-12',
      'tanpa ESLint/Prettier',
      !/\n {2}(eslint|prettier)@/.test(lock) &&
        !/'?(eslint|prettier)'?:/.test(JSON.stringify(json('package.json'))),
    );
  });

  test('pemeriksaan menolak kode yang melanggar aturan', () => {
    const anyCode = runOn('pakai-any.ts', 'export const x: any = 1;\n', ['exec', 'biome', 'lint']);
    record(
      'T001-13',
      'Biome menolak `any`',
      anyCode.failed && anyCode.output.includes('noExplicitAny'),
    );

    const log = runOn('pakai-console.ts', "console.txt('x');\n", ['exec', 'biome', 'lint']);
    record('T001-14', 'Biome menolak console.txt', log.failed && log.output.includes('noConsole'));

    const format = runOn('format.ts', 'export const   a = "x"\n', ['exec', 'biome', 'format']);
    record('T001-15', 'Biome menolak format salah (kutip ganda, spasi)', format.failed);

    const strict = runOn(
      'strict.ts',
      'const list: number[] = [];\nexport const first: number = list[0];\n',
      ['exec', 'tsc', '--noEmit', '--strict', '--noUncheckedIndexedAccess', '--skipLibCheck'],
    );
    record(
      'T001-16',
      'TypeScript strict menolak akses indeks tanpa cek',
      strict.failed && strict.output.includes('TS2322'),
    );
  });

  test('ringkasan bukti', async ({ page }) => {
    const logs = ['01-install-frozen', '02-check', '03-build', '04-format-check'].map((name) => {
      const text = read(`e2e/evidence/T-001/${name}.txt`);
      const tail = text.trim().split('\n').slice(-6).join('\n');
      return { name, tail };
    });
    const rows = results
      .map(
        (r) =>
          `<tr><td>${r.id}</td><td>${r.check}</td><td class="${r.ok ? 'ok' : 'no'}">${r.ok ? 'Lulus' : 'Gagal'}</td></tr>`,
      )
      .join('');
    const blocks = logs
      .map(
        (l) =>
          `<h3>${l.name}.txt</h3><pre>${l.tail
            .replaceAll(`${String.fromCharCode(27)}[`, '[')
            .replace(/\[[0-9;]*m/g, '')
            .replace(/</g, '&lt;')}</pre>`,
      )
      .join('');
    await page.setContent(`<!doctype html><html lang="id"><meta charset="utf-8"><style>
      body{font:14px system-ui;margin:24px;color:#111418}table{border-collapse:collapse;width:100%}
      td,th{border:1px solid #d5d9de;padding:6px 8px;text-align:left}.ok{color:#12805c;font-weight:700}
      .no{color:#c8321e;font-weight:700}pre{background:#f2f3ef;padding:8px;white-space:pre-wrap}</style>
      <h1>T-001 · Monorepo dan tooling</h1><table><tr><th>ID</th><th>Pemeriksaan</th><th>Hasil</th></tr>${rows}</table>${blocks}</html>`);
    await expect(page.getByText('Gagal', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: shot('01-ringkasan'), fullPage: true });
  });
});
