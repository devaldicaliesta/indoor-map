import {
  type ImportPlan,
  type ImportRow,
  type LocationType,
  planImport,
  type VenueId,
} from '@indoor/domain';
import {
  Badge,
  Button,
  type DataColumn,
  DataTable,
  type FilterDef,
  Input,
  queryRows,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
  useLocalTableState,
} from '@indoor/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Field } from '../../app/components/field';
import { data } from '../../app/data-client';
import { FormNotice } from '../auth/auth-layout';
import { useCategories, useLocations, useVenueUnits } from '../locations/queries';
import { downloadCsvTemplate, downloadXlsxTemplate, readTable } from './import-files';

const ACTION_LABELS = { create: 'Baru', update: 'Perbarui', invalid: 'Gagal' } as const;

function Summary({ plan }: { plan: ImportPlan }) {
  const count = (action: keyof typeof ACTION_LABELS) =>
    plan.rows.filter((r) => r.action === action).length;
  return (
    <p>
      <strong>{count('create')}</strong> baru · <strong>{count('update')}</strong> memperbarui ·{' '}
      <strong className={count('invalid') ? 'text-danger' : undefined}>{count('invalid')}</strong>{' '}
      gagal dari {plan.rows.length} baris.
    </p>
  );
}

const RESULT_FILTER: FilterDef[] = [
  {
    kind: 'multi',
    key: 'hasil',
    label: 'Hasil',
    options: Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
  },
];

const PLAN_COLUMNS: DataColumn<ImportRow>[] = [
  { id: 'line', header: 'Baris', className: 'w-16 font-mono', cell: (row) => row.line },
  {
    id: 'action',
    header: 'Hasil',
    className: 'w-24',
    cell: (row) => <Badge>{ACTION_LABELS[row.action]}</Badge>,
  },
  { id: 'name', header: 'Nama', className: 'whitespace-normal', cell: (row) => row.name || '—' },
  {
    id: 'errors',
    header: 'Alasan',
    className: 'whitespace-normal text-sm',
    cell: (row) =>
      row.errors.length ? (
        <ul className="grid gap-0.5 text-danger">
          {row.errors.map((e) => (
            <li key={`${e.column}-${e.message}`}>
              <span className="font-mono">{e.column}</span>: {e.message}
            </li>
          ))}
        </ul>
      ) : null,
  },
];

function PlanTable({ plan }: { plan: ImportPlan }) {
  const table = useLocalTableState();
  // Baris gagal didahulukan agar alasannya terlihat tanpa berpindah halaman.
  const rows = [...plan.rows].sort(
    (a, b) => Number(b.action === 'invalid') - Number(a.action === 'invalid') || a.line - b.line,
  );
  const result = queryRows(rows, table.state, {
    text: (row) => [
      String(row.line),
      row.name,
      ...row.errors.flatMap((e) => [e.column, e.message]),
    ],
    filters: { hasil: (row, values) => values.includes(row.action) },
  });
  return (
    <DataTable
      label="Pratinjau impor"
      columns={PLAN_COLUMNS}
      rows={result.rows}
      rowKey={(row) => String(row.line)}
      total={result.total}
      table={table}
      search={{ placeholder: 'Cari nomor baris, nama, atau alasan' }}
      filters={RESULT_FILTER}
      empty={<p className="text-ink-muted">Berkas tidak berisi baris data.</p>}
    />
  );
}

/**
 * Import lokasi satu tipe dari CSV/XLSX: unduh template, pilih berkas (diparse di browser),
 * pratinjau baru/perbarui/gagal dengan alasan per kolom, lalu simpan hanya baris yang valid.
 */
