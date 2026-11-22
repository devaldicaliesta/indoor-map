import type { CategoryWithUsage } from '@indoor/data';
import {
  BULK_CHANGE_LABELS,
  BULK_EDIT_PROBLEM_MESSAGES,
  type BulkChangeKind,
  type BulkEditContext,
  type BulkLocationChange,
  CategoryIdSchema,
  checkBulkChange,
  EMPTY_OPENING_HOURS,
  LOCATION_STATUSES,
  type Location,
  type LocationId,
  type LocationStatus,
  type LocationType,
  LocationTypeIdSchema,
  type OpeningHours,
  previewBulkChange,
  type VenueId,
} from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@indoor/ui';
import { useMemo, useState } from 'react';
import { Field } from '../../app/components/field';
import { FormNotice } from '../auth/auth-layout';
import { HoursEditor } from './hours-editor';
import { LOCATION_STATUS_LABELS } from './labels';
import { useBulkEditMutations, useLocations } from './queries';

const KINDS: BulkChangeKind[] = ['status', 'category_add', 'category_remove', 'type', 'hours'];
const PREVIEW_ROWS = 50;
const count = new Intl.NumberFormat('id-ID');

interface Draft {
  kind: BulkChangeKind;
  status: LocationStatus;
  openingDate: string;
  typeId: string;
  categoryId: string;
  hours: OpeningHours;
}

function toChange(draft: Draft): BulkLocationChange | null {
  switch (draft.kind) {
    case 'status':
      return { kind: 'status', status: draft.status, openingDate: draft.openingDate || null };
    case 'type': {
      const typeId = LocationTypeIdSchema.safeParse(draft.typeId);
      return typeId.success ? { kind: 'type', typeId: typeId.data } : null;
    }
    case 'category_add':
    case 'category_remove': {
      const categoryId = CategoryIdSchema.safeParse(draft.categoryId);
      return categoryId.success ? { kind: draft.kind, categoryId: categoryId.data } : null;
    }
    case 'hours':
      return { kind: 'hours', weekly: draft.hours.weekly };
  }
}

function ChangeFields({
  draft,
  types,
  categories,
  onChange,
}: {
  draft: Draft;
  types: readonly LocationType[];
  categories: readonly CategoryWithUsage[];
  onChange: (draft: Draft) => void;
}) {
  const typeName = new Map(types.map((t) => [t.id as string, t.name]));
  switch (draft.kind) {
    case 'status':
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field id="bulk-status" label="Status baru">
            <Select
              value={draft.status}
              onValueChange={(value) => onChange({ ...draft, status: value as LocationStatus })}
            >
              <SelectTrigger id="bulk-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {LOCATION_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {draft.status === 'coming_soon' ? (
            <Field id="bulk-opening-date" label="Tanggal buka">
              <Input
                id="bulk-opening-date"
                type="date"
                value={draft.openingDate}
                onChange={(e) => onChange({ ...draft, openingDate: e.target.value })}
              />
            </Field>
          ) : null}
        </div>
      );
    case 'type':
      return (
        <Field
          id="bulk-type"
          label="Tipe baru"
          hint="Kategori dan nilai field kustom yang tidak ada di tipe baru ikut dilepas."
        >
          <Select value={draft.typeId} onValueChange={(typeId) => onChange({ ...draft, typeId })}>
            <SelectTrigger id="bulk-type">
              <SelectValue placeholder="Pilih tipe" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      );
    case 'category_add':
    case 'category_remove':
      return (
        <Field id="bulk-category" label="Kategori">
          <Select
            value={draft.categoryId}
            onValueChange={(categoryId) => onChange({ ...draft, categoryId })}
          >
            <SelectTrigger id="bulk-category">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name} ({typeName.get(category.locationTypeId) ?? 'tipe lain'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      );
    case 'hours':
      return (
        <HoursEditor
          weeklyOnly
          hours={draft.hours}
          error={undefined}
          disabled={false}
          onChange={(hours) => onChange({ ...draft, hours })}
        />
      );
  }
}

