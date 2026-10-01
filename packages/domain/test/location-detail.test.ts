import { describe, expect, it } from 'vitest';
import { displayFields, externalUrl, type SnapshotLocationType } from '../src';

const type: Pick<SnapshotLocationType, 'fields'> = {
  fields: [
    { key: 'extension', label: 'Ekstensi', type: 'text', options: [] },
    { key: 'hours', label: 'Jam buka', type: 'opening_hours', options: [] },
    { key: 'website', label: 'Situs', type: 'link', options: [] },
    { key: 'floors', label: 'Layanan', type: 'select', options: ['A', 'B'] },
    { key: 'empty', label: 'Kosong', type: 'text', options: [] },
  ],
};

describe('field kustom di detail lokasi', () => {
  it('urut definisi tipe, yang kosong dan jam operasional dilewati', () => {
    const fields = displayFields(
      {
        fields: {
          website: 'https://contoh.test',
          extension: '1203',
          hours: 'Senin–Jumat',
          floors: [],
          unknown: 'tidak didefinisikan',
        },
      },
      type,
    );
    expect(fields.map((f) => [f.key, f.label, f.value])).toEqual([
      ['extension', 'Ekstensi', '1203'],
      ['website', 'Situs', 'https://contoh.test'],
    ]);
  });

  it('tanpa tipe lokasi tidak ada field', () => {
    expect(displayFields({ fields: { extension: '1' } }, undefined)).toEqual([]);
  });

  it('tautan hanya http(s)', () => {
    expect(externalUrl(' https://rs.contoh.test/jadwal?poli=anak ')).toBe(
      'https://rs.contoh.test/jadwal?poli=anak',
    );
    expect(externalUrl('http://10.0.0.5/info')).toBe('http://10.0.0.5/info');
    expect(externalUrl('javascript:alert(1)')).toBeNull();
    expect(externalUrl('JAVASCRIPT://%0aalert(1)')).toBeNull();
    expect(externalUrl('data:text/html,<script>')).toBeNull();
    expect(externalUrl('https://')).toBeNull();
    expect(externalUrl('www.contoh.test')).toBeNull();
    expect(externalUrl(42)).toBeNull();
  });
});
