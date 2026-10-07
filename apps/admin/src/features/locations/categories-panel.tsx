import type { CategoryWithUsage } from '@indoor/data';
import { type LocationTypeId, moveCategory, type VenueId } from '@indoor/domain';
import {
  Button,
  type DataColumn,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  type FilterDef,
  hasActiveFilters,
  queryRows,
  toast,
} from '@indoor/ui';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { useState } from 'react';
import { Can } from '../../app/auth/can';
import { useTableState } from '../../hooks/use-table-state';
import { FacilityIconPreview } from '../facilities/facility-icon-preview';
import { iconSource } from '../facilities/icons';
import { CategoryDialog } from './category-dialog';
import { useCategories, useRemoveCategory, useReorderCategories } from './queries';

function DeleteCategoryDialog({
  venueId,
  category,
  onClose,
}: {
  venueId: VenueId;
  category: CategoryWithUsage;
  onClose: () => void;
}) {
  const remove = useRemoveCategory(venueId);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus kategori {category.name}?</DialogTitle>
          <DialogDescription>
            {category.usageCount > 0
              ? `Kategori ini dilepas dari ${category.usageCount} lokasi. Lokasinya sendiri tidak terhapus.`
              : 'Kategori ini belum dipakai lokasi mana pun.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(category.id, {
                onSuccess: () => {
                  toast.success(`Kategori ${category.name} dihapus`);
                  onClose();
                },
                onError: (error) =>
                  toast.error('Kategori tidak dihapus', { description: error.message }),
              })
            }
          >
            Hapus kategori
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Open =
  | { kind: 'form'; category: CategoryWithUsage | null }
  | { kind: 'delete'; category: CategoryWithUsage }
  | null;

const USAGE = { used: 'dipakai', unused: 'belum' } as const;

const FILTERS: FilterDef[] = [
  {
    kind: 'select',
    key: 'pemakaian',
    label: 'Pemakaian',
    allLabel: 'Semua kategori',
    options: [
      { value: USAGE.used, label: 'Dipakai lokasi' },
      { value: USAGE.unused, label: 'Belum dipakai' },
    ],
  },
];

/**
 * Kategori satu tipe lokasi; urutannya dipakai Visitor. Selama cari atau filter aktif urutan
 * tidak bisa diubah, karena baris tetangga yang terlihat belum tentu tetangga sebenarnya.
 */
export function CategoriesPanel({ venueId, typeId }: { venueId: VenueId; typeId: LocationTypeId }) {
  const categories = useCategories(venueId);
  const reorder = useReorderCategories(venueId);
  const [open, setOpen] = useState<Open>(null);
  const table = useTableState({ filters: FILTERS, prefix: 'kat.' });
  const list = (categories.data ?? []).filter((c) => c.locationTypeId === typeId);
  const canMove = !hasActiveFilters(table.state);
  const result = categories.data
    ? queryRows(list, table.state, {
        text: (category) => [category.name],
        filters: {
          pemakaian: (category, values) =>
            values.includes(category.usageCount > 0 ? USAGE.used : USAGE.unused),
        },
      })
    : undefined;

  function move(category: CategoryWithUsage, step: -1 | 1) {
    reorder.mutate(moveCategory(list, category.id, step), {
      onError: (error) => toast.error('Urutan tidak disimpan', { description: error.message }),
    });
  }

  const columns: DataColumn<CategoryWithUsage>[] = [
    {
      id: 'icon',
      header: 'Ikon',
      className: 'w-12',
      cell: (category) => (
        <FacilityIconPreview
          source={iconSource(category.icon)}
          isSafety={false}
          label={`Ikon ${category.name}`}
        />
      ),
    },
    { id: 'name', header: 'Nama', className: 'font-bold', cell: (category) => category.name },
    {
      id: 'usage',
      header: 'Dipakai',
      className: 'text-right font-mono tabular-nums',
      cell: (category) => category.usageCount,
    },
    {
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (category) => {
        const index = list.indexOf(category);
        return (
          <Can action="location.edit">
            <div className="flex justify-end gap-1">
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Naikkan ${category.name}`}
                disabled={!canMove || index === 0 || reorder.isPending}
                onClick={() => move(category, -1)}
              >
                <ArrowUpIcon />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Turunkan ${category.name}`}
                disabled={!canMove || index === list.length - 1 || reorder.isPending}
                onClick={() => move(category, 1)}
              >
                <ArrowDownIcon />
              </Button>
              <Button size="sm" onClick={() => setOpen({ kind: 'form', category })}>
                Ubah
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-danger"
                onClick={() => setOpen({ kind: 'delete', category })}
              >
                Hapus
              </Button>
            </div>
          </Can>
        );
      },
    },
  ];

  return (
    <div className="grid gap-4">
      <p className="text-ink-muted">
        Urutan di sini dipakai sebagai urutan kategori di Visitor.
        {canMove ? null : ' Kosongkan cari dan filter untuk mengubah urutan.'}
      </p>
      <DataTable
        label="Kategori"
        columns={columns}
        rows={result?.rows}
        rowKey={(category) => category.id}
        total={result?.total ?? 0}
        table={table}
        search={{ placeholder: 'Cari nama kategori' }}
        filters={FILTERS}
        error={categories.error?.message ?? null}
        onRetry={() => void categories.refetch()}
        actions={
          <Can action="location.edit">
            <Button variant="primary" onClick={() => setOpen({ kind: 'form', category: null })}>
              Tambah kategori
            </Button>
          </Can>
        }
        empty={
          <EmptyState
            title="Belum ada kategori"
            description="Tambah kategori, lalu pilih kategori itu di formulir lokasi."
          />
        }
      />
      {open?.kind === 'form' ? (
        <CategoryDialog
          venueId={venueId}
          typeId={typeId}
          category={open.category}
          others={list}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {open?.kind === 'delete' ? (
        <DeleteCategoryDialog
          venueId={venueId}
          category={open.category}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
