import { describe, expect, it } from 'vitest';
import { resolveTourSteps, type TourStep, tourKey, tourSelector } from '../src/tour/steps';

type Action = 'location.edit' | 'publish.publish';

const steps: TourStep<Action>[] = [
  { title: 'Pengantar', description: 'Tanpa sasaran: selalu tampil' },
  { target: 'search', title: 'Cari', description: 'Kolom cari' },
  { target: 'add', title: 'Tambah', description: 'Tombol tulis', requires: 'location.edit' },
  { target: 'pagination', title: 'Halaman', description: 'Hanya ada bila tabel berisi' },
  { title: 'Terbitkan', description: 'Aksi tanpa sasaran', requires: 'publish.publish' },
];

const titles = (list: TourStep<Action>[]) => list.map((s) => s.title);

describe('resolveTourSteps', () => {
  it('pengguna dengan semua aksi dan semua elemen ada: semua langkah tampil berurutan', () => {
    const resolved = resolveTourSteps(steps, { can: () => true, isPresent: () => true });
    expect(titles(resolved)).toEqual(['Pengantar', 'Cari', 'Tambah', 'Halaman', 'Terbitkan']);
  });

  it('Viewer: langkah tombol tulis tidak ditunjukkan walau tombolnya ada di DOM', () => {
    const resolved = resolveTourSteps(steps, { can: () => false, isPresent: () => true });
    expect(titles(resolved)).toEqual(['Pengantar', 'Cari', 'Halaman']);
  });

  it('elemen yang tidak ada di layar (tabel kosong) dilewati, tur tidak macet', () => {
    const present = new Set(['search', 'add']);
    const resolved = resolveTourSteps(steps, {
      can: (action) => action === 'location.edit',
      isPresent: (target) => present.has(target),
    });
    expect(titles(resolved)).toEqual(['Pengantar', 'Cari', 'Tambah']);
  });

  it('tidak mengubah daftar asli', () => {
    resolveTourSteps(steps, { can: () => false, isPresent: () => false });
    expect(steps).toHaveLength(5);
  });
});

describe('tourKey dan tourSelector', () => {
  it('kunci berversi dan selektor atribut data-tour', () => {
    expect(tourKey({ id: 'editor', version: 2 })).toBe('editor@2');
    expect(tourSelector('locations-add')).toBe('[data-tour="locations-add"]');
  });
});
