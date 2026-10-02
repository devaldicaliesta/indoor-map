import { describe, expect, it } from 'vitest';
import {
  type CustomField,
  checkCustomField,
  customFieldsSchema,
  FIELD_TYPES,
  fieldKeyFromLabel,
  keepFieldsOf,
  parseCustomFieldInputs,
  reorderFields,
} from '../src';

const field = (over: Partial<CustomField>): CustomField => ({
  key: 'catatan',
  label: 'Catatan',
  type: 'text',
  options: [],
  isRequired: false,
  isVisible: true,
  isSearchable: false,
  ...over,
});

describe('kunci field', () => {
  it('dari label: huruf kecil, garis bawah, diawali huruf, unik di tipe', () => {
    expect(fieldKeyFromLabel('Nomor Telepon', [])).toBe('nomor_telepon');
    expect(fieldKeyFromLabel('  Jam Buka (Senin–Jumat) ', [])).toBe('jam_buka_senin_jumat');
    expect(fieldKeyFromLabel('24 Jam', [])).toBe('f_24_jam');
    expect(fieldKeyFromLabel('Situs web', ['situs_web', 'situs_web_2'])).toBe('situs_web_3');
    expect(fieldKeyFromLabel('Café', [])).toBe('cafe');
    expect(fieldKeyFromLabel('!!!', [])).toBe('field');
  });
});

describe('definisi field', () => {
  it('keenam jenis tersedia', () => {
    expect(FIELD_TYPES).toEqual(['text', 'number', 'select', 'opening_hours', 'image', 'link']);
  });

  it('label wajib; pilihan wajib punya opsi unik; kunci unik', () => {
    expect(checkCustomField(field({}), [])).toEqual([]);
    expect(checkCustomField(field({ label: ' ' }), [])).toContain('label_required');
    expect(checkCustomField(field({ type: 'select', options: [] }), [])).toContain(
      'options_required',
    );
    expect(checkCustomField(field({ type: 'select', options: ['A', 'a'] }), [])).toContain(
      'options_duplicate',
    );
    expect(checkCustomField(field({}), [field({})])).toContain('key_duplicate');
  });
});

describe('nilai field kustom', () => {
  const fields = [
    field({ key: 'telepon', label: 'Telepon', isRequired: true }),
    field({ key: 'lantai_parkir', label: 'Lantai parkir', type: 'number' }),
    field({ key: 'layanan', label: 'Layanan', type: 'select', options: ['Umum', 'BPJS'] }),
    field({ key: 'situs', label: 'Situs', type: 'link' }),
    field({ key: 'jam', label: 'Jam', type: 'opening_hours' }),
    field({ key: 'denah', label: 'Denah', type: 'image' }),
  ];

  it('isian formulir menjadi nilai bertipe; kosong pada field opsional dibuang', () => {
    expect(
      parseCustomFieldInputs(fields, {
        telepon: ' 021-555 ',
        lantai_parkir: '2,5',
        layanan: 'BPJS',
        situs: 'https://contoh.id',
        jam: 'Senin–Jumat 08.00–16.00',
        denah: '',
      }),
    ).toEqual({
      values: {
        telepon: '021-555',
        lantai_parkir: 2.5,
        layanan: 'BPJS',
        situs: 'https://contoh.id',
        jam: 'Senin–Jumat 08.00–16.00',
      },
      errors: {},
    });
  });

  it('wajib, angka, pilihan, dan tautan diperiksa per field', () => {
    const { errors } = parseCustomFieldInputs(fields, {
      telepon: '',
      lantai_parkir: 'dua',
      layanan: 'VIP',
      situs: 'javascript:alert(1)',
    });
    expect(Object.keys(errors).sort()).toEqual(['lantai_parkir', 'layanan', 'situs', 'telepon']);
  });

  it('skema zod yang sama memeriksa nilai tersimpan (validasi publish)', () => {
    const schema = customFieldsSchema(fields);
    expect(schema.safeParse({ telepon: '1', lantai_parkir: 3 }).success).toBe(true);
    expect(schema.safeParse({ lantai_parkir: 3 }).success).toBe(false);
    expect(schema.safeParse({ telepon: '1', layanan: 'VIP' }).success).toBe(false);
  });

  it('ganti tipe: hanya nilai field yang ada di tipe baru dengan jenis sama yang tersisa', () => {
    const next = [field({ key: 'telepon' }), field({ key: 'layanan', type: 'text' })];
    expect(keepFieldsOf({ telepon: '1', layanan: 'BPJS', lantai_parkir: 2 }, fields, next)).toEqual(
      { kept: { telepon: '1' }, dropped: ['layanan', 'lantai_parkir'] },
    );
  });
});

describe('urutan field', () => {
  it('drag ke posisi baru menomori ulang semua field', () => {
    const fields = [
      { id: 'a', sortOrder: 0 },
      { id: 'b', sortOrder: 1 },
      { id: 'c', sortOrder: 2 },
    ];
    expect(reorderFields(fields, 'c', 0)).toEqual([
      { id: 'c', sortOrder: 0 },
      { id: 'a', sortOrder: 1 },
      { id: 'b', sortOrder: 2 },
    ]);
    expect(reorderFields(fields, 'a', 9).map((f) => f.id)).toEqual(['b', 'c', 'a']);
  });
});
