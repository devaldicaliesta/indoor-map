import { describe, expect, it } from 'vitest';
import {
  BULK_EDIT_MAX,
  type BulkEditContext,
  bulkChangePayload,
  type CategoryId,
  type CustomField,
  checkBulkChange,
  describeStoredBulkChange,
  EMPTY_OPENING_HOURS,
  type Location,
  type LocationId,
  type LocationTypeId,
  previewBulkChange,
  type VenueId,
  weeklySummary,
} from '../src';

const TYPE_A = '00000000-0000-4000-8000-0000000000a1' as LocationTypeId;
const TYPE_B = '00000000-0000-4000-8000-0000000000b1' as LocationTypeId;
const CAT_A = '00000000-0000-4000-8000-0000000000c1' as CategoryId;
const CAT_A2 = '00000000-0000-4000-8000-0000000000c2' as CategoryId;
const CAT_B = '00000000-0000-4000-8000-0000000000c3' as CategoryId;

const field = (key: string, type: CustomField['type']): CustomField => ({
  key,
  label: key,
  type,
  options: [],
  isRequired: false,
  isVisible: true,
  isSearchable: false,
});

const context: BulkEditContext = {
  statusLabel: (s) => ({ active: 'Aktif', coming_soon: 'Segera buka' })[s as string] ?? s,
  types: [
    { id: TYPE_A, name: 'Klinik', fields: [field('telepon', 'text'), field('lantai', 'number')] },
    { id: TYPE_B, name: 'Kantor', fields: [field('telepon', 'text'), field('lantai', 'text')] },
  ],
  categories: [
    { id: CAT_A, name: 'Umum', locationTypeId: TYPE_A },
    { id: CAT_A2, name: 'Gigi', locationTypeId: TYPE_A },
    { id: CAT_B, name: 'Keuangan', locationTypeId: TYPE_B },
  ],
};

