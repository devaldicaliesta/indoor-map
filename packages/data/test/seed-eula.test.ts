import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EULA_VERSION } from '@indoor/domain';
import { describe, expect, it } from 'vitest';

const seed = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../supabase/seed.sql'),
  'utf8',
);

describe('seed lokal', () => {
  // Bila EULA_VERSION dinaikkan tanpa seed, setiap test yang memasang lisensi ditolak server.
  it('menyetujui EULA versi berlaku', () => {
    expect(seed).toMatch(
      new RegExp(`insert into public\\.eula_acceptances[^;]*'${EULA_VERSION}'`, 'i'),
    );
  });
});