export function ImportDialog({
  venueId,
  types,
  onClose,
}: {
  venueId: VenueId;
  types: readonly LocationType[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const locations = useLocations(venueId).data;
  const categories = useCategories(venueId).data;
  const units = useVenueUnits(venueId).data;
  const [typeId, setTypeId] = useState(types[0]?.id ?? '');
  const type = types.find((t) => t.id === typeId);
  const [fileName, setFileName] = useState<string | null>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const ready = Boolean(locations && categories && units && type);
  const valid = plan?.rows.filter((r) => r.write) ?? [];

  async function choose(file: File | undefined) {
    setPlan(null);
    setProblem(null);
    setFileName(file?.name ?? null);
    if (!file || !type || !locations || !categories || !units) return;
    try {
      const table = await readTable(file);
      const next = planImport(table, {
        type,
        categories: categories.filter((c) => c.locationTypeId === type.id),
        units,
        locations,
      });
      if (next.missingColumns.length) {
        setProblem(`Kolom wajib tidak ada: ${next.missingColumns.join(', ')}. Pakai template.`);
        return;
      }
      setPlan(next);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'Berkas tidak bisa dibaca.');
    }
  }

  async function saveValid() {
    if (!type || valid.length === 0) return;
    setSaving(0);
    setProblem(null);
    try {
      const writes = valid.flatMap((r) => (r.write ? [r.write] : []));
      const saved = await data.locations.importRows(venueId, type.id, writes, setSaving);
      toast.success(`${saved} lokasi diimpor`, { description: type.name });
      onClose();
    } catch (error) {
      setProblem(
        `Sebagian baris mungkin sudah tersimpan sebelum galat: ${
          error instanceof Error ? error.message : 'galat tidak dikenal'
        }`,
      );
    } finally {
      setSaving(null);
      await Promise.all(
        ['locations', 'venue-units', 'categories'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key, venueId] }),
        ),
      );
    }
  }

  return (
    <Sheet open onOpenChange={(open) => !open && saving === null && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Import lokasi</SheetTitle>
          <SheetDescription>
            Berkas dibaca di browser ini. Baris dengan kode lokasi yang sudah ada memperbarui lokasi
            itu (tanpa kode: dicocokkan lewat kode unit); sel kosong mempertahankan nilai lama.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end gap-2">
            <Field id="import-type" label="Tipe lokasi">
              <Select
                value={typeId}
                onValueChange={(id) => {
                  setTypeId(id);
                  setPlan(null);
                  setFileName(null);
                }}
              >
                <SelectTrigger id="import-type" className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Button disabled={!type} onClick={() => type && downloadCsvTemplate(type)}>
              Template CSV
            </Button>
            <Button disabled={!type} onClick={() => type && void downloadXlsxTemplate(type)}>
              Template XLSX
            </Button>
          </div>
          <Field
            id="import-file"
            label="Berkas"
            hint="CSV (koma atau titik koma) atau XLSX. Kategori dan kode unit dipisah titik koma."
          >
            <Input
              id="import-file"
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={!ready || saving !== null}
              // Kunci nama berkas: memilih berkas yang sama lagi setelah diperbaiki tetap terbaca.
              key={fileName ?? 'kosong'}
              onChange={(e) => void choose(e.target.files?.[0])}
            />
          </Field>
          {problem ? <FormNotice tone="error">{problem}</FormNotice> : null}
          {plan ? (
            <>
              <Summary plan={plan} />
              {plan.unknownColumns.length ? (
                <p className="text-ink-muted text-sm">
                  Kolom diabaikan: {plan.unknownColumns.join(', ')}.
                </p>
              ) : null}
              <PlanTable key={fileName ?? ''} plan={plan} />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  disabled={valid.length === 0 || saving !== null}
                  onClick={() => void saveValid()}
                >
                  {saving !== null
                    ? `Menyimpan ${saving}/${valid.length}…`
                    : `Simpan ${valid.length} baris valid`}
                </Button>
                <Button
                  variant="ghost"
                  disabled={saving !== null}
                  onClick={() => {
                    setPlan(null);
                    setFileName(null);
                  }}
                >
                  Perbaiki berkas dan unggah ulang
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
