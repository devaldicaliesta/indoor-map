import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { SnapshotSource, VenueId } from '@indoor/domain';
import {
  airportVenue,
  campusVenue,
  concertVenue,
  factoryVenue,
  hospitalVenue,
  mallVenue,
  officeVenue,
} from '@indoor/domain/fixtures/demo-venues/index.ts';
import { createClient } from '@supabase/supabase-js';
import { expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';
import { insertVenue, signedInDb } from '../support/full-venue';
import { demoClosures, seedDemoUsers, seedPublishHistory } from './demo-activity';

// `pnpm db:seed-demo`: tujuh venue demo besar (mal, rumah sakit, kampus, perkantoran, bandara,
// kawasan pabrik, konser di stadion) di Supabase lokal, dibuat ulang lalu diterbitkan, beserta aktivitas demo
// (riwayat publish, penutupan, pengguna beragam role). Dijalankan lewat Vitest agar fixture
// TypeScript domain bisa dipakai.
const envFile = fileURLToPath(new URL('../../../../.env.local', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const password = process.env.SEED_ADMIN_PASSWORD ?? '';

const centerOf = (source: SnapshotSource): [number, number] => {
  const ring = source.buildings[0]?.footprint?.coordinates[0] ?? [];
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
};

/** Venue demo: tipe, alamat fiktif, logo (`scripts/demo-logos.mjs`), dan warna merek. */
const VENUES = [
  {
    make: mallVenue,
    type: 'shopping_center',
    address: 'Jl. Sentosa Raya No. 1, Jakarta Pusat',
    logo: 'mall',
    color: '#7b61c9',
  },
  {
    make: hospitalVenue,
    type: 'hospital',
    address: 'Jl. Harapan Sehat No. 12, Jakarta Selatan',
    logo: 'hospital',
    color: '#c8321e',
  },
  {
    make: campusVenue,
    type: 'campus',
    address: 'Jl. Cendekia Raya No. 5, Depok',
    logo: 'campus',
    color: '#0f4a91',
  },
  {
    make: officeVenue,
    type: 'office',
    address: 'Jl. Sinergi Raya Kav. 21, Jakarta Selatan',
    logo: 'office',
    color: '#1f6f8b',
  },
  {
    make: airportVenue,
    type: 'airport_station',
    address: 'Jl. Bandara Nusantara, Tangerang',
    logo: 'airport',
    color: '#0b7a75',
  },
  {
    make: factoryVenue,
    type: 'factory_warehouse',
    address: 'Kawasan Industri Prima Blok C-7, Bekasi',
    logo: 'factory',
    color: '#b45f06',
  },
  {
    make: concertVenue,
    type: 'custom',
    address: 'Stadion Demo Gemilang, Jl. Pintu Satu, Jakarta Pusat',
    logo: 'concert',
    color: '#e11d48',
  },
] as const;

const logoFile = (key: string) =>
  new Blob([readFileSync(new URL(`./logos/${key}.png`, import.meta.url))], { type: 'image/png' });

it.runIf(url && anonKey && password)('seed venue demo', { timeout: 900_000 }, async () => {
  const db = await signedInDb(url, anonKey, { email: 'admin@local.test', password });
  const data = createRepositories(db);
  // Tanpa URL publik Visitor, QR titik asal dan preview mati; demo lokal memakai Visitor dev.
  if (!(await data.systemSettings.get()).publicVisitorUrl) {
    await data.systemSettings.update({
      publicVisitorUrl: process.env.E2E_VISITOR_URL ?? 'http://localhost:5174',
    });
  }
  for (const { make, type, address, logo, color } of VENUES) {
    const fixture = make();
    const name = fixture.venue.name;
    // Lewat repository agar berkas logo venue lama ikut terhapus.
    const old = await db.from('venues').select('id').eq('name', name);
    if (old.error) throw new Error(old.error.message);
    for (const venue of old.data) await data.venues.remove(venue.id as VenueId);
    const { venueId, source } = await insertVenue(db, name, fixture, centerOf(fixture));
    const id = venueId as VenueId;
    // Tipe venue biasanya dipilih dari template saat dibuat; di sini langsung diisi.
    const meta = await db.from('venues').update({ venue_type: type, address }).eq('id', id);
    if (meta.error) throw new Error(meta.error.message);
    await data.venues.uploadLogo(id, logoFile(logo));
    await data.displaySettings.update(id, {
      branding: { displayName: null, primaryColor: color, routeColor: color },
    });
    const findings = await data.publications.validate(id);
    expect(findings.filter((f) => f.severity === 'error')).toEqual([]);
    await data.publications.publish(id, 'Peta pertama diterbitkan');
    await seedPublishHistory(data, id);
    for (const closure of demoClosures(source)) await data.closures.create(id, closure);
    const active = await data.publications.active(id);
    process.stdout.write(`${name}: ${venueId} (v${active?.version})\n`);
  }
  if (serviceKey) {
    const service = createClient<Database>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await seedDemoUsers({ service, url, anonKey, password, superAdmin: data });
    process.stdout.write('Pengguna demo: 8 akun @panduarah.example\n');
  }
});
