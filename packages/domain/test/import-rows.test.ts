import { describe, expect, it } from 'vitest';
import {
  type FieldDefinition,
  type ImportContext,
  importHeader,
  type Location,
  type LocationType,
  planImport,
  type VenueUnit,
} from '../src';

const field = (key: string, over: Partial<FieldDefinition> = {}): FieldDefinition =>
  ({
    id: `f-${key}`,
    key,
    label: key,
    type: 'text',
    options: [],
    isRequired: false,
    isVisible: true,
    isSearchable: false,
    sortOrder: 0,
    ...over,
  }) as FieldDefinition;

const type = {
  id: 't1',
  name: 'Layanan',
  icon: null,
  color: null,
  sortOrder: 0,
  fields: [
    field('telepon', { isRequired: true }),
    field('lantai', { type: 'number' }),
    field('foto', { type: 'image' }),
  ],
} as unknown as LocationType;

const unit = (code: string, holders: VenueUnit['holders'] = []) =>
  ({ featureId: `u-${code}`, unitCode: code, holders }) as unknown as VenueUnit;

const existing = {
  id: 'l1',
  locationTypeId: 't1',
  code: 'RAD-01',
  name: 'Radiologi',
  description: 'Lama',
  status: 'active',
  categoryIds: ['c1'],
  units: [{ featureId: 'u-L1-001' }],
  customFields: { telepon: '021', foto: 'locations/v/f.png' },
} as unknown as Location;

const context: ImportContext = {
  type,
  categories: [
    { id: 'c1', name: 'Pemeriksaan' },
    { id: 'c2', name: 'Farmasi' },
  ],
  units: [
    unit('L1-001', [{ locationId: 'l1' as never, name: 'Radiologi' }]),
    unit('L1-002'),
    unit('L1-003', [{ locationId: 'lain' as never, name: 'Kafe' }]),
  ],
  locations: [
    existing,
    {
      ...existing,
      id: 'l2',
      code: 'X-9',
      locationTypeId: 't2',
      name: 'Lain',
    } as unknown as Location,
  ],
};

const header = importHeader(type);
const row = (cells: Record<string, string>) => header.map((h) => cells[h] ?? '');

describe('import lokasi', () => {
  it('kolom: standar lalu field kustom yang bisa diimpor (gambar tidak)', () => {
    expect(header).toEqual([
      'kode_lokasi',
      'nama',
      'kategori',
      'deskripsi',
      'status',
      'tanggal_buka',
      'kode_unit',
      'telepon',
      'lantai',
    ]);
  });

  it('baris baru dan baris yang memperbarui lewat kode lokasi; sel kosong mempertahankan nilai lama', () => {
    const plan = planImport(
      [
        header,
        row({
          nama: 'Apotek',
          kategori: 'farmasi',
          kode_unit: 'l1-002',
          telepon: '022',
          lantai: '1,5',
        }),
        row({ kode_lokasi: 'rad-01', nama: 'Radiologi Baru', lantai: '2' }),
      ],
      context,
    );
    expect(plan.missingColumns).toEqual([]);
    const [created, updated] = plan.rows;
    expect(created).toMatchObject({
      line: 2,
      action: 'create',
      errors: [],
      write: {
        id: null,
        name: 'Apotek',
        status: 'active',
        categoryIds: ['c2'],
        unitIds: ['u-L1-002'],
        customFields: { telepon: '022', lantai: 1.5 },
      },
    });
    expect(updated).toMatchObject({
      action: 'update',
      locationId: 'l1',
      write: {
        id: 'l1',
        code: 'RAD-01',
        description: null,
        status: null,
        categoryIds: null,
        unitIds: null,
        customFields: { telepon: '021', lantai: 2, foto: 'locations/v/f.png' },
      },
    });
  });

  it('tanpa kode lokasi, kode unit menemukan lokasi yang menempatinya', () => {
    const plan = planImport([header, row({ nama: 'Radiologi', kode_unit: 'L1-001' })], context);
    expect(plan.rows[0]).toMatchObject({ action: 'update', locationId: 'l1' });
  });

  it('setiap kesalahan disebut per kolom; baris salah tidak ditulis', () => {
    const plan = planImport(
      [
        header,
        row({ kode_lokasi: 'ok-1', nama: '', telepon: '1' }),
        row({ nama: 'A', kategori: 'Tidak ada', telepon: '1' }),
        row({ nama: 'B', status: 'segera_buka', telepon: '1' }),
        row({ nama: 'C', kode_unit: 'L1-003', telepon: '1' }),
        row({ nama: 'D', lantai: 'dua' }),
        row({ kode_lokasi: 'X-9', nama: 'E', telepon: '1' }),
        row({ kode_lokasi: 'ok-1', nama: 'F', telepon: '1' }),
      ],
      context,
    );
    const errors = plan.rows.map((r) => r.errors.map((e) => e.column));
    expect(errors).toEqual([
      ['nama'],
      ['kategori'],
      ['tanggal_buka'],
      ['kode_unit'],
      ['telepon', 'lantai'],
      ['kode_lokasi'],
      ['kode_lokasi'],
    ]);
    expect(plan.rows.every((r) => r.action === 'invalid' && r.write === null)).toBe(true);
  });

  it('tanggal buka ISO, DD/MM/YYYY, atau nomor seri Excel; status dari label', () => {
    const plan = planImport(
      [
        header,
        row({ nama: 'A', status: 'Segera buka', tanggal_buka: '2026-11-01', telepon: '1' }),
        row({ nama: 'B', status: 'segera_buka', tanggal_buka: '01/11/2026', telepon: '1' }),
        row({ nama: 'C', status: 'segera buka', tanggal_buka: '46327', telepon: '1' }),
      ],
      context,
    );
    expect(plan.rows.map((r) => r.write?.openingDate)).toEqual([
      '2026-11-01',
      '2026-11-01',
      '2026-11-01',
    ]);
  });

  it('kolom nama wajib ada; kolom tidak dikenal dilaporkan', () => {
    const plan = planImport(
      [
        ['kode_lokasi', 'catatan'],
        ['A', 'x'],
      ],
      context,
    );
    expect(plan.missingColumns).toEqual(['nama']);
    expect(plan.unknownColumns).toEqual(['catatan']);
    expect(plan.rows).toEqual([]);
  });

  it('100 baris dengan 5 baris salah: tepat 5 gagal beserta alasan, 95 siap ditulis', () => {
    const body = Array.from({ length: 100 }, (_, i) =>
      row({
        kode_lokasi: `B-${i}`,
        nama: i % 20 === 7 ? '' : `Lokasi ${i}`,
        telepon: '021',
      }),
    );
    const plan = planImport([header, ...body], context);
    const failed = plan.rows.filter((r) => r.action === 'invalid');
    expect(failed.map((r) => r.line)).toEqual([9, 29, 49, 69, 89]);
    expect(failed.every((r) => r.errors[0]?.message === 'Nama wajib diisi.')).toBe(true);
    expect(plan.rows.filter((r) => r.write)).toHaveLength(95);
  });
});
