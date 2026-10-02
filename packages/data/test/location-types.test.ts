import { describe, expect, it } from 'vitest';
import { mapLocationTypeRow, toFieldRow } from '../src/repositories/location-types';

const field = {
  id: '81000000-0000-4000-8000-000000000001',
  key: 'layanan',
  label: 'Layanan',
  field_type: 'select',
  options: ['Umum', 3, 'BPJS'],
  is_required: true,
  is_visible: true,
  is_searchable: false,
  sort_order: 1,
};

describe('tipe lokasi', () => {
  it('baris tipe beserta field terurut menjadi tipe domain; opsi bukan teks dibuang', () => {
    const type = mapLocationTypeRow({
      id: '80000000-0000-4000-8000-000000000001',
      name: 'Lokasi',
      icon: 'map-pin',
      color: null,
      sort_order: 0,
      field_definitions: [
        field,
        {
          ...field,
          id: '81000000-0000-4000-8000-000000000002',
          key: 'telepon',
          label: 'Telepon',
          field_type: 'text',
          options: [],
          sort_order: 0,
        },
      ],
    });
    expect(type.fields.map((f) => f.key)).toEqual(['telepon', 'layanan']);
    expect(type.fields[1]).toMatchObject({
      type: 'select',
      options: ['Umum', 'BPJS'],
      isRequired: true,
    });
  });

  it('opsi hanya disimpan untuk jenis pilihan; label dirapikan', () => {
    const base = {
      key: 'x',
      label: ' Situs ',
      options: ['a'],
      isRequired: false,
      isVisible: true,
      isSearchable: true,
    };
    expect(toFieldRow({ ...base, type: 'link' })).toMatchObject({ label: 'Situs', options: [] });
    expect(toFieldRow({ ...base, type: 'select', options: [' a ', ''] }).options).toEqual(['a']);
  });
});
