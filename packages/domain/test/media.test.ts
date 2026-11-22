import { describe, expect, it } from 'vitest';
import {
  canDeleteMedia,
  filterMedia,
  inUseMessage,
  libraryFileName,
  type MediaAsset,
  type MediaUsage,
  mediaKindOf,
  reusableForLocation,
} from '../src';

const V = '10000000-0000-4000-8000-000000000001';

const asset = (over: Partial<MediaAsset>): MediaAsset => ({
  bucket: 'public-assets',
  path: `locations/${V}/media-1.png`,
  kind: 'photo',
  fileName: 'media-1.png',
  sizeBytes: 1000,
  mimeType: 'image/png',
  createdAt: '2026-11-22T00:00:00Z',
  usages: [],
  ...over,
});

const usage = (name: string, role: MediaUsage['role'] = 'photo'): MediaUsage => ({
  kind: 'location',
  id: '00000000-0000-4000-8000-000000000001',
  name,
  role,
});

describe('mediaKindOf', () => {
  it('jenis dari folder dan nama berkas', () => {
    expect(mediaKindOf('public-assets', `venues/${V}/logo-1.png`)).toBe('logo');
    expect(mediaKindOf('public-assets', `locations/${V}/abc-logo-1732000000000.png`)).toBe('logo');
    expect(mediaKindOf('public-assets', `locations/${V}/abc-photo-1732000000000-0.jpg`)).toBe(
      'photo',
    );
    expect(mediaKindOf('public-assets', `categories/${V}/x-1.png`)).toBe('icon');
    expect(mediaKindOf('public-assets', `facility-types/${V}/x-1.png`)).toBe('icon');
    expect(mediaKindOf('public-assets', `events/${V}/x.webp`)).toBe('photo');
    expect(mediaKindOf('floor-plans', `${V}/f/1-source.pdf`)).toBe('floor_plan');
  });
});

describe('canDeleteMedia', () => {
  it('denah, logo venue, dan ikon jenis fasilitas hanya Admin; Operator dan Viewer tidak pernah', () => {
    const plan = { bucket: 'floor-plans', path: `${V}/f/1-source.png` } as const;
    const venueLogo = { bucket: 'public-assets', path: `venues/${V}/logo.png` } as const;
    const facility = { bucket: 'public-assets', path: `facility-types/${V}/i.png` } as const;
    const photo = { bucket: 'public-assets', path: `locations/${V}/p.png` } as const;
    for (const target of [plan, venueLogo, facility]) {
      expect(canDeleteMedia('admin', target)).toBe(true);
      expect(canDeleteMedia('editor', target)).toBe(false);
    }
    expect(canDeleteMedia('editor', photo)).toBe(true);
    for (const role of ['operator', 'viewer'] as const) {
      expect(canDeleteMedia(role, photo)).toBe(false);
      expect(canDeleteMedia(role, plan)).toBe(false);
    }
  });
});

describe('filterMedia', () => {
  const assets = [
    asset({ fileName: 'apotek.png', usages: [usage('Apotek Sehat', 'logo')], kind: 'logo' }),
    asset({ fileName: 'denah-lt1.png', kind: 'floor_plan', bucket: 'floor-plans' }),
    asset({ fileName: 'foto-lobi.jpg', usages: [usage('Lobi Utama')] }),
  ];

  it('cari nama berkas dan nama pemakai tanpa membedakan huruf dan diakritik', () => {
    const names = (q: string) =>
      filterMedia(assets, { q, kinds: [], usage: 'all' }).map((a) => a.fileName);
    expect(names('sehat')).toEqual(['apotek.png']);
    expect(names('LOBI')).toEqual(['foto-lobi.jpg']);
    expect(names('dénah')).toEqual(['denah-lt1.png']);
  });

  it('filter jenis dan terpakai/tidak', () => {
    expect(filterMedia(assets, { q: '', kinds: ['floor_plan'], usage: 'all' })).toHaveLength(1);
    expect(
      filterMedia(assets, { q: '', kinds: [], usage: 'unused' }).map((a) => a.fileName),
    ).toEqual(['denah-lt1.png']);
    expect(filterMedia(assets, { q: '', kinds: ['logo', 'photo'], usage: 'used' })).toHaveLength(2);
  });
});

describe('pakai ulang dan pesan terpakai', () => {
  it('hanya gambar di folder lokasi yang bisa jadi logo/foto lokasi', () => {
    expect(reusableForLocation(asset({}))).toBe(true);
    expect(reusableForLocation(asset({ path: `events/${V}/x.png` }))).toBe(false);
    expect(reusableForLocation(asset({ mimeType: 'image/svg+xml' }))).toBe(false);
  });

  it('menyebut paling banyak tiga pemakai', () => {
    expect(inUseMessage([usage('A', 'logo')])).toBe(
      'Aset ini masih dipakai Lokasi "A" (logo). Lepaskan dari pemakainya dulu.',
    );
    expect(inUseMessage(['A', 'B', 'C', 'D', 'E'].map((n) => usage(n)))).toContain(
      'Lokasi "C" (foto) dan 2 lainnya.',
    );
  });
});

describe('nama berkas unggahan pustaka', () => {
  const id = '1a2b3c4d-0000-4000-8000-000000000000';

  it('memakai nama asli yang dirapikan dan penanda unik', () => {
    expect(libraryFileName('Denah Lobi (Baru).PNG', id, 'png')).toBe(
      'media-denah-lobi-baru-1a2b3c4d.png',
    );
    expect(libraryFileName('Café Ñandú.jpeg', id, 'jpg')).toBe('media-cafe-nandu-1a2b3c4d.jpg');
    expect(libraryFileName('', id, 'webp')).toBe('media-gambar-1a2b3c4d.webp');
    expect(libraryFileName('###.png', id, 'png')).toBe('media-gambar-1a2b3c4d.png');
    expect(libraryFileName(`${'a'.repeat(60)}.png`, id, 'png')).toBe(
      `media-${'a'.repeat(40)}-1a2b3c4d.png`,
    );
  });

  it('unggahan pustaka bernama mirip logo tetap foto', () => {
    const path = `locations/${V}/${libraryFileName('toko-logo-2024.png', id, 'png')}`;
    expect(mediaKindOf('public-assets', path)).toBe('photo');
  });
});
