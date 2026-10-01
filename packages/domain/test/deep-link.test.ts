import { describe, expect, it } from 'vitest';
import {
  BuildingIdSchema,
  type DeepLink,
  decodeDeepLink,
  deepLinkUrl,
  encodeDeepLink,
  FloorIdSchema,
  LocationIdSchema,
  type RouteEnd,
  VenueIdSchema,
} from '../src';

const venueId = VenueIdSchema.parse('675a7e25-4413-5cd3-93db-4d1ede832633');
const buildingId = BuildingIdSchema.parse('b331a645-5b92-5ebc-a199-b6d5bebff21c');
const floorId = FloorIdSchema.parse('599dad1f-3e11-54f4-bf79-a222b96e5e6f');
const otherFloor = FloorIdSchema.parse('61e61416-da88-5c57-ada4-e74e76d6cb74');
const radiology = LocationIdSchema.parse('0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a05');
const lab = LocationIdSchema.parse('0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a06');

const point: RouteEnd = { kind: 'point', lng: 106.8272345, lat: -6.1754321, floorId };
const toLab: RouteEnd = { kind: 'location', locationId: lab };

/** Setiap kombinasi bagian opsional, dari tautan venue saja sampai semuanya terisi. */
const parts: Partial<DeepLink>[] = [
  { buildingId },
  { floorId: otherFloor },
  { locationId: radiology },
  { originCode: '3fa9c1d2e4b5' },
  { infoPointCode: 'IP-LOBI_2' },
  { from: point },
  { from: { kind: 'location', locationId: radiology } },
  { to: toLab },
  { to: { kind: 'point', lng: -179.5, lat: 89.25, floorId: otherFloor } },
  { accessible: true },
  { accessible: false },
  { language: 'en' },
  { language: 'id' },
];

function combinations<T>(items: readonly T[]): T[][] {
  const all: T[][] = [[]];
  for (const item of items) {
    for (const combination of all.slice()) all.push([...combination, item]);
  }
  return all;
}

describe('deep link', () => {
  // 8.192 kombinasi: di runner CI yang menjalankan semua paket bersamaan bisa mendekati batas
  // bawaan Vitest (5 detik).
  it('decode(encode(x)) = x untuk semua kombinasi parameter', { timeout: 30_000 }, () => {
    const all = combinations(parts);
    expect(all.length).toBe(2 ** parts.length);
    for (const combination of all) {
      const link: DeepLink = Object.assign({ venueId }, ...combination);
      expect(decodeDeepLink(encodeDeepLink(link))).toEqual(link);
    }
  });

  it('format URL terdokumentasi dan stabil', () => {
    expect(encodeDeepLink({ venueId })).toBe(`/v/${venueId}`);
    expect(
      encodeDeepLink({
        venueId,
        language: 'en',
        to: toLab,
        accessible: true,
        originCode: '3fa9c1d2e4b5',
      }),
    ).toBe(`/v/${venueId}?o=3fa9c1d2e4b5&to=${lab}&a11y=1&lang=en`);
    expect(encodeDeepLink({ venueId, from: point })).toBe(
      `/v/${venueId}?from=106.8272345%2C-6.1754321%2C${floorId}`,
    );
    expect(deepLinkUrl('https://peta.contoh.test/', { venueId, locationId: radiology })).toBe(
      `https://peta.contoh.test/v/${venueId}?loc=${radiology}`,
    );
  });

  it('koordinat dibulatkan 7 desimal', () => {
    const link = decodeDeepLink(
      encodeDeepLink({ venueId, to: { ...point, lng: 106.82723456789 } }),
    );
    expect(link?.to).toEqual({ ...point, lng: 106.8272346 });
  });

  it('venue dari path atau parameter v; tanpa venue yang sah hasilnya null', () => {
    expect(decodeDeepLink(`/?v=${venueId}&lang=en`)).toEqual({ venueId, language: 'en' });
    expect(decodeDeepLink(`https://peta.contoh.test/v/${venueId}#peta`)).toEqual({ venueId });
    expect(decodeDeepLink('/v/bukan-uuid?lang=en')).toBeNull();
    expect(decodeDeepLink('/?lang=en')).toBeNull();
    expect(decodeDeepLink('')).toBeNull();
  });

  it('parameter rusak diabaikan satu per satu tanpa error', () => {
    const broken = [
      'b=123',
      'f=%E0%A4%A',
      'loc=radiologi',
      'o=XYZ',
      'o=3fa9c1d2e4b',
      'ip=IP%20LOBI',
      `from=106.8,-6.1`,
      `from=,,${floorId}`,
      `from=1e2,-6.1,${floorId}`,
      `to=200,-6.1,${floorId}`,
      `to=106.8,-91,${floorId}`,
      `to=106.8,-6.1,${floorId},extra`,
      'a11y=true',
      'lang=fr',
      'lainnya=1',
      '=tanpa-nama',
      'tanpa-nilai',
    ].join('&');
    expect(decodeDeepLink(`/v/${venueId}?${broken}`)).toEqual({ venueId });
    expect(decodeDeepLink(`/v/${venueId}?b=123&loc=radiologi&lang=en&a11y=1`)).toEqual({
      venueId,
      language: 'en',
      accessible: true,
    });
  });

  it('nilai pertama yang dipakai bila parameter berulang', () => {
    expect(decodeDeepLink(`/v/${venueId}?lang=id&lang=en&a11y=0&a11y=1`)).toEqual({
      venueId,
      language: 'id',
      accessible: false,
    });
  });
});
