import {
  FIELD_TYPES,
  type FieldDefinition,
  type LocationType,
  reorderFields,
  type VenueId,
} from '@indoor/domain';
import {
  Badge,
  Button,
  type DataColumn,
  DataTable,
  EmptyState,
  type FilterDef,
  hasActiveFilters,
  queryRows,
  toast,
} from '@indoor/ui';
import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useTableState } from '../../hooks/use-table-state';
import { useReorderFields } from '../locations/queries';
import { FIELD_TYPE_LABELS } from './labels';

const TRAITS = {
  wajib: { label: 'Wajib', has: (f: FieldDefinition) => f.isRequired },
  tampil: { label: 'Tampil', has: (f: FieldDefinition) => f.isVisible },
  internal: { label: 'Internal', has: (f: FieldDefinition) => !f.isVisible },
  dicari: { label: 'Dapat dicari', has: (f: FieldDefinition) => f.isSearchable },
} as const;
const isTrait = (value: string): value is keyof typeof TRAITS => value in TRAITS;

const FILTERS: FilterDef[] = [
  {
    kind: 'multi',
    key: 'jenis',
    label: 'Jenis',
    options: FIELD_TYPES.map((value) => ({ value, label: FIELD_TYPE_LABELS[value] })),
  },
  {
    kind: 'select',
    key: 'sifat',
    label: 'Sifat',
    allLabel: 'Semua sifat',
    options: Object.entries(TRAITS).map(([value, trait]) => ({ value, label: trait.label })),
  },
];

/** Tabel field dan tabel kategori berbagi URL tab Tipe lokasi. */
export const FIELDS_PREFIX = 'f.';

/**
 * Field tipe lokasi dalam urutan tampil. Urutan diubah dengan menyeret baris, atau tombol
 * naik/turun untuk keyboard; urutan yang sama dipakai formulir lokasi dan Visitor. Selama
 * cari atau filter aktif urutan tidak bisa diubah: tetangga baris yang terlihat belum tentu
 * tetangganya di urutan sebenarnya.
 */
export function FieldsTable({
  venueId,
  type,
  canEdit,
  actions,
  onEdit,
  onRemove,
}: {
  venueId: VenueId;
  type: LocationType;
  canEdit: boolean;
  actions: ReactNode;
  onEdit: (field: FieldDefinition) => void;
  onRemove: (field: FieldDefinition) => void;
}) {
  const reorder = useReorderFields(venueId);
  const [dragging, setDragging] = useState<string | null>(null);
  const table = useTableState({ filters: FILTERS, prefix: FIELDS_PREFIX });
  const fields = type.fields;
  const canMove = canEdit && !hasActiveFilters(table.state);
  const result = queryRows(fields, table.state, {
    text: (field) => [field.label, field.key, ...(field.type === 'select' ? field.options : [])],
    filters: {
      jenis: (field, values) => values.includes(field.type),
      sifat: (field, [trait = '']) => isTrait(trait) && TRAITS[trait].has(field),
    },
  });

  function moveTo(id: string, index: number) {
    reorder.mutate(reorderFields(fields, id, index), {
      onError: (error) => toast.error('Urutan tidak disimpan', { description: error.message }),
    });
  }

  const columns: DataColumn<FieldDefinition>[] = [
    ...(canMove
      ? [
          {
            id: 'grip',
            header: <span className="sr-only">Seret</span>,
            className: 'w-8 cursor-grab text-ink-muted',
            cell: () => <GripVerticalIcon aria-hidden="true" className="size-4" />,
          },
        ]
      : []),
    {
      id: 'label',
      header: 'Label',
      cell: (field) => (
        <>
          <span className="font-bold">{field.label}</span>
          <span className="block font-mono text-ink-muted text-sm">{field.key}</span>
        </>
      ),
    },
    {
      id: 'type',
      header: 'Jenis',
      className: 'whitespace-normal',
      cell: (field) => (
        <>
          {FIELD_TYPE_LABELS[field.type]}
          {field.type === 'select' ? (
            <span className="block text-ink-muted text-sm">{field.options.join(', ')}</span>
          ) : null}
        </>
      ),
    },
    {
      id: 'traits',
      header: 'Sifat',
      cell: (field) => (
        <div className="flex flex-wrap gap-1">
          {field.isRequired ? <Badge>Wajib</Badge> : null}
          {field.isVisible ? <Badge>Tampil</Badge> : <Badge>Internal</Badge>}
          {field.isSearchable ? <Badge>Dapat dicari</Badge> : null}
        </div>
      ),
    },
    ...(canEdit
      ? [
          {
            id: 'actions',
            header: 'Aksi',
            className: 'text-right',
            cell: (field: FieldDefinition) => {
              const index = fields.indexOf(field);
              return (
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Naikkan ${field.label}`}
                    disabled={!canMove || index === 0 || reorder.isPending}
                    onClick={() => moveTo(field.id, index - 1)}
                  >
                    <ArrowUpIcon aria-hidden="true" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Turunkan ${field.label}`}
                    disabled={!canMove || index === fields.length - 1 || reorder.isPending}
                    onClick={() => moveTo(field.id, index + 1)}
                  >
                    <ArrowDownIcon aria-hidden="true" />
                  </Button>
                  <Button size="sm" onClick={() => onEdit(field)}>
                    Ubah
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onRemove(field)}>
                    Hapus
                  </Button>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="grid gap-2">
      <DataTable
        label="Field"
        columns={columns}
        rows={result.rows}
        rowKey={(field) => field.id}
        total={result.total}
        table={table}
        search={{ placeholder: 'Cari label, kunci, atau opsi field' }}
        filters={FILTERS}
        actions={actions}
        rowProps={(field) => ({
          draggable: canMove,
          onDragStart: () => setDragging(field.id),
          onDragEnd: () => setDragging(null),
          onDragOver: (e) => {
            if (dragging) e.preventDefault();
          },
          onDrop: (e) => {
            e.preventDefault();
            if (dragging && dragging !== field.id) moveTo(dragging, fields.indexOf(field));
            setDragging(null);
          },
          className: dragging === field.id ? 'opacity-50' : undefined,
        })}
        empty={
          <EmptyState
            title="Belum ada field"
            description="Tambah field untuk informasi khusus tipe ini, misalnya nomor telepon."
          />
        }
      />
      {canEdit && !canMove ? (
        <p className="text-ink-muted text-sm">
          Kosongkan cari dan filter untuk mengubah urutan field.
        </p>
      ) : null}
    </div>
  );
}
