import type { DataClient } from '@indoor/data';
import { VENUE_TEMPLATES, type Venue, type VenueType } from '@indoor/domain';

interface VenueSpec {
  name: string;
  type: VenueType;
  timezone: string;
  center: [number, number];
  branding?: { displayName: string | null; primaryColor: string | null; routeColor: string | null };
  /** Gedung dengan lantai (level); level negatif = basement. */
  buildings?: { name: string; code: string; levels: number[] }[];
}

/**
 * Venue bervariasi untuk bukti E2E (`15-verifikasi-e2e.md` aturan 6): tipe template, zona waktu,
 * nama pendek/panjang/beraksen/emoji, branding terang/gelap/bawaan, satu dan banyak gedung,
 * basement. Nama diawali penanda unik agar test paralel tidak bentrok.
 */
function specs(tag: string): VenueSpec[] {
  return [
    {
      name: `${tag} Kampus Utara Jaya`,
      type: 'campus',
      timezone: 'Asia/Jakarta',
      center: [106.8272, -6.1754],
      branding: { displayName: 'Kampus Utara', primaryColor: '#0b1f4d', routeColor: '#e4002b' },
      buildings: [
        { name: 'Gedung Rektorat', code: 'RKT', levels: [-1, 0, 1, 2] },
        { name: 'Perpustakaan', code: 'PST', levels: [0, 1] },
        { name: 'Laboratorium Terpadu', code: 'LAB', levels: [0, 1, 2, 3] },
      ],
    },
    {
      name: `${tag} Menara Perkantoran Sudirman & Partner — Blok A (Lantai Eksekutif)`,
      type: 'office',
      timezone: 'Asia/Jakarta',
      center: [106.822, -6.208],
      buildings: [{ name: 'Menara A', code: 'MA', levels: [-2, -1, 0, 1, 2, 3, 4, 5] }],
    },
    {
      name: `${tag} Bandara Sultan Hasanuddin ✈`,
      type: 'airport_station',
      timezone: 'Asia/Makassar',
      center: [119.5481, -5.0617],
      branding: { displayName: null, primaryColor: '#fff6b3', routeColor: '#0b6e4f' },
      buildings: [
        { name: 'Terminal Keberangkatan', code: 'T1', levels: [0, 1] },
        { name: 'Terminal Kedatangan', code: 'T2', levels: [0] },
      ],
    },
    {
      name: `${tag} Pabrik Jayapura`,
      type: 'factory_warehouse',
      timezone: 'Asia/Jayapura',
      center: [140.7181, -2.5337],
    },
    {
      name: `${tag} Pusat Belanja Café Lumière`,
      type: 'shopping_center',
      timezone: 'Asia/Jakarta',
      center: [106.781, -6.227],
      branding: { displayName: 'Lumière', primaryColor: null, routeColor: null },
      buildings: [{ name: 'Mal Utama', code: 'MU', levels: [-1, 0, 1, 2] }],
    },
    {
      name: `${tag} RS`,
      type: 'hospital',
      timezone: 'Asia/Jakarta',
      center: [106.84, -6.19],
    },
  ];
}

export async function createVariedVenues(data: DataClient, tag: string): Promise<Venue[]> {
  const created: Venue[] = [];
  for (const spec of specs(tag)) {
    const venue = await data.venues.create({
      name: spec.name,
      address: null,
      center: { type: 'Point', coordinates: spec.center },
      timezone: spec.timezone,
    });
    created.push(venue);
    await data.venues.applyTemplate(venue.id, VENUE_TEMPLATES[spec.type]);
    if (spec.branding) await data.displaySettings.update(venue.id, { branding: spec.branding });
    for (const b of spec.buildings ?? []) {
      const building = await data.buildings.create(venue.id, {
        name: b.name,
        code: b.code,
        footprint: null,
      });
      for (const level of b.levels) {
        const name = level < 0 ? `B${-level}` : level === 0 ? 'GF' : `L${level}`;
        await data.floors.create(building.id, { name, level, heightM: 4 });
      }
    }
  }
  return created;
}