function PreviewTable({ rows }: { rows: ReturnType<typeof previewBulkChange> }) {
  const changed = rows.filter((r) => r.changed);
  const shown = changed.slice(0, PREVIEW_ROWS);
  return (
    <section aria-label="Pratinjau perubahan" className="grid gap-2">
      <p className="font-bold" data-testid="bulk-preview-summary">
        {count.format(changed.length)} dari {count.format(rows.length)} lokasi berubah
        {changed.length < rows.length
          ? `; ${count.format(rows.length - changed.length)} sudah sesuai`
          : ''}
        .
      </p>
      {shown.length ? (
        <Table aria-label="Pratinjau perubahan">
          <TableHeader>
            <TableRow>
              <TableHead>Lokasi</TableHead>
              <TableHead>Sebelum</TableHead>
              <TableHead>Sesudah</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-bold">{row.name}</TableCell>
                <TableCell className="whitespace-normal text-ink-muted">{row.before}</TableCell>
                <TableCell className="whitespace-normal">
                  {row.after}
                  {row.note ? (
                    <span className="block text-ink-muted text-sm">Catatan: {row.note}</span>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
      {changed.length > shown.length ? (
        <p className="text-ink-muted text-sm">
          Menampilkan {PREVIEW_ROWS} pertama dari {count.format(changed.length)} lokasi yang
          berubah.
        </p>
      ) : null}
    </section>
  );
}

/**
 * Edit massal: pilih jenis perubahan, lihat pratinjau per lokasi, lalu terapkan dalam satu
 * transaksi server. Edit terakhir bisa diurungkan dari tabel Lokasi.
 */
export function BulkEditDialog({
  venueId,
  ids,
  types,
  categories,
  onDone,
  onClose,
}: {
  venueId: VenueId;
  ids: readonly LocationId[];
  types: readonly LocationType[];
  categories: readonly CategoryWithUsage[];
  onDone: (editId: string) => void;
  onClose: () => void;
}) {
  const all = useLocations(venueId);
  const { apply } = useBulkEditMutations(venueId);
  const [draft, setDraft] = useState<Draft>({
    kind: 'status',
    status: 'active',
    openingDate: '',
    typeId: '',
    categoryId: '',
    hours: EMPTY_OPENING_HOURS,
  });
  const context: BulkEditContext = useMemo(
    () => ({
      statusLabel: (status) => LOCATION_STATUS_LABELS[status],
      types,
      categories,
    }),
    [types, categories],
  );
  const selected = useMemo(() => {
    const wanted = new Set<string>(ids);
    return (all.data ?? [])
      .filter((location: Location) => wanted.has(location.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'id', { numeric: true }));
  }, [all.data, ids]);

  const change = toChange(draft);
  const problems = change ? checkBulkChange(selected, change, context) : [];
  const rows = change && all.data ? previewBulkChange(selected, change, context) : [];
  const changedCount = rows.filter((r) => r.changed).length;
  const missing = all.data ? ids.length - selected.length : 0;
  const ready = change !== null && problems.length === 0 && changedCount > 0 && missing === 0;

  return (
    <Dialog open onOpenChange={(open) => !open && !apply.isPending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit massal {count.format(ids.length)} lokasi</DialogTitle>
          <DialogDescription>
            Perubahan diterapkan sekaligus dan tercatat di log audit. Edit massal terakhir bisa
            diurungkan dari tabel Lokasi.
          </DialogDescription>
        </DialogHeader>
        <Field id="bulk-kind" label="Perubahan">
          <Select
            value={draft.kind}
            onValueChange={(kind) => {
              apply.reset();
              setDraft({ ...draft, kind: kind as BulkChangeKind });
            }}
          >
            <SelectTrigger id="bulk-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {BULK_CHANGE_LABELS[kind]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <ChangeFields draft={draft} types={types} categories={categories} onChange={setDraft} />
        {all.isPending ? <Skeleton className="h-24 w-full" /> : null}
        {all.error ? <FormNotice tone="error">{all.error.message}</FormNotice> : null}
        {missing > 0 ? (
          <FormNotice tone="error">
            {count.format(missing)} lokasi terpilih sudah tidak ada. Tutup dialog lalu pilih ulang.
          </FormNotice>
        ) : null}
        {problems.length ? (
          <FormNotice tone="error">
            {problems.map((p) => BULK_EDIT_PROBLEM_MESSAGES[p]).join(' ')}
          </FormNotice>
        ) : null}
        {change && all.data && problems.length === 0 ? <PreviewTable rows={rows} /> : null}
        {apply.error ? <FormNotice tone="error">{apply.error.message}</FormNotice> : null}
        <DialogFooter>
          <Button disabled={apply.isPending} onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            disabled={!ready || apply.isPending}
            onClick={() =>
              change &&
              apply.mutate(
                { ids, change },
                {
                  onSuccess: (edit) => {
                    toast.success(`${count.format(edit.locationCount)} lokasi diubah`, {
                      description: 'Edit ini bisa diurungkan dari tabel Lokasi.',
                    });
                    onDone(edit.id);
                  },
                },
              )
            }
          >
            {apply.isPending ? 'Menerapkan…' : `Terapkan ke ${count.format(ids.length)} lokasi`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
