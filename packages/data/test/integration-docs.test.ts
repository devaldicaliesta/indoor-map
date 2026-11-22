import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLocationUpsert } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { OPENAPI } from '../../../supabase/functions/api/openapi.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('dokumentasi dan contoh API integrasi (T-593)', () => {
  it('docs/integrasi/openapi.json sama dengan yang disajikan Edge Function', () => {
    const file = JSON.parse(readFileSync(join(root, 'docs/integrasi/openapi.json'), 'utf8'));
    expect(file).toEqual(JSON.parse(JSON.stringify(OPENAPI)));
  });

  it('contoh sinkronisasi CSV menghasilkan isian yang diterima API', () => {
    const example = join(root, 'examples/sinkronisasi-jam');
    const output = execFileSync(
      process.execPath,
      [join(example, 'sync.mjs'), join(example, 'jadwal.csv'), '--dry-run'],
      { encoding: 'utf8' },
    );
    const parsed = parseLocationUpsert(JSON.parse(output));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.map((l) => l.code)).toEqual(['POLI-ANAK', 'RAD-01']);
    expect(parsed.value[0]?.special_hours).toEqual([
      {
        weekday: null,
        special_date: '2026-12-24',
        opens_at: null,
        closes_at: null,
        is_closed: true,
      },
    ]);
  });
});
