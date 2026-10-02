import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

/**
 * Pemeriksaan repo untuk task tanpa UI (tooling, paket, skema): membaca konfigurasi, menjalankan
 * Biome/tsc pada berkas sementara, dan merangkum hasil sebagai gambar bukti.
 */
export const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
export const readRepo = (file: string) => readFileSync(join(repoRoot, file), 'utf8');
export const readJson = (file: string) => JSON.parse(readRepo(file));

export interface CheckResult {
  id: string;
  check: string;
  ok: boolean;
}

/**
 * Menulis berkas sementara di `dir` (relatif repo) lalu menjalankan `pnpm <command> <berkas>`;
 * folder dihapus lagi. Hasilnya apakah perintah gagal beserta keluarannya.
 */
export function runOnTempFile(dir: string, file: string, content: string, command: string[]) {
  const folder = mkdtempSync(join(repoRoot, dir, '.verify-'));
  const path = join(folder, file);
  writeFileSync(path, content);
  try {
    execFileSync('pnpm', [...command, path], { cwd: repoRoot, stdio: 'pipe' });
    return { failed: false, output: '' };
  } catch (error) {
    const e = error as { stdout?: Buffer; stderr?: Buffer };
    return { failed: true, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Tabel hasil + potongan log sebagai halaman, untuk di-screenshot ke folder bukti. */
export async function renderSummary(
  page: Page,
  title: string,
  results: readonly CheckResult[],
  logs: readonly { name: string; text: string }[] = [],
) {
  const rows = results
    .map(
      (r) =>
        `<tr><td>${r.id}</td><td>${escapeHtml(r.check)}</td><td class="${r.ok ? 'ok' : 'no'}">${r.ok ? 'Lulus' : 'Gagal'}</td></tr>`,
    )
    .join('');
  const blocks = logs
    .map((l) => `<h3>${escapeHtml(l.name)}</h3><pre>${escapeHtml(l.text)}</pre>`)
    .join('');
  await page.setContent(`<!doctype html><html lang="id"><meta charset="utf-8"><style>
    body{font:14px system-ui;margin:24px;color:#111418}table{border-collapse:collapse;width:100%}
    td,th{border:1px solid #d5d9de;padding:6px 8px;text-align:left}.ok{color:#12805c;font-weight:700}
    .no{color:#c8321e;font-weight:700}pre{background:#f2f3ef;padding:8px;white-space:pre-wrap}</style>
    <h1>${escapeHtml(title)}</h1><table><tr><th>ID</th><th>Pemeriksaan</th><th>Hasil</th></tr>${rows}</table>${blocks}</html>`);
}
