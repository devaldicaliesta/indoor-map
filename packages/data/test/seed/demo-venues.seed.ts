import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { SnapshotSource, VenueId } from '@indoor/domain';
import {
  campusVenue,
  hospitalVenue,
  mallVenue,
} from '@indoor/domain/fixtures/demo-venues/index.ts';
import { expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import { insertVenue, signedInDb } from '../support/full-venue';

// `pnpm db:seed-demo`: tiga venue demo besar (mal, rumah sakit, kampus) di Supabase lokal,
// dibuat ulang lalu diterbitkan. Dijalankan lewat Vitest agar fixture TypeScript domain bisa dipakai.
const envFile = fileURLToPath(new URL('../../../../.env.local', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const password = process.env.SEED_ADMIN_PASSWORD ?? '';

const centerOf = (source: SnapshotSource): [number, number] => {
  const ring = source.buildings[0]?.footprint?.coordinates[0] ?? [];
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
};

it.runIf(url && anonKey && password)('seed venue demo', { timeout: 300_000 }, async () => {
  const db = await signedInDb(url, anonKey, { email: 'admin@local.test', password });
  const data = createRepositories(db);
  for (const make of [mallVenue, hospitalVenue, campusVenue]) {
    const source = make();
    const name = source.venue.name;
    const { error } = await db.from('venues').delete().eq('name', name);
    if (error) throw new Error(error.message);
    const { venueId } = await insertVenue(db, name, source, centerOf(source));
    const findings = await data.publications.validate(venueId as VenueId);
    expect(findings.filter((f) => f.severity === 'error')).toEqual([]);
    const { version } = await data.publications.publish(venueId as VenueId);
    process.stdout.write(`${name}: ${venueId} (v${version})\n`);
  }
});