let seq = 0;
const location = (over: Partial<Location> = {}): Location => {
  seq += 1;
  return {
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}` as LocationId,
    venueId: '00000000-0000-4000-8000-000000000999' as VenueId,
    locationTypeId: TYPE_A,
    code: null,
    name: `Lokasi ${seq}`,
    description: null,
    descriptionEn: null,
    logoPath: null,
    photoPaths: [],
    status: 'active',
    categoryIds: [],
    units: [],
    customFields: {},
    openingDate: null,
    hours: EMPTY_OPENING_HOURS,
    ...over,
  };
};

const office = { opens: '08:00', closes: '16:00' };
const weekdays = [[office], [office], [office], [office], [office], [], []];

describe('checkBulkChange', () => {
  it('menolak pilihan kosong dan lebih dari batas', () => {
    const change = { kind: 'status', status: 'active', openingDate: null } as const;
    expect(checkBulkChange([], change, context)).toContain('empty_selection');
    const many = Array.from({ length: BULK_EDIT_MAX + 1 }, () => ({ locationTypeId: TYPE_A }));
    expect(checkBulkChange(many, change, context)).toContain('too_many');
  });

  it('segera buka wajib bertanggal', () => {
    const rows = [location()];
    expect(
      checkBulkChange(rows, { kind: 'status', status: 'coming_soon', openingDate: null }, context),
    ).toEqual(['opening_date_required']);
    expect(
      checkBulkChange(
        rows,
        { kind: 'status', status: 'coming_soon', openingDate: '2026-12-01' },
        context,
      ),
    ).toEqual([]);
  });

  it('tambah kategori hanya bila semua lokasi bertipe sama dengan kategori', () => {
    const mixed = [location(), location({ locationTypeId: TYPE_B })];
    expect(checkBulkChange(mixed, { kind: 'category_add', categoryId: CAT_A }, context)).toEqual([
      'category_type_mismatch',
    ]);
    expect(checkBulkChange(mixed, { kind: 'category_remove', categoryId: CAT_A }, context)).toEqual(
      [],
    );
  });

  it('tipe dan kategori harus dikenal, jam harus JJ:MM untuk 7 hari', () => {
    const rows = [location()];
    const unknown = '00000000-0000-4000-8000-00000000ffff';
    expect(
      checkBulkChange(rows, { kind: 'type', typeId: unknown as LocationTypeId }, context),
    ).toEqual(['unknown_type']);
    expect(
      checkBulkChange(rows, { kind: 'category_add', categoryId: unknown as CategoryId }, context),
    ).toEqual(['unknown_category']);
    expect(
      checkBulkChange(
        rows,
        { kind: 'hours', weekly: [[{ opens: '8', closes: '16:00' }]] },
        context,
      ),
    ).toEqual(['hours_format']);
    expect(checkBulkChange(rows, { kind: 'hours', weekly: weekdays }, context)).toEqual([]);
  });
});

describe('previewBulkChange', () => {
  it('status: sebelum/sesudah dengan tanggal buka, lokasi yang sudah sama tidak berubah', () => {
    const rows = previewBulkChange(
      [location(), location({ status: 'coming_soon', openingDate: '2026-12-01' })],
      { kind: 'status', status: 'coming_soon', openingDate: '2026-12-01' },
      context,
    );
    expect(rows.map((r) => [r.before, r.after, r.changed])).toEqual([
      ['Aktif', 'Segera buka (2026-12-01)', true],
      ['Segera buka (2026-12-01)', 'Segera buka (2026-12-01)', false],
    ]);
  });

  it('tipe: menyebut kategori dan field yang ikut dilepas', () => {
    const [row] = previewBulkChange(
      [location({ categoryIds: [CAT_A], customFields: { telepon: '021', lantai: 3 } })],
      { kind: 'type', typeId: TYPE_B },
      context,
    );
    expect(row).toMatchObject({ before: 'Klinik', after: 'Kantor', changed: true });
    expect(row?.note).toBe('kategori dilepas: Umum; field dilepas: lantai');
  });

  it('kategori: tambah dan lepas hanya mengubah lokasi yang terdampak', () => {
    const has = location({ categoryIds: [CAT_A] });
    const lacks = location({ categoryIds: [CAT_A2] });
    const add = previewBulkChange(
      [has, lacks],
      { kind: 'category_add', categoryId: CAT_A },
      context,
    );
    expect(add.map((r) => [r.after, r.changed])).toEqual([
      ['Umum', false],
      ['Gigi, Umum', true],
    ]);
    const remove = previewBulkChange(
      [has, lacks],
      { kind: 'category_remove', categoryId: CAT_A },
      context,
    );
    expect(remove.map((r) => [r.after, r.changed])).toEqual([
      ['—', true],
      ['Gigi', false],
    ]);
  });

  it('jam mingguan diringkas', () => {
    const [row] = previewBulkChange([location()], { kind: 'hours', weekly: weekdays }, context);
    expect(row).toMatchObject({
      before: 'Belum diatur',
      after: 'Sen–Jum 08:00–16:00 · Sab–Min libur',
      changed: true,
    });
  });
});

describe('payload dan keterangan', () => {
  it('bentuk p_change sama dengan bulk_edit_locations', () => {
    expect(
      bulkChangePayload({ kind: 'status', status: 'active', openingDate: '2026-01-01' }),
    ).toEqual({ kind: 'status', status: 'active', opening_date: null });
    expect(
      bulkChangePayload({ kind: 'hours', weekly: [[office], [], [], [], [], [], [office]] }),
    ).toEqual({
      kind: 'hours',
      hours: [
        { weekday: 1, opens_at: '08:00', closes_at: '16:00' },
        { weekday: 7, opens_at: '08:00', closes_at: '16:00' },
      ],
    });
  });

  it('keterangan edit tersimpan memakai nama tipe dan kategori', () => {
    expect(describeStoredBulkChange({ kind: 'status', status: 'active' }, context)).toBe(
      'Status → Aktif',
    );
    expect(describeStoredBulkChange({ kind: 'type', type_id: TYPE_B }, context)).toBe(
      'Tipe → Kantor',
    );
    expect(describeStoredBulkChange({ kind: 'category_remove', category_id: CAT_B }, context)).toBe(
      'Lepas kategori Keuangan',
    );
    expect(weeklySummary([[office], [office], [], [], [], [], [office]])).toBe(
      'Sen–Sel 08:00–16:00 · Rab–Sab libur · Min 08:00–16:00',
    );
  });
});
